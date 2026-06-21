import { Schema, model } from 'mongoose';
import { FriendInterface } from './types';

const FriendSchema = new Schema<FriendInterface>({
    requester: { type: Schema.Types.ObjectId, ref: 'users', required: true, index: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'users', required: true, index: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
}, {
    timestamps: true
});

// Ensure a user cannot send multiple requests to the same person
FriendSchema.index({ requester: 1, recipient: 1 }, { unique: true });

export const FriendModel = model<FriendInterface>('Friend', FriendSchema);
