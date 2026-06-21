import matchRepo from "@repository/match.repo";
import userRepo from "@repository/user.repo";
import { User } from "@models/user";
import { MatchHistory } from "@models/matchHistory";
import { Types } from "mongoose";
import notificationServices from "./notification.services";

class MatchService {

    // Join matchmaking queue — find a compatible match or return null
    async findMatch(userId: Types.ObjectId, preference: string) {
        // Build query to find an online user who is NOT the current user
        const query: any = {
            _id: { $ne: userId },
            isOnline: true,
            isVerified: true,
        };

        // Apply gender preference filter
        if (preference === 'male') {
            query.gender = 'male';
        } else if (preference === 'female') {
            query.gender = 'female';
        }
        // 'everyone' — no gender filter

        return query;
    }

    // Create a match record between two users
    async createMatch(user1Id: Types.ObjectId, user2Id: Types.ObjectId, preference: string, matchType: string = 'random') {
        const match = await matchRepo.createMatch({
            user1: user1Id,
            user2: user2Id,
            preference,
            matchType: matchType || 'random',
            matchedAt: new Date(),
            user1Status: 'pending',
            user2Status: 'pending',
            matchStatus: 'pending',
        });
        return match;
    }

    // User responds to match (accept/decline)
    async respondToMatch(matchId: Types.ObjectId, userId: Types.ObjectId, response: 'accepted' | 'declined') {
        const match = await matchRepo.getMatchById(matchId);
        if (!match) throw new Error('Match not found.');

        const isUser1 = match.user1._id.toString() === userId.toString();
        const isUser2 = match.user2._id.toString() === userId.toString();
        if (!isUser1 && !isUser2) throw new Error('You are not part of this match.');

        // Determine update fields
        const updateFields: any = {};

        if (isUser1) {
            updateFields.user1Status = response;
        } else {
            updateFields.user2Status = response;
        }

        // If either user declines, match is declined
        if (response === 'declined') {
            updateFields.matchStatus = 'declined';
        }

        // Update match
        const updatedMatch = await matchRepo.updateMatchWithDoc(matchId, updateFields);

        // Check if both users accepted
        const u1Status = isUser1 ? response : updatedMatch.user1Status;
        const u2Status = isUser2 ? response : updatedMatch.user2Status;

        if (u1Status === 'accepted' && u2Status === 'accepted') {
            // Both accepted! Start the call
            await matchRepo.updateMatch(matchId, {
                matchStatus: 'accepted',
                callStartedAt: new Date()
            });
            return { match: await matchRepo.getMatchById(matchId), bothAccepted: true };
        }

        return { match: updatedMatch, bothAccepted: false };
    }

    // End call
    async endCall(matchId: Types.ObjectId, userId: Types.ObjectId) {
        const match = await matchRepo.getMatchById(matchId);
        if (!match) throw new Error('Match not found.');

        const now = new Date();
        const callDuration = match.callStartedAt
            ? Math.round((now.getTime() - new Date(match.callStartedAt).getTime()) / 1000)
            : 0;

        const updatedMatch = await matchRepo.updateMatchWithDoc(matchId, {
            matchStatus: 'completed',
            callEndedAt: now,
            callDuration,
            endedBy: userId,
        });

        // Reward users for long calls (> 5 minutes = 300 seconds)
        if (callDuration > 300) {
            await User.updateMany(
                { _id: { $in: [match.user1._id, match.user2._id] } },
                { $inc: { trustScore: 5 } }
            );
        }

        return updatedMatch;
    }

    // Timeout a match (auto-skip)
    async timeoutMatch(matchId: Types.ObjectId) {
        const updatedMatch = await matchRepo.updateMatchWithDoc(matchId, {
            matchStatus: 'timeout',
        });
        return updatedMatch;
    }

    // Set user online/offline
    async setUserOnlineStatus(userId: Types.ObjectId, isOnline: boolean, socketId: string | null = null) {
        const user = await User.findById(userId).select('displayName isOnline');
        const wasOffline = user && !user.isOnline;

        await userRepo.updateUser(userId, { isOnline, socketId });

        // If user just came online, notify their match partners
        if (isOnline && wasOffline) {
            this.notifyPartnersOnline(userId, user.displayName);
        }
    }

    private async notifyPartnersOnline(userId: Types.ObjectId, displayName: string) {
        try {
            // Find all unique users this person has matched with (accepted or completed)
            const matches = await MatchHistory.find({
                $or: [{ user1: userId }, { user2: userId }],
                matchStatus: { $in: ['accepted', 'completed'] }
            }).select('user1 user2');

            const partnerIds = new Set<string>();
            matches.forEach(m => {
                const pId = m.user1.toString() === userId.toString() ? m.user2.toString() : m.user1.toString();
                partnerIds.add(pId);
            });

            for (const pId of partnerIds) {
                await notificationServices.sendNotification(
                    new Types.ObjectId(pId),
                    'Partner Online',
                    `${displayName} is now online. Say hi!`,
                    'ONLINE_STATUS',
                    { partnerId: userId.toString() }
                );
            }
        } catch (error) {
            console.error('Error notifying partners about online status:', error);
        }
    }

    // Get match history for a user
    async getMatchHistory(userId: Types.ObjectId, offset: number, limit: number) {
        return await matchRepo.getUserMatchHistory(userId, offset, limit);
    }

    // Get active match for a user
    async getActiveMatch(userId: Types.ObjectId) {
        return await matchRepo.getActiveMatchByUser(userId);
    }

    // Get match details
    async getMatchDetails(matchId: Types.ObjectId) {
        return await matchRepo.getMatchById(matchId);
    }

    // Skip current match and find next
    async skipMatch(matchId: Types.ObjectId, userId: Types.ObjectId) {
        const match = await matchRepo.getMatchById(matchId);
        if (!match) throw new Error('Match not found.');

        const now = new Date();
        const callDuration = match.callStartedAt
            ? Math.round((now.getTime() - new Date(match.callStartedAt).getTime()) / 1000)
            : 0;

        await matchRepo.updateMatch(matchId, {
            matchStatus: 'completed',
            callEndedAt: now,
            callDuration,
            endedBy: userId,
        });

        return true;
    }

    // Submit rating for a completed match
    async submitRating(matchId: Types.ObjectId, userId: Types.ObjectId, rating: number) {
        const match = await matchRepo.getMatchById(matchId);
        if (!match) throw new Error('Match not found.');
        if (match.matchStatus !== 'completed') throw new Error('Match is not completed yet.');

        const isUser1 = match.user1._id.toString() === userId.toString();
        const isUser2 = match.user2._id.toString() === userId.toString();
        if (!isUser1 && !isUser2) throw new Error('You are not part of this match.');

        const updateFields: any = {};
        let targetUserId: any;

        if (isUser1) {
            updateFields.user1Rating = rating;
            targetUserId = match.user2;
        } else {
            updateFields.user2Rating = rating;
            targetUserId = match.user1;
        }

        // Update match history
        const updatedMatch = await matchRepo.updateMatch(matchId, updateFields);

        // Update target user's total score and count
        await User.findByIdAndUpdate(targetUserId, {
            $inc: { totalRatingScore: rating, ratingCount: 1 }
        });

        return updatedMatch;
    }
}

export default new MatchService();
