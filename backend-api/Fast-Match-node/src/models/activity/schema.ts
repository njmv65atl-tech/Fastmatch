import { Schema, model } from 'mongoose';
import { ActivityInterface } from './types';
import { refType, stringType, dateType } from '../../helpers/commonTypes';

export const ActivitySchema = new Schema<ActivityInterface>({
    user: {
        ...refType('users'),
        required: true
    },
    action: stringType(true),
    detail: stringType(false),
    tag: {
        type: String,
        enum: ['WARNING', 'SYSTEM INFO', 'CRITICAL', 'POLICY'],
        default: 'SYSTEM INFO'
    },
    location: stringType(false),
    ip: stringType(false),
    deviceName: stringType(false),
    platform: stringType(false),
    status: {
        type: String,
        enum: ['ACTIVE', 'IDLE'],
        default: 'ACTIVE'
    },
    lastActiveAt: dateType(false)
}, {
    timestamps: true
});

ActivitySchema.index({ user: 1 });
ActivitySchema.index({ status: 1 });
ActivitySchema.index({ createdAt: -1 });

export const Activity = model<ActivityInterface>('activities', ActivitySchema);
