import { NotificationModel } from "@models/notification/schema";
import { User } from "@models/user";
import { Types } from "mongoose";
import admin from "@config/firebase/firebase.config";
import { createCircuitBreaker } from "@config/circuitBreaker";

class NotificationService {
    private firebaseBreaker: any;
    private firebaseBulkBreaker: any;

    constructor() {
        this.firebaseBreaker = createCircuitBreaker(async (payload: any) => {
            return await admin.messaging().send(payload);
        }, { name: 'FirebaseSinglePush' });
        
        this.firebaseBulkBreaker = createCircuitBreaker(async (payload: any) => {
            return await admin.messaging().sendEachForMulticast(payload);
        }, { name: 'FirebaseBulkPush' });
    }

    /**
     * Send push notification and save to database
     */
    async sendNotification(userId: Types.ObjectId, title: string, message: string, type: string, extraData: any = {}) {
        try {
            // 1. Save to Database
            const notification = new NotificationModel({
                user: userId,
                title,
                message,
                type,
                data: extraData
            });
            await notification.save();

            // 2. Send via Firebase
            const user = await User.findById(userId).select('fcmToken');
            if (user?.fcmToken) {
                const messagePayload: any = {
                    token: user.fcmToken,
                    notification: {
                        title: title,
                        body: message,
                    },
                    data: {
                        ...extraData,
                        type: String(type)
                    },
                    android: {
                        priority: "high",
                        notification: {
                            sound: "default"
                        }
                    },
                    apns: {
                        payload: {
                            aps: {
                                sound: "default",
                                badge: 1
                            }
                        }
                    }
                };

                try {
                    const response = await this.firebaseBreaker.fire(messagePayload);
                    console.log(`✅ [FCM Success] Notification sent to user ${userId}: ${response}`);
                } catch (fcmError: any) {
                    console.error(`❌ [FCM Error] Failed for user ${userId} (Circuit might be open):`, fcmError.message);
                }
            }

            return notification;
        } catch (error) {
            console.error("[Notification Error]:", error);
        }
    }

    /**
     * Send bulk push notifications and save to database in a single batched operation
     * Optimized to reduce N+1 database queries and HTTP round-trips.
     */
    async sendBulkNotification(userIds: Types.ObjectId[], title: string, message: string, type: string, extraData: any = {}) {
        if (!userIds || userIds.length === 0) return;

        try {
            // 1. Bulk Save to Database (Single Insert statement)
            const notifications = userIds.map(userId => ({
                user: userId,
                title,
                message,
                type,
                data: extraData
            }));
            
            await NotificationModel.insertMany(notifications, { ordered: false });

            // 2. Fetch all valid FCM tokens in a single query (Single Select statement)
            const users = await User.find({ 
                _id: { $in: userIds }, 
                fcmToken: { $exists: true, $nin: [null, ""] } 
            }).select('fcmToken');
            
            const tokens = users.map(u => u.fcmToken as string);
            if (tokens.length === 0) return;

            // 3. Send via Firebase Multicast (Firebase limit is 500 tokens per request)
            const CHUNK_SIZE = 500;
            for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
                const tokenChunk = tokens.slice(i, i + CHUNK_SIZE);
                
                const messagePayload: any = {
                    tokens: tokenChunk,
                    notification: {
                        title: title,
                        body: message,
                    },
                    data: {
                        ...extraData,
                        type: String(type)
                    },
                    android: {
                        priority: "high",
                        notification: {
                            sound: "default"
                        }
                    },
                    apns: {
                        payload: {
                            aps: {
                                sound: "default",
                                badge: 1
                            }
                        }
                    }
                };

                try {
                    const response = await this.firebaseBulkBreaker.fire(messagePayload);
                    console.log(`✅ [FCM Bulk Success] Sent ${response.successCount} messages, ${response.failureCount} failed.`);
                } catch (fcmError: any) {
                    console.error(`❌ [FCM Bulk Error] Multicast failed (Circuit might be open):`, fcmError.message);
                }
            }
        } catch (error) {
            console.error("[Bulk Notification Error]:", error);
        }
    }

    /**
     * Get user's notifications
     */
    async getUserNotifications(userId: Types.ObjectId, offset: number = 0, limit: number = 20) {
        return await NotificationModel.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit);
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string) {
        return await NotificationModel.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
    }
}

export default new NotificationService();
