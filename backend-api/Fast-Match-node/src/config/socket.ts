import { Server, Socket } from 'socket.io';
import { generateStreamToken, getStreamApiKey, createStreamCall } from "@helpers/stream";
import { jwtManager } from '@helpers/jwt';
import { User } from '@models/user';
import { Transaction } from '@models/transaction';
import { UserGift } from '@models/userGift';
import { MatchHistory } from '@models/matchHistory';
import { FriendModel } from '@models/friend';
import matchService from '@services/match.services';
import chatService from '@services/chat.services';
import blockService from '@services/block.service';
import mongoose, { Types } from 'mongoose';

// ─── Socket Event Interfaces ──────────────────────────────────
export interface serverEvents {
    connected: (data: { success: boolean; user: { _id: any; displayName: string } }) => void;
    'match-found': (data: { success: boolean; match: any; matchedUser: any }) => void;
    'incoming-match-request': (data: { matchId: string; remoteUser: any }) => void;
    searching: (data: { success: boolean; queuePosition: number }) => void;
    'no-match-found': (data: { message: string }) => void;
    'match-error': (data: { message: string }) => void;
    'match-declined': (data: { match: any }) => void;
    'match-accepted': (data: { success: boolean; match: any; bothAccepted: boolean }) => void;
    'partner-accepted': (data: { match: any }) => void;
    'call-start': (data: { success: boolean; match: any; role: 'caller' | 'callee'; remoteUser: any; streamToken: any; callId: string }) => void;
    'ping-presence': (data: { matchId: string }) => void;
    'call-ended': (data: { match: any; endedBy: string; message?: string }) => void;
    'receive-message': (data: any) => void;
    'new-message-notification': (data: { senderId: string; totalUnreadCount: number; message: string }) => void;
    'message-sent': (data: any) => void;
    'chat-error': (data: { message: string }) => void;
    'unread-count-update': (data: { totalUnreadCount: number }) => void;
    'gift-received': (data: { from: string, giftName: string, senderName: string }) => void;
    'gift-sent-success': (data: { newBalance: number }) => void;
    'gift-error': (data: { message: string }) => void;
}

export interface clientEvents {
    'find-match': (data: { preference?: string }) => void;
    'stop-search': () => void;
    'match-request': (data: { matchId: string }) => void;
    'match-skip': (data: { matchId: string }) => void;
    'match-response': (data: { matchId: string; response: 'accepted' | 'declined' }) => void;
    'pong-presence': (data: { matchId: string }) => void;
    'match-cancel': (data: { matchId: string }) => void;
    'end-call': (data: { matchId: string }) => void;
    'send-message': (data: { receiverId: string; message: string }) => void;
    'send-gift': (data: { receiverId: string; giftName: string; coinCost: number }) => void;
    'super-request': (data: { targetUserId: string; coinCost: number }) => void;
    disconnect: () => void;
}

// ─── Types ────────────────────────────────────────────────────
interface QueueUser {
    userId: string;
    socketId: string;
    preference: string;
    gender: string;
    interests: string[];
    location: string;
    language: string;
    isPremium: boolean;
    joinedAt: number;
    user: any;
    isMatching?: boolean;
}

// ─── In-Memory State ──────────────────────────────────────────
const matchmakingQueue: Map<string, QueueUser> = new Map();
const onlineUsersMap: Map<string, any> = new Map(); // All connected users (app open)
const userSocketMap: Map<string, string> = new Map();
const socketUserMap: Map<string, string> = new Map();
const activeCalls: Map<string, { user1Id: string; user2Id: string }> = new Map();
const searchStartTimes: Map<string, number> = new Map();

// Track skipped users per search session (cleared on stop-search/disconnect)
const skippedUsersMap: Map<string, Set<string>> = new Map();

// 🚨 Track rejected users to avoid immediate re-matching
// Key: userId, Value: Set of userIds they have declined
const rejectedUsersMap: Map<string, Set<string>> = new Map();

interface PendingVerification {
    timeout: any;
    presenceCheck: { u1Ok: boolean; u2Ok: boolean; started: boolean; aborted: boolean };
    s1: string;
    s2: string;
    match: any;
    u1Id: string;
    u2Id: string;
}
const activeVerifications: Map<string, PendingVerification> = new Map();

// ─── Helpers ──────────────────────────────────────────────────

const addToQueue = (userId: string, socketId: string, userObj: any, preference: string) => {
    if (!searchStartTimes.has(userId)) searchStartTimes.set(userId, Date.now());
    matchmakingQueue.set(userId, {
        userId, socketId, preference,
        gender: userObj.gender || 'other',
        interests: userObj.interests || [],
        location: userObj.location || '',
        language: userObj.language || '',
        isPremium: userObj.isPremium === 'premium',
        joinedAt: Date.now(),
        user: { _id: userObj._id, displayName: userObj.displayName }
    });
};

