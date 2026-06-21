import { Schema, model } from 'mongoose';
import { NotificationInterface } from './types';
import { refType, stringType, booleanType } from '../../helpers/commonTypes';

const NotificationSchema = new Schema<NotificationInterface>({
    user: refType('users'),
    title: stringType(true),
    message: stringType(true),
    type: stringType(false),
    data: {
        type: Schema.Types.Mixed,
        default: {}
    },
    isRead: {
        ...booleanType(false),
        default: false
    }
}, {
    timestamps: true
});

NotificationSchema.index({ user: 1, createdAt: -1 });

export const NotificationModel = model<NotificationInterface>('notifications', NotificationSchema);
