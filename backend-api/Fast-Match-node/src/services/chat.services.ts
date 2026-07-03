import { ChatMessageModel } from '@models/chat/schema';
import { MatchHistory } from '@models/matchHistory';
import { User } from '@models/user';
import { Types } from 'mongoose';
import notificationServices from './notification.services';
import blockService from './block.service';

class ChatService {
    /**
     * Get a unique list of users someone has matched with and accepted the match.
     * These will be the potential chat partners for the Conversations list.
     */
    async getConnectedUsers(userId: Types.ObjectId) {
        const userIdStr = userId.toString();

        // 1. Find matches that were accepted (call ongoing) or completed (call ended)
        const connections = await MatchHistory.find({
            $or: [{ user1: userId }, { user2: userId }],
            matchStatus: { $in: ['accepted', 'completed'] }
        })
            .populate('user1 user2', 'displayName fullName profilePicture isOnline gender isVerified blockedUsers age trustScore ratingCount totalRatingScore')
            .sort({ updatedAt: -1 })
            .lean();

        // 2. Fetch current user's blocked lists
        const currentUser = await User.findById(userId).select('blockedUsers blockedCalls').lean();
        const myBlockedList = currentUser?.blockedUsers?.map((id: any) => id.toString()) || [];
        const myCallBlockedList = currentUser?.blockedCalls?.map((id: any) => id.toString()) || [];

        // 3. Identify unique partners and their last match timestamp
        const partnersMap = new Map<string, any>();

        connections.forEach((conn: any) => {
            if (!conn.user1 || !conn.user2) return;

            const isUser1 = conn.user1._id.toString() === userIdStr;
            const partner = isUser1 ? conn.user2 : conn.user1;
            const partnerId = partner._id.toString();

            // Check full block status
            const amIBlocked = partner.blockedUsers?.map((id: any) => id.toString()).includes(userIdStr) || false;
            const isBlockedByMe = myBlockedList.includes(partnerId);

            // Check call-only block status
            const amICallBlocked = partner.blockedCalls?.map((id: any) => id.toString()).includes(userIdStr) || false;
            const isCallsBlockedByMe = myCallBlockedList.includes(partnerId);

            if (!partnersMap.has(partnerId)) {
                partnersMap.set(partnerId, {
                    ...partner,
                    amIBlocked,
                    isBlockedByMe,
                    amICallBlocked,
                    isCallsBlockedByMe,
                    matchId: conn._id,
                    lastMatchedAt: conn.updatedAt || conn.createdAt,
                    lastInteractionAt: conn.updatedAt || conn.createdAt
                });
            }
        });

        const conversations = Array.from(partnersMap.values());
 
        // 3. Enrich each conversation with the last message and unread count in parallel
        const enrichedConversations = await Promise.all(conversations.map(async (convo) => {
            const partnerId = convo._id;
 
            // Fetch last message between these two users
            const lastMsg = await ChatMessageModel.findOne({
                $or: [
                    { sender: userId, receiver: partnerId },
                    { sender: partnerId, receiver: userId }
                ],
                deletedBy: { $ne: userId }
            })
                .sort({ createdAt: -1 })
                .lean();
 
            // Fetch unread count (messages sent by the partner to current user)
            const unreadCount = await ChatMessageModel.countDocuments({
                sender: partnerId,
                receiver: userId,
                isRead: false,
                deletedBy: { $ne: userId }
            });
 
            const lastInteractionAt = lastMsg ? lastMsg.createdAt : convo.lastInteractionAt;
 
            return {
                ...convo,
                lastMessage: lastMsg || null,
                unreadCount,
                lastInteractionAt // This ensures sorting is based on the actual latest activity
            };
        }));
 
        // 4. Final sort: Most recent interaction at the top (either newest message or newest match)
        return enrichedConversations.sort((a, b) => {
            const timeA = new Date(a.lastInteractionAt).getTime();
            const timeB = new Date(b.lastInteractionAt).getTime();
            return timeB - timeA;
        });
    }

    /**
     * Save a new message to the database
     */
    async saveMessage(senderId: string, receiverId: string, message: string, messageType: string = 'text') {
        // 🚨 CHECK IF BLOCKED
        const receiver = await User.findById(receiverId).select('blockedUsers');
        const sender = await User.findById(senderId).select('blockedUsers');

        const amIBlocked = receiver?.blockedUsers?.map(id => id.toString()).includes(senderId) || false;
        const isBlockedByMe = sender?.blockedUsers?.map(id => id.toString()).includes(receiverId) || false;

        // If I have blocked the receiver, I shouldn't be sending messages (throw error)
        if (isBlockedByMe) {
            throw new Error('You have blocked this user');
        }

        // If I am blocked by the receiver, we STILL save the message so it doesn't 
        // "disappear" from the sender's phone, but we hide it from the receiver 
        // by adding them to the 'deletedBy' list.
        const newMessage = new ChatMessageModel({
            sender: new Types.ObjectId(senderId),
            receiver: new Types.ObjectId(receiverId),
            message,
            messageType,
            deletedBy: amIBlocked ? [new Types.ObjectId(receiverId)] : []
        });
        
        const savedMsg = await newMessage.save();

        // 🔕 ONLY send Push Notification if NOT blocked by receiver
        if (!amIBlocked) {
            try {
                const senderInfo = await User.findById(senderId).select('displayName');
                await notificationServices.sendNotification(
                    new Types.ObjectId(receiverId),
                    `New Message from ${senderInfo?.displayName || 'Someone'}`,
                    message.length > 50 ? message.substring(0, 47) + '...' : message,
                    'NEW_MESSAGE',
                    { senderId, messageId: savedMsg._id.toString() }
                );
            } catch (notifError) {
                console.error('Error sending message notification:', notifError);
            }
        }

        return { savedMsg, amIBlocked };
    }

