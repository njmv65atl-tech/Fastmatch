import { Document, Types } from 'mongoose';

export interface AnnouncementInterface extends Document {
    title: string;
    message: string;
    targetAudience: 'all' | 'premium' | 'free';
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
