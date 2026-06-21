import { Document, Types } from 'mongoose';

export interface ChatMessageInterface extends Document {
    sender: Types.ObjectId;
    receiver: Types.ObjectId;
    message: string;
    isRead: boolean;
    readAt?: Date;
    deliveredAt?: Date;
    messageType: 'text' | 'image';
    isEdited: boolean;
    deletedBy: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}
