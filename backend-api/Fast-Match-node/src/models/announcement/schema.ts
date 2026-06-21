import { Schema } from 'mongoose';
import { AnnouncementInterface } from './types';
import { stringType, refType } from '../../helpers/commonTypes';

export const AnnouncementSchema = new Schema<AnnouncementInterface>({
    title: stringType(true),
    message: stringType(true),
    targetAudience: { type: String, enum: ['all', 'premium', 'free'], default: 'all' },
    createdBy: { ...refType('users'), required: true },
}, { timestamps: true });

AnnouncementSchema.index({ targetAudience: 1 });
AnnouncementSchema.index({ createdAt: -1 });
