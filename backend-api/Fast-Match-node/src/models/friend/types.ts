import { Document, Types } from 'mongoose';

export interface FriendInterface extends Document {
    requester: Types.ObjectId;
    recipient: Types.ObjectId;
    status: 'pending' | 'accepted' | 'declined';
    message?: string;
    createdAt: Date;
    updatedAt: Date;
}