const handleStage1Cleanup = async (io: Server, userId: string) => {
    try {
        // 🚨 DB Connection Check: Skip if mongoose is not connected
        if (mongoose.connection.readyState !== 1) return;

        const activeMatch = await matchService.getActiveMatch(new Types.ObjectId(userId));
        if (activeMatch && activeMatch.matchStatus === 'pending') {
            const otherUser = activeMatch.user1._id.toString() === userId ? activeMatch.user2 : activeMatch.user1;
            const otherSid = userSocketMap.get(otherUser._id.toString());
            await matchService.respondToMatch(activeMatch._id, new Types.ObjectId(userId), 'declined');
            if (otherSid) {
                io.to(otherSid).emit('match-declined', { match: activeMatch });
                io.to(otherSid).emit('match-error', { message: 'Partner left the search.' });
            }
        }
    } catch (err) { console.error("Cleanup error:", err); }
};

const startActualCall = async (io: Server, matchId: string, u1Id: string, u2Id: string, s1: string, s2: string, match: any) => {
    try {
        activeCalls.set(matchId, { user1Id: u1Id, user2Id: u2Id });
        await createStreamCall(matchId, u1Id, [u1Id, u2Id]);
        if (!activeCalls.has(matchId)) return;
        const token1 = await generateStreamToken(u1Id);
        const token2 = await generateStreamToken(u2Id);
        io.to(s1).emit('call-start', { success: true, match, role: 'caller', remoteUser: match.user2, streamToken: { token: token1, apiKey: getStreamApiKey(), userId: u1Id }, callId: matchId });
        io.to(s2).emit('call-start', { success: true, match, role: 'callee', remoteUser: match.user1, streamToken: { token: token2, apiKey: getStreamApiKey(), userId: u2Id }, callId: matchId });

        // AI Icebreaker Generation (Simulation based on mutual interests)
        const user1Interests = match.user1.interests || [];
        const user2Interests = match.user2.interests || [];
        const mutualInterests = user1Interests.filter((i: string) => user2Interests.includes(i));
        
        let icebreakerMessage = "What's the best thing that happened to you today?";
        if (mutualInterests.length > 0) {
            icebreakerMessage = `You both like ${mutualInterests[0]}! What is your favorite thing about it?`;
        }

        // Delay icebreaker by a few seconds so it appears after they connect
        setTimeout(() => {
            io.to(s1).emit('icebreaker-received', icebreakerMessage);
            io.to(s2).emit('icebreaker-received', icebreakerMessage);
        }, 3000);

        // 2-Minute Time Limit for Free Users
        if (match.user1.isPremium === 'free' && match.user2.isPremium === 'free') {
            setTimeout(async () => {
                if (activeCalls.has(matchId)) {
                    io.to(s1).emit('call-limit-reached', { message: 'Time limit reached. Upgrade to Premium for unlimited calls!' });
                    io.to(s2).emit('call-limit-reached', { message: 'Time limit reached. Upgrade to Premium for unlimited calls!' });
                    
                    // Auto end call
                    const m = await matchService.endCall(new Types.ObjectId(matchId), new Types.ObjectId(u1Id));
                    io.to(s1).emit('call-ended', { match: m, endedBy: 'system' });
                    io.to(s2).emit('call-ended', { match: m, endedBy: 'system' });
                    activeCalls.delete(matchId);
                }
            }, 120000); // 120 seconds
        }

    } catch (err) { console.error("Call start error:", err); }
};

// Check if user has no interests set → qualifies for random matching
const hasNoInterests = (interests: string[]): boolean => {
    return !interests || interests.length === 0 || interests.every(i => !i.trim());
};

