import { NotificationModel } from "@models/notification/schema";
import { User } from "@models/user";
import { Types } from "mongoose";
import admin from "@config/firebase/firebase.config";

class NotificationService {

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
                    const response = await admin.messaging().send(messagePayload);
                    console.log(`✅ [FCM Success] Notification sent to user ${userId}: ${response}`);
                } catch (fcmError: any) {
                    console.error(`❌ [FCM Error] Failed for user ${userId}:`, fcmError.message);
                }
            }

            return notification;
        } catch (error) {
            console.error("[Notification Error]:", error);
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
