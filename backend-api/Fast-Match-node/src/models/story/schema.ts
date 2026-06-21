import { Schema } from 'mongoose';
import { StoryInterface } from './types';
import { stringType } from '../../helpers/commonTypes';

export const StorySchema = new Schema<StoryInterface>({
    userId: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    mediaUrl: stringType(true),
    mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
    expiresAt: { type: Date, required: true },
}, {
    timestamps: true
});

// Auto-delete after expiresAt
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