const findCompatibleOnlineUser = async (currentUser: QueueUser): Promise<any | null> => {
    let bestMatch: any | null = null;
    let highestScore = -1;
    const myInterests = currentUser.interests.map((i: string) => i.toLowerCase().trim());
    const mySkipped = skippedUsersMap.get(currentUser.userId) || new Set();

    for (const [userId] of onlineUsersMap.entries()) {
        if (userId === currentUser.userId) continue;

        // Skip if user is in active call
        if (activeCalls.has(userId)) continue;
        // Skip if user is already being matched (isMatching flag in queue)
        const qEntry = matchmakingQueue.get(userId);
        if (qEntry && qEntry.isMatching) continue;
        // Check if they are part of an active verification
        let inVerification = false;
        for (const v of activeVerifications.values()) {
            if (v.u1Id === userId || v.u2Id === userId) { inVerification = true; break; }
        }
        if (inVerification) continue;

        // Skip if already skipped in this session (temporary skip)
        if (mySkipped.has(userId)) continue;

        // Skip rejected users (session only)
        if (rejectedUsersMap.get(currentUser.userId)?.has(userId)) continue;
        if (rejectedUsersMap.get(userId)?.has(currentUser.userId)) continue;
        
        // Skip recently declined (within 1 hour instead of 24 hours to allow retry later)
        const recentDecline = await MatchHistory.findOne({
            $or: [
                { user1: currentUser.userId, user2: userId, matchStatus: 'declined' },
                { user1: userId, user2: currentUser.userId, matchStatus: 'declined' }
            ],
            createdAt: { $gte: new Date(Date.now() - 1 * 60 * 60 * 1000) }
        }).lean();
        if (recentDecline) continue;

        // 🔄 Fetch FRESH data from DB for this candidate
        const freshCandidate = await User.findById(userId).select('-password').lean();
        if (!freshCandidate) continue;

        // Block Check (full block + call-only block)
        const myBlockedList = currentUser.user.blockedUsers?.map((id: any) => id.toString()) || [];
        const theirBlockedList = (freshCandidate.blockedUsers || []).map((id: any) => id.toString());
        if (myBlockedList.includes(userId) || theirBlockedList.includes(currentUser.userId)) continue;
        const myCallBlockedList = currentUser.user.blockedCalls?.map((id: any) => id.toString()) || [];
        const theirCallBlockedList = (freshCandidate.blockedCalls || []).map((id: any) => id.toString());
        if (myCallBlockedList.includes(userId) || theirCallBlockedList.includes(currentUser.userId)) continue;

        // Gender preference check
        const up = currentUser.preference || 'everyone';
        const candidateGender = freshCandidate.gender;
        const candidatePref = freshCandidate.preference || 'everyone';
        const searcherGender = (currentUser.gender && currentUser.gender !== 'other') ? currentUser.gender : null;
        if (up !== 'everyone' && candidateGender && up !== candidateGender) continue;
        if (candidatePref !== 'everyone' && searcherGender && candidatePref !== searcherGender) continue;

        const theirInterests = (freshCandidate.interests || []).map((i: string) => i.toLowerCase().trim());
        const common = myInterests.filter((i: string) => theirInterests.includes(i));
        const isAlsoSearching = matchmakingQueue.has(userId);

        let score = 0;

        // 1. Online Status (Active Searching gets huge priority)
        if (isAlsoSearching) {
            score += 10000;
        } else {
            score += 1000; // They are online but not actively in the fast-match queue
        }

        // 2. Matching Interests
        if (common.length > 0) {
            score += common.length * 1000;
        }

        // 3. Language Match
        if (currentUser.user.language && freshCandidate.language && currentUser.user.language === freshCandidate.language) {
            score += 500;
        }

        // 4. Location Match
        if (currentUser.location && freshCandidate.location && currentUser.location === freshCandidate.location) {
            score += 100;
        }

        if (score > highestScore) {
            highestScore = score;
            bestMatch = {
                matchedUserId: userId,
                displayName: freshCandidate.displayName,
                isAlsoSearching: isAlsoSearching,
                matchType: common.length > 0 ? 'interest' : 'random'
            };
        }
    }
    return bestMatch;
};

// ─── Main Logic ───────────────────────────────────────────────

