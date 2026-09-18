import { Schema } from 'mongoose';
import { SupportTicketInterface } from './types';
import { refType, stringType } from '../../helpers/commonTypes';

export const SupportTicketSchema = new Schema<SupportTicketInterface>({
    user: refType('users'),
    email: {
        ...stringType(true),
        lowercase: true
    },
    category: {
        type: String,
        enum: ['account', 'billing', 'technical', 'safety', 'other'],
        default: 'other'
    },
    subject: stringType(true),
    message: stringType(true),
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open'
    },
    adminReply: stringType(false),
    userReply: stringType(false),
    messages: [
        {
            sender: {
                type: String,
                enum: ['user', 'admin'],
                required: true
            },
            message: stringType(true),
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, {
    timestamps: true
});

SupportTicketSchema.index({ user: 1 });
SupportTicketSchema.index({ email: 1 });
SupportTicketSchema.index({ status: 1 });
SupportTicketSchema.index({ createdAt: -1 });
