import { Document, Types } from 'mongoose';

export interface FriendInterface extends Document {
    requester: Types.ObjectId;
    recipient: Types.ObjectId;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: Date;
    updatedAt: Date;
}
