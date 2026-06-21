import { Document, Types } from "mongoose"

export interface StoryInterface extends Document {
    userId: Types.ObjectId;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