    /**
     * Fetch all messages between two users
     */
    async getChatHistory(currentUser: string, otherUser: string, offset: number = 0, limit: number = 50) {
        const results = await ChatMessageModel.aggregate([
            {
                $match: {
                    $or: [
                        { sender: new Types.ObjectId(currentUser), receiver: new Types.ObjectId(otherUser) },
                        { sender: new Types.ObjectId(otherUser), receiver: new Types.ObjectId(currentUser) }
                    ],
                    // Filter out messages that the current user has "cleared" from their view
                    deletedBy: { $nin: [new Types.ObjectId(currentUser)] }
                }
            },
            {
                $facet: {
                    messages: [
                        { $sort: { createdAt: -1 } },
                        { $skip: offset },
                        { $limit: limit }
                    ],
                    unreadCount: [
                        { 
                            $match: { 
                                sender: new Types.ObjectId(otherUser), 
                                receiver: new Types.ObjectId(currentUser), 
                                isRead: false 
                            } 
                        },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        const messages = results[0].messages || [];
        const unreadCount = results[0].unreadCount[0]?.count || 0;

        return { messages, unreadCount };
    }

    /**
     * Get total unread message count for a user across all conversations
     */
    /**
     * Mark messages from a specific sender as read
     */
    async markAsRead(receiverId: string, senderId: string) {
        return await ChatMessageModel.updateMany(
            { sender: new Types.ObjectId(senderId), receiver: new Types.ObjectId(receiverId), isRead: false },
            { $set: { isRead: true } }
        );
    }

    /**
     * Get total unread message count for a user across all conversations
     */
    async getTotalUnreadCount(userId: Types.ObjectId) {
        return await ChatMessageModel.countDocuments({
            receiver: userId,
            isRead: false,
            deletedBy: { $ne: userId }
        });
    }

    /**
     * Clear all messages between two users
     */
    async clearChatHistory(requestingUserId: string, targetUserId: string) {
        const query = {
            $or: [
                { sender: new Types.ObjectId(requestingUserId), receiver: new Types.ObjectId(targetUserId) },
                { sender: new Types.ObjectId(targetUserId), receiver: new Types.ObjectId(requestingUserId) }
            ]
        };

        const result = await ChatMessageModel.updateMany(query, {
            $addToSet: { deletedBy: new Types.ObjectId(requestingUserId) }
        });

        // Also permanently delete the MatchHistory so it disappears from the inbox list completely
        await MatchHistory.deleteMany({
            $or: [
                { user1: new Types.ObjectId(requestingUserId), user2: new Types.ObjectId(targetUserId) },
                { user1: new Types.ObjectId(targetUserId), user2: new Types.ObjectId(requestingUserId) }
            ]
        });

        return result;
    }

    /**
     * Delete specific messages by their IDs
     * Allows deleting own messages (sent) or received messages
     */
    async deleteMessages(userId: string, messageIds: string[]) {
        const objectIds = messageIds.map(id => new Types.ObjectId(id));
        
        // Find messages before deleting to know who to notify via socket
        const messagesToDelete = await ChatMessageModel.find({
            _id: { $in: objectIds },
            $or: [
                { sender: new Types.ObjectId(userId) },
                { receiver: new Types.ObjectId(userId) }
            ]
        });

        await ChatMessageModel.deleteMany({
            _id: { $in: messagesToDelete.map(m => m._id) }
        });

        return messagesToDelete;
    }

    /**
     * Edit a message's content
     * Only the sender can edit their own message
     * Blocked users cannot edit messages sent to users who blocked them
     */
    async editMessage(userId: string, messageId: string, newMessage: string) {
        const message = await ChatMessageModel.findById(new Types.ObjectId(messageId)).lean();
        if (!message) throw new Error('Message not found');
        if (message.sender.toString() !== userId) throw new Error('You are not the sender');

        const receiverId = message.receiver.toString();
        await blockService.throwIfBlocked(userId, receiverId, 'edit this message');

        return await ChatMessageModel.findOneAndUpdate(
            { _id: new Types.ObjectId(messageId), sender: new Types.ObjectId(userId) },
            { $set: { message: newMessage, isEdited: true } },
            { new: true }
        );
    }

    /**
     * Block a user (full block — calls + chat)
     */
    async blockUser(userId: string, targetUserId: string) {
        return await blockService.blockUser(userId, targetUserId);
    }

    /**
     * Unblock a user
     */
    async unblockUser(userId: string, targetUserId: string) {
        return await blockService.unblockUser(userId, targetUserId);
    }

    /**
     * Block calls only (chat remains open)
     */
    async blockCalls(userId: string, targetUserId: string) {
        return await blockService.blockCalls(userId, targetUserId);
    }

    /**
     * Unblock calls
     */
    async unblockCalls(userId: string, targetUserId: string) {
        return await blockService.unblockCalls(userId, targetUserId);
    }
}

export default new ChatService();
