import { Request, Response } from 'express';
import { constants } from '@config/constant';
import { responseEncryptor } from '@config/decryptor';
import chatService from '@services/chat.services';
import { ChatMessageModel } from '@models/chat/schema';
import { Types } from 'mongoose';

class ChatController {
    /**
     * Get list of all users you have connected with 
     */
    async getConversationList(req: Request, res: Response) {
        try {
            const userId = req.user._id as Types.ObjectId;
            const conversations = await chatService.getConnectedUsers(userId);

            return res.status(constants.successCode)
                .send(responseEncryptor(req, true, 'Conversations retrieved successfully', conversations));
        } catch (error: any) {
            return res.status(constants.errorCode)
                .send(responseEncryptor(req, false, error.message));
        }
    }

    /**
     * Get messages history between current user and a target user
     */
    async getChatHistory(req: Request, res: Response) {
        try {
            const userId = req.user._id.toString();
            const { otherUserId } = req.params;
            const { offset, limit } = req.query;

            // 1. Get the messages and unread count atomically from the service
            // This ensures data consistency and eliminates race conditions.
            const { messages, unreadCount: chatUnreadCount } = await chatService.getChatHistory(
                userId,
                String(otherUserId),
                parseInt(String(offset)) || 0,
                parseInt(String(limit)) || 50
            );

            // 2. Mark these messages as read and emit socket update in the background
            // This prevents a race condition where the socket event might arrive before the HTTP response
            setImmediate(async () => {
                try {
                    await chatService.markAsRead(userId, String(otherUserId));
                    const totalUnreadCount = await chatService.getTotalUnreadCount(req.user._id as Types.ObjectId);
                    (req as any).io.to(userId).emit('unread-count-update', { totalUnreadCount });
                } catch (err) {
                    console.error('Background markAsRead error:', err);
                }
            });

            return res.status(constants.successCode)
                .send(responseEncryptor(req, true, 'Chat history retrieved', {
                    messages,
                    unreadCount: chatUnreadCount
                }));
        } catch (error: any) {
            return res.status(constants.errorCode)
                .send(responseEncryptor(req, false, error.message));
        }
    }

    /**
     * Mark all messages from a specific user as read
     */
    async markMessagesAsRead(req: Request, res: Response) {
        try {
            const userId = req.user._id.toString();
            const { otherUserId } = req.body; // Expecting otherUserId in body

            if (!otherUserId) throw new Error('otherUserId is required');

            await chatService.markAsRead(userId, String(otherUserId));

            // Emit Real-time unread count update to current user
            const totalUnreadCount = await chatService.getTotalUnreadCount(req.user._id as Types.ObjectId);
            (req as any).io.to(userId).emit('unread-count-update', { totalUnreadCount });

            return res.status(constants.successCode)
                .send(responseEncryptor(req, true, 'Messages marked as read'));
        } catch (error: any) {
            return res.status(constants.errorCode)
                .send(responseEncryptor(req, false, error.message));
        }
    }

    /**
     * Get total unread count for the current user across all chats
     */
    async getTotalUnreadCount(req: Request, res: Response) {
        try {
            const userId = req.user._id as Types.ObjectId;
            const totalUnreadCount = await chatService.getTotalUnreadCount(userId);

            return res.status(constants.successCode)
                .send(responseEncryptor(req, true, 'Total unread count retrieved', { totalUnreadCount }));
        } catch (error: any) {
            return res.status(constants.errorCode)
                .send(responseEncryptor(req, false, error.message));
        }
    }

    /**
     * Delete all messages between current user and target user
     */
    async clearChatHistory(req: Request, res: Response) {
        try {
            const userId = req.user._id.toString();
            const { otherUserId } = req.body;

            if (!otherUserId) throw new Error('otherUserId is required');

            const result = await chatService.clearChatHistory(userId, String(otherUserId));

            // Emit unread count update to current user
            const totalUnreadCount = await chatService.getTotalUnreadCount(req.user._id as Types.ObjectId);
            (req as any).io.to(userId).emit('unread-count-update', { totalUnreadCount });

            return res.status(constants.successCode)
                .send(responseEncryptor(req, true, 'Chat history cleared successfully', result));
        } catch (error: any) {
            return res.status(constants.errorCode)
                .send(responseEncryptor(req, false, error.message));
        }
    }

