import { Document, Types } from "mongoose"

export interface NotificationInterface extends Document {
    user: Types.ObjectId,
    title: string,
    message: string,
    type: string, // e.g., 'new_message', 'user_online', 'call_request'
    data: any, // Extra data like senderId, matchId etc.
    isRead: boolean,
    createdAt: Date,
    updatedAt: Date
}