export const initializeSocket = (io: Server): Server => {
    // 🚨 Authentication Middleware
    io.use(async (socket, next) => {
        try {
            let token = socket.handshake.auth?.token || socket.handshake.headers?.['x-access-token'] as string;
            if (!token) return next(new Error('Auth token required.'));
            if (token.startsWith('Bearer ')) token = token.split(' ')[1];
            const tokenDetails: any = new jwtManager().decryptToken(token);
            if (!tokenDetails?.success) return next(new Error('Invalid token.'));
            const user = await User.findById(tokenDetails.payload._id).select('-password').lean();
            if (!user) return next(new Error('User not found.'));
            (socket as any).user = user;
            next();
        } catch (e) { next(new Error('Auth failed')); }
    });

    // ─── Matchmaking Loop (Runs every 1.5s) ──────────────────
    let lastQueueNames = '';
    const MATCHMAKING_BATCH_SIZE = 5;
    const MATCH_TIMEOUT_MS = 30000;
    setInterval(async () => {
        if (mongoose.connection.readyState !== 1) return;

        // 📊 Smart Queue Logs
        const currentNames = Array.from(matchmakingQueue.values()).map(u => u.user.displayName).sort().join(', ');
        if (currentNames !== lastQueueNames) {
            if (currentNames) {
                console.log(`[ matchmaking ] ⏳ Queue status changed: [${currentNames}]`);
            } else if (lastQueueNames) {
                console.log(`[ matchmaking ] ⏳ Queue is now empty.`);
            }
            lastQueueNames = currentNames;
        }

        if (matchmakingQueue.size < 1) return;

        // Timeout stale pending matches in activeVerifications
        const now = Date.now();
        for (const [mid, v] of activeVerifications.entries()) {
            if (now - (v.match?.matchedAt?.getTime() || now) > MATCH_TIMEOUT_MS) {
                clearTimeout(v.timeout);
                activeVerifications.delete(mid);
                [v.s1, v.s2].forEach(s => { io.to(s).emit('match-error', { message: 'Match timed out.' }); });
                // Re-queue both users
                const u1Entry = matchmakingQueue.get(v.u1Id);
                if (u1Entry) u1Entry.isMatching = false;
                const u2Entry = matchmakingQueue.get(v.u2Id);
                if (u2Entry) u2Entry.isMatching = false;
                console.log(`[ matchmaking ] ⏰ Match ${mid} timed out, users re-queued.`);
            }
        }

        let processed = 0;
        for (const [userId, user] of matchmakingQueue.entries()) {
            if (processed >= MATCHMAKING_BATCH_SIZE) break;
            if (user.isMatching) continue;

            const match = await findCompatibleOnlineUser(user);
            if (match) {
                user.isMatching = true;

                const otherQueueEntry = matchmakingQueue.get(match.matchedUserId);
                if (otherQueueEntry) otherQueueEntry.isMatching = true;

                try {
                    const m = await matchService.createMatch(
                        new Types.ObjectId(userId),
                        new Types.ObjectId(match.matchedUserId),
                        user.preference,
                        match.matchType || 'interest'
                    );
                    const matchData = await matchService.getMatchDetails(m._id as Types.ObjectId);

                    const user1Details = matchData.user1;
                    const user2Details = matchData.user2;
                    const matchedUserForSearcher = matchData.user1._id.toString() === userId ? user2Details : user1Details;
                    const searcherDetailsForOther = matchData.user1._id.toString() === userId ? user1Details : user2Details;

                    // Always emit to the searcher
                    io.to(user.socketId).emit('match-found', { success: true, match: matchData, matchedUser: matchedUserForSearcher, matchType: match.matchType || 'interest' });

                    // If matched user is ALSO searching, emit to them too
                    if (match.isAlsoSearching) {
                        const otherSid = userSocketMap.get(match.matchedUserId);
                        if (otherSid) {
                            io.to(otherSid).emit('match-found', { success: true, match: matchData, matchedUser: searcherDetailsForOther, matchType: match.matchType || 'interest' });
                        }
                        console.log(`[ loop ] ✅ Mutual match: ${user.user.displayName} ↔ ${match.displayName} (both searching, type: ${match.matchType})`);
                    } else {
                        console.log(`[ loop ] ✅ Found for ${user.user.displayName}: ${match.displayName} (online idle, type: ${match.matchType})`);
                    }
                } catch (err) {
                    user.isMatching = false;
                    if (otherQueueEntry) otherQueueEntry.isMatching = false;
                    console.error("Match error:", err);
                }
                processed++;
            }
        }
    }, 1500);

    io.on('connection', async (socket: Socket) => {
        const user = (socket as any).user;
        const userId = user._id.toString();
        userSocketMap.set(userId, socket.id);
        socketUserMap.set(socket.id, userId);

        // Register in onlineUsersMap (all connected users)
        onlineUsersMap.set(userId, {
            displayName: user.displayName,
            gender: user.gender || 'other',
            preference: user.preference || 'everyone',
            interests: user.interests || [],
            location: user.location || '',
            language: user.language || '',
            isPremium: user.isPremium === 'premium',
            blockedUsers: user.blockedUsers || [],
            blockedCalls: user.blockedCalls || []
        });

        matchService.setUserOnlineStatus(user._id as Types.ObjectId, true, socket.id);
        socket.join(userId);

        const totalUnreadCount = await chatService.getTotalUnreadCount(user._id as Types.ObjectId);
        socket.emit('unread-count-update', { totalUnreadCount });
        socket.emit('connected', { success: true, user: { _id: user._id, displayName: user.displayName } });

        socket.on('find-match', async (data: { preference?: string }) => {
            if (!searchStartTimes.has(userId)) searchStartTimes.set(userId, Date.now());

            // 🔄 REFRESH USER DATA: Fetch latest from DB (catches recent unblocks/profile updates)
            const freshUser = await User.findById(userId).lean();
            if (!freshUser) return socket.emit('match-error', { message: 'User not found' });

            console.log(`[ find-match ] 📥 Raw Payload from ${freshUser.displayName}:`, JSON.stringify(data));

            const incomingPref = data?.preference || (data as any)?.genderPreference || (data as any)?.gender_preference;
            let finalPreference = incomingPref || freshUser.preference || 'everyone';

            if (incomingPref && incomingPref !== freshUser.preference) {
                if (mongoose.connection.readyState === 1) {
                    await User.updateOne({ _id: userId }, { preference: incomingPref });
                    console.log(`[ preference ] 🔄 Updated preference for ${freshUser.displayName} in DB: ${incomingPref}`);
                }
            }

            // Update the socket's user object so other events also use fresh data
            (socket as any).user = freshUser;

            matchmakingQueue.set(userId, {
                userId,
                socketId: socket.id,
                preference: finalPreference,
                gender: freshUser.gender || 'other',
                interests: freshUser.interests || [],
                location: freshUser.location || '',
                language: freshUser.language || '',
                isPremium: freshUser.isPremium === 'premium',
                joinedAt: Date.now(),
                user: {
                    _id: freshUser._id,
                    displayName: freshUser.displayName,
                    blockedUsers: freshUser.blockedUsers || [],
                    blockedCalls: freshUser.blockedCalls || []
                }
            });
            console.log(`[ search ] 📥 User ${freshUser.displayName} joined queue (Data Refreshed). Size: ${matchmakingQueue.size}`);
            socket.emit('searching', { success: true, queuePosition: matchmakingQueue.size });
        });

        socket.on('stop-search', async () => {
            matchmakingQueue.delete(userId);
            searchStartTimes.delete(userId);
            skippedUsersMap.delete(userId); // Clear skip list on stop
            rejectedUsersMap.delete(userId); // 🚨 Clear skip list on stop
            await handleStage1Cleanup(io, userId);
        });

        // 🆕 User 1 (searcher) clicks "Request" → sends request to idle User 2
        socket.on('match-request', async (data: { matchId: string }) => {
            try {
                if (mongoose.connection.readyState !== 1) return socket.emit('match-error', { message: 'DB Connection busy' });

                // Check blocking before sending request
                const match = await matchService.getMatchDetails(new Types.ObjectId(data.matchId));
                if (!match) return socket.emit('match-error', { message: 'Match not found' });
                const otherUserInMatch = match.user1._id.toString() === userId ? match.user2 : match.user1;
                const otherIdStr = otherUserInMatch._id.toString();
                const callBlock = await blockService.canCallUser(userId, otherIdStr);
                if (!callBlock.allowed) return socket.emit('match-error', { message: callBlock.reason });
                
                // Mark User 1 as accepted
                const result = await matchService.respondToMatch(new Types.ObjectId(data.matchId), user._id, 'accepted');
                
                // Find the other (idle) user
                const other = result.match.user1._id.toString() === userId ? result.match.user2 : result.match.user1;
                const otherSid = userSocketMap.get(otherIdStr);

                if (otherSid) {
                    // Send incoming-match-request to idle User 2 with searcher's profile
                    const freshCurrentUser = await User.findById(userId).select('-password').lean();
                    io.to(otherSid).emit('incoming-match-request', {
                        matchId: data.matchId,
                        remoteUser: freshCurrentUser
                    });
                    console.log(`[ request ] 🔔 ${user.displayName} sent request to ${other.displayName}`);
                } else {
                    socket.emit('match-error', { message: 'User went offline' });
                }

                socket.emit('match-accepted', { success: true, match: result.match, bothAccepted: false });
            } catch (e) { socket.emit('match-error', { message: 'Request failed' }); }
        });

        // 🆕 Super Match Request
        socket.on('super-request', async (data: { targetUserId: string, coinCost: number }) => {
            try {
                if (mongoose.connection.readyState !== 1) return socket.emit('match-error', { message: 'Database busy' });

                const sender = await User.findById(userId);
                const target = await User.findById(data.targetUserId);

                if (!sender || !target) return socket.emit('match-error', { message: 'User not found' });
                if ((sender.walletBalance || 0) < data.coinCost) return socket.emit('match-error', { message: 'Insufficient coins for Super Match' });

                // Check blocks
                const callBlock = await blockService.canCallUser(userId, data.targetUserId);
                if (!callBlock.allowed) return socket.emit('match-error', { message: callBlock.reason });

                // Deduct coins & Log
                sender.walletBalance = (sender.walletBalance || 0) - data.coinCost;
                await sender.save();

                await Transaction.create([
                    { userId: sender._id, type: 'super_match', amount: -data.coinCost, relatedUserId: target._id, description: `Super Match sent` }
                ]);

                // Create match
                const match = await matchService.createMatch(new Types.ObjectId(userId), new Types.ObjectId(data.targetUserId), 'everyone', 'super_match');
                
                // Mark sender as accepted immediately
                const result = await matchService.respondToMatch(match._id, sender._id, 'accepted');

                // Notify target
                const targetSid = userSocketMap.get(data.targetUserId);
                if (targetSid) {
                    const freshCurrentUser = await User.findById(userId).select('-password').lean();
                    io.to(targetSid).emit('incoming-match-request', {
                        matchId: match._id.toString(),
                        remoteUser: freshCurrentUser,
                        isSuperMatch: true
                    });
                }

                // Notify sender success
                socket.emit('match-accepted', { success: true, match: result.match, bothAccepted: false });

            } catch (error) {
                console.error("Super Request error", error);
                socket.emit('match-error', { message: 'Super request failed' });
            }
        });

        // 🆕 User 1 (searcher) clicks "Skip" → skip this user and find next
        socket.on('match-skip', async (data: { matchId: string }) => {
            try {
                if (mongoose.connection.readyState !== 1) return socket.emit('match-error', { message: 'DB Connection busy' });

                // Decline the current match in DB
                await matchService.respondToMatch(new Types.ObjectId(data.matchId), user._id, 'declined');
                
                // Find the other user and add to skip list
                const match = await matchService.getMatchDetails(new Types.ObjectId(data.matchId));
                const other = match.user1._id.toString() === userId ? match.user2 : match.user1;
                const otherIdStr = other._id.toString();

                // Decrease trust score of the skipped user
                await User.findByIdAndUpdate(otherIdStr, { $inc: { trustScore: -2 } });

                // Persist to session map
                if (!skippedUsersMap.has(userId)) skippedUsersMap.set(userId, new Set());
                skippedUsersMap.get(userId)?.add(otherIdStr);

                // Persist to database (for cross-session)
                await User.findByIdAndUpdate(userId, {
                    $addToSet: { skippedUsers: { userId: new Types.ObjectId(otherIdStr), skippedAt: new Date() } }
                });

                // Reset isMatching and keep user in queue for next match
                const queueUser = matchmakingQueue.get(userId);
                if (queueUser) queueUser.isMatching = false;

                console.log(`[ skip ] ⏭️ ${user.displayName} skipped ${other.displayName}, finding next...`);
                socket.emit('searching', { success: true, queuePosition: matchmakingQueue.size });
            } catch (e) { socket.emit('match-error', { message: 'Skip failed' }); }
        });

        // User 2 (idle) responds to incoming-match-request with accept/decline
        socket.on('match-response', async (data) => {
            try {
                if (mongoose.connection.readyState !== 1) return socket.emit('match-error', { message: 'DB Connection busy' });

                // If accepting, check blocking (full block + call-only block)
                if (data.response === 'accepted') {
                    const matchCheck = await matchService.getMatchDetails(new Types.ObjectId(data.matchId));
                    if (matchCheck) {
                        const otherUser = matchCheck.user1._id.toString() === userId ? matchCheck.user2 : matchCheck.user1;
                        const otherIdStr = otherUser._id.toString();
                        const canCall = await blockService.canCallUser(userId, otherIdStr);
                        if (!canCall.allowed) return socket.emit('match-error', { message: canCall.reason });
                    }
                }

                const result = await matchService.respondToMatch(new Types.ObjectId(data.matchId), user._id, data.response);
                if (data.response === 'declined') {
                    const other = result.match.user1._id.toString() === userId ? result.match.user2 : result.match.user1;
                    const otherIdStr = other._id.toString();
                    const otherSid = userSocketMap.get(otherIdStr);

                        // Add to searcher's skip list for THIS session
                    if (!skippedUsersMap.has(otherIdStr)) skippedUsersMap.set(otherIdStr, new Set());
                    skippedUsersMap.get(otherIdStr)?.add(userId);

                    // Persist decline to database (cross-session)
                    await User.findByIdAndUpdate(otherIdStr, {
                        $addToSet: { skippedUsers: { userId: new Types.ObjectId(userId), skippedAt: new Date() } }
                    });

                    socket.emit('match-declined', { match: result.match });
                    if (otherSid) io.to(otherSid).emit('match-declined', { match: result.match });

                    // Requeue the searcher (other user) to find next match
                    if (otherSid) {
                        const otherSocket = io.sockets.sockets.get(otherSid);
                        if (otherSocket) {
                            const otherUserObj = (otherSocket as any).user;
                            const queueEntry = matchmakingQueue.get(otherIdStr);
                            if (queueEntry) queueEntry.isMatching = false;
                            else addToQueue(otherIdStr, otherSid, otherUserObj, result.match.preference);
                            io.to(otherSid).emit('searching', { success: true, queuePosition: matchmakingQueue.size });
                        }
                    }
                    console.log(`[ reject ] ❌ ${user.displayName} rejected request from ${other.displayName}`);
                    return;
                }
                socket.emit('match-accepted', { success: true, match: result.match, bothAccepted: result.bothAccepted });
                if (result.bothAccepted) {
                    const m = result.match;
                    const u1Id = m.user1._id.toString();
                    const u2Id = m.user2._id.toString();
                    const s1 = userSocketMap.get(u1Id);
                    const s2 = userSocketMap.get(u2Id);

                    // Remove searcher from queue
                    matchmakingQueue.delete(u1Id);
                    matchmakingQueue.delete(u2Id);
                    searchStartTimes.delete(u1Id);
                    searchStartTimes.delete(u2Id);

                    if (s1 && s2) {
                        // Emit match-accepted to BOTH users
                        io.to(s1).emit('match-accepted', { success: true, match: m, bothAccepted: true });
                        io.to(s2).emit('match-accepted', { success: true, match: m, bothAccepted: true });

                        // Directly start the call (no presence check needed)
                        await startActualCall(io, data.matchId, u1Id, u2Id, s1, s2, m);
                    }
                    console.log(`[ accept ] ✅ Both accepted! ${m.user1.displayName} ↔ ${m.user2.displayName} → Call started!`);
                } else {
                    const other = result.match.user1._id.toString() === userId ? result.match.user2 : result.match.user1;
                    const otherSid = userSocketMap.get(other._id.toString());
                    if (otherSid) io.to(otherSid).emit('partner-accepted', { match: result.match });
                }
            } catch (e) { socket.emit('match-error', { message: 'Action failed' }); }
        });

        socket.on('pong-presence', (data) => {
            const v = activeVerifications.get(data.matchId);
            if (v) {
                if (socket.id === v.s1) v.presenceCheck.u1Ok = true;
                if (socket.id === v.s2) v.presenceCheck.u2Ok = true;
                if (v.presenceCheck.u1Ok && v.presenceCheck.u2Ok && !v.presenceCheck.started) {
                    v.presenceCheck.started = true; clearTimeout(v.timeout); activeVerifications.delete(data.matchId);
                    startActualCall(io, data.matchId, v.u1Id, v.u2Id, v.s1, v.s2, v.match);
                }
            }
        });

        socket.on('match-cancel', async (data) => {
            const v = activeVerifications.get(data.matchId);
            if (v) {
                v.presenceCheck.aborted = true; clearTimeout(v.timeout); activeVerifications.delete(data.matchId);
                [v.s1, v.s2].forEach(s => { io.to(s).emit('match-error', { message: 'Partner cancelled.' }); io.to(s).emit('call-ended', { match: v.match, endedBy: userId }); });
            }
            const call = activeCalls.get(data.matchId);
            if (call) {
                const other = call.user1Id === userId ? call.user2Id : call.user1Id;
                const otherSid = userSocketMap.get(other);
                if (otherSid) io.to(otherSid).emit('call-ended', { message: 'Partner left.', endedBy: userId });
                activeCalls.delete(data.matchId);
            }
            await handleStage1Cleanup(io, userId);
        });

        socket.on('end-call', async (data) => {
            try {
                if (mongoose.connection.readyState !== 1) return;
                const m = await matchService.endCall(new Types.ObjectId(data.matchId), user._id);
                const call = activeCalls.get(data.matchId);
                if (call) {
                    const other = call.user1Id === userId ? call.user2Id : call.user1Id;
                    const otherSid = userSocketMap.get(other);
                    if (otherSid) io.to(otherSid).emit('call-ended', { match: m, endedBy: userId });
                    activeCalls.delete(data.matchId);
                }
                socket.emit('call-ended', { match: m, endedBy: userId });
            } catch (e) {
                socket.emit('match-error', { message: 'End call failed' });
            }
        });

        socket.on('send-message', async (data) => {
            try {
                if (mongoose.connection.readyState !== 1) return socket.emit('chat-error', { message: 'DB Connection busy' });

                // Check if they are friends
                const isFriend = await FriendModel.findOne({
                    $or: [
                        { requester: userId, recipient: data.receiverId },
                        { requester: data.receiverId, recipient: userId }
                    ],
                    status: 'accepted'
                });

                if (!isFriend) {
                    return socket.emit('chat-error', { message: 'You can only message accepted friends.' });
                }

                const { savedMsg, amIBlocked } = await chatService.saveMessage(userId, data.receiverId, data.message, data.messageType || 'text');
                if (!amIBlocked) {
                    io.to(data.receiverId).emit('receive-message', savedMsg);
                    const count = await chatService.getTotalUnreadCount(new Types.ObjectId(data.receiverId));
                    io.to(data.receiverId).emit('unread-count-update', { totalUnreadCount: count });
                    io.to(data.receiverId).emit('new-message-notification', { senderId: userId, totalUnreadCount: count, message: savedMsg.message });
                }
                socket.emit('message-sent', savedMsg);
            } catch (e) { socket.emit('chat-error', { message: 'Message failed' }); }
        });

        socket.on('typing', (data) => {
            io.to(data.receiverId).emit('typing', { senderId: userId });
        });

        socket.on('stopTyping', (data) => {
            io.to(data.receiverId).emit('stopTyping', { senderId: userId });
        });

        socket.on('messageRead', async (data) => {
            try {
                // Update message as read in DB
                await mongoose.model('ChatMessage').updateMany(
                    { sender: data.senderId, receiver: userId, isRead: false },
                    { isRead: true, readAt: new Date() }
                );
                io.to(data.senderId).emit('messageRead', { readerId: userId });
            } catch (e) { console.error('Error marking messages as read', e); }
        });

        socket.on('blockUser', async (data) => {
            try {
                // Instantly end any active call
                let foundMatchId = null;
                for (const [mid, call] of activeCalls.entries()) {
                    if (call.user1Id === userId || call.user2Id === userId) {
                        foundMatchId = mid;
                        break;
                    }
                }
                
                if (foundMatchId) {
                    const match = await matchService.getMatchDetails(new Types.ObjectId(foundMatchId));
                    if (match) {
                        const targetId = match.user1._id.toString() === userId ? match.user2._id.toString() : match.user1._id.toString();
                        if (targetId === data.targetId) {
                            io.to(userId).emit('match-ended', { matchId: foundMatchId, reason: 'blocked' });
                            io.to(targetId).emit('match-ended', { matchId: foundMatchId, reason: 'blocked' });
                            await matchService.endCall(new Types.ObjectId(foundMatchId), new Types.ObjectId(userId));
                            activeCalls.delete(foundMatchId);
                        }
                    }
                }
                // Add to blocked users array
                await User.findByIdAndUpdate(userId, { $addToSet: { blockedUsers: data.targetId } });
                io.to(userId).emit('userBlocked', { targetId: data.targetId });
            } catch (e) { console.error('Error blocking user', e); }
        });

        socket.on('send-icebreaker', async (data) => {
            const targetId = data.receiverId;
            const targetSid = userSocketMap.get(targetId);
            if (targetSid) {
                io.to(targetSid).emit('icebreaker-received', { message: data.message, from: userId });
            }
        });

        socket.on('send-reaction', async (data) => {
            const targetId = data.receiverId;
            const targetSid = userSocketMap.get(targetId);
            if (targetSid) {
                io.to(targetSid).emit('reaction-received', { emoji: data.emoji, from: userId });
            }
        });

        socket.on('send-gift', async (data: { receiverId: string, giftName: string, coinCost: number, inventoryGiftId?: string }) => {
            try {
                if (mongoose.connection.readyState !== 1) return socket.emit('gift-error', { message: 'Database busy' });
                
                const sender = await User.findById(userId);
                const receiver = await User.findById(data.receiverId);
                
                if (!sender || !receiver) return socket.emit('gift-error', { message: 'User not found' });
                
                if (data.inventoryGiftId) {
                    // Regifting from inventory
                    const existingGift = await UserGift.findOne({ _id: data.inventoryGiftId, ownerId: userId, status: 'available' });
                    if (!existingGift) return socket.emit('gift-error', { message: 'Gift not found in inventory' });
                    
                    // Mark as regifted
                    existingGift.status = 'regifted';
                    await existingGift.save();
                    
                    // Create new gift for receiver (sender is current user)
                    await UserGift.create({
                        ownerId: receiver._id,
                        senderId: sender._id,
                        giftName: data.giftName,
                        coinValue: data.coinCost
                    });
                    
                    sender.trustScore = (sender.trustScore || 100) + 10;
                    await sender.save();
                    
                } else {
                    // Buying with coins
                    if ((sender.walletBalance || 0) < data.coinCost) return socket.emit('gift-error', { message: 'Insufficient coins' });

                    // Deduct coins and add trust score
                    sender.walletBalance = (sender.walletBalance || 0) - data.coinCost;
                    sender.trustScore = (sender.trustScore || 100) + 10;
                    await sender.save();

                    // Create gift in receiver's inventory instead of directly adding coins
                    await UserGift.create({
                        ownerId: receiver._id,
                        senderId: sender._id,
                        giftName: data.giftName,
                        coinValue: data.coinCost
                    });

                    // Log transactions
                    await Transaction.create([
                        { userId: sender._id, type: 'gift_sent', amount: -data.coinCost, relatedUserId: receiver._id, giftName: data.giftName, description: `Sent ${data.giftName}` },
                        { userId: receiver._id, type: 'gift_received', amount: data.coinCost, relatedUserId: sender._id, giftName: data.giftName, description: `Received ${data.giftName}` }
                    ]);
                }

                // Notify receiver
                const targetSid = userSocketMap.get(data.receiverId);
                if (targetSid) {
                    io.to(targetSid).emit('gift-received', { from: userId, giftName: data.giftName, senderName: sender.displayName });
                }
                
                // Notify sender success
                socket.emit('gift-sent-success', { newBalance: sender.walletBalance });

            } catch (error) {
                console.error("Gift error", error);
                socket.emit('gift-error', { message: 'Gift failed' });
            }
        });

        socket.on('disconnect', async () => {
            onlineUsersMap.delete(userId);
            matchmakingQueue.delete(userId);
            searchStartTimes.delete(userId);
            skippedUsersMap.delete(userId);
            rejectedUsersMap.delete(userId); // 🚨 Clear skip list on disconnect
            await handleStage1Cleanup(io, userId);
            for (const [mid, v] of activeVerifications.entries()) {
                if (v.u1Id === userId || v.u2Id === userId) {
                    v.presenceCheck.aborted = true; clearTimeout(v.timeout); activeVerifications.delete(mid);
                    const other = v.u1Id === userId ? v.s2 : v.s1;
                    io.to(other).emit('match-error', { message: 'Partner left.' });
                }
            }
            userSocketMap.delete(userId);
            socketUserMap.delete(socket.id);
            if (mongoose.connection.readyState === 1) {
                await matchService.setUserOnlineStatus(user._id as Types.ObjectId, false, null);
            }
        });
    });

    return io;
};