    /**
     * Delete specific messages sent by the user
     */
    async deleteMessages(req: Request, res: Response) {
        try {
            const userId = req.user._id.toString();
            const { messageIds } = req.body; // Expecting array of message IDs

            if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
                throw new Error('messageIds (array) is required');
            }

            const deletedMessages = await chatService.deleteMessages(userId, messageIds);

            // Group deleted messages by partner to notify them via socket
            const notifications: any = {};
            deletedMessages.forEach((msg: any) => {
                const partnerId = msg.sender.toString() === userId ? msg.receiver.toString() : msg.sender.toString();
                if (!notifications[partnerId]) notifications[partnerId] = [];
                notifications[partnerId].push(msg._id.toString());
            });

            // Emit 'messages-deleted' to each affected partner
            Object.keys(notifications).forEach(partnerId => {
                (req as any).io.to(partnerId).emit('messages-deleted', { 
                    messageIds: notifications[partnerId],
                    deletedBy: userId 
                });
            });

            return res.status(constants.successCode)
                .send(responseEncryptor(req, true, `${deletedMessages.length} messages deleted successfully`));
        } catch (error: any) {
            return res.status(constants.errorCode)
                .send(responseEncryptor(req, false, error.message));
        }
    }

    /**
     * Edit a specific message
     */
    async editMessage(req: Request, res: Response) {
        try {
            const userId = req.user._id.toString();
            const { messageId, newMessage } = req.body;

            if (!messageId || !newMessage) {
                throw new Error('messageId and newMessage are required');
            }

            const updatedMsg = await chatService.editMessage(userId, messageId, newMessage);

            if (!updatedMsg) {
                throw new Error('Message not found or you are not the sender');
            }

            // Emit real-time update to the receiver
            const receiverId = updatedMsg.receiver.toString();
            (req as any).io.to(receiverId).emit('message-edited', updatedMsg);

            return res.status(constants.successCode)
                .send(responseEncryptor(req, true, 'Message edited successfully', updatedMsg));
        } catch (error: any) {
            return res.status(constants.errorCode)
                .send(responseEncryptor(req, false, error.message));
        }
    }

    /**
     * Block a user
     */
    async blockUser(req: Request, res: Response) {
        try {
            const userId = req.user._id.toString();
            const { targetUserId } = req.body;

            if (!targetUserId) throw new Error('targetUserId is required');

            await chatService.blockUser(userId, targetUserId);

            return res.status(constants.successCode)
                .send(responseEncryptor(req, true, 'User blocked successfully'));
        } catch (error: any) {
            return res.status(constants.errorCode)
                .send(responseEncryptor(req, false, error.message));
        }
    }

    /**
     * Unblock a user
     */
    async unblockUser(req: Request, res: Response) {
        try {
            const userId = req.user._id.toString();
            const { targetUserId } = req.body;

            if (!targetUserId) throw new Error('targetUserId is required');

            await chatService.unblockUser(userId, targetUserId);

            return res.status(constants.successCode)
                .send(responseEncryptor(req, true, 'User unblocked successfully'));
        } catch (error: any) {
            return res.status(constants.errorCode)
                .send(responseEncryptor(req, false, error.message));
        }
    }

    /**
     * Block calls only (chat remains open)
     */
    async blockCalls(req: Request, res: Response) {
        try {
            const userId = req.user._id.toString();
            const { targetUserId } = req.body;

            if (!targetUserId) throw new Error('targetUserId is required');

            await chatService.blockCalls(userId, targetUserId);

            return res.status(constants.successCode)
                .send(responseEncryptor(req, true, 'Calls blocked successfully'));
        } catch (error: any) {
            return res.status(constants.errorCode)
                .send(responseEncryptor(req, false, error.message));
        }
    }

    /**
     * Unblock calls
     */
    async unblockCalls(req: Request, res: Response) {
        try {
            const userId = req.user._id.toString();
            const { targetUserId } = req.body;

            if (!targetUserId) throw new Error('targetUserId is required');

            await chatService.unblockCalls(userId, targetUserId);

            return res.status(constants.successCode)
                .send(responseEncryptor(req, true, 'Calls unblocked successfully'));
        } catch (error: any) {
            return res.status(constants.errorCode)
                .send(responseEncryptor(req, false, error.message));
        }
    }
}

export default new ChatController();
