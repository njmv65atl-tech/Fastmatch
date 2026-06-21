import { Schema, model } from 'mongoose';
import { ChatMessageInterface } from './types';

const ChatMessageSchema = new Schema<ChatMessageInterface>({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    deliveredAt: {
        type: Date
    },
    messageType: {
        type: String,
        enum: ['text', 'image'],
        default: 'text'
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    deletedBy: {
        type: [Schema.Types.ObjectId],
        ref: 'users',
        default: []
    }
}, {
    timestamps: true
});

// Indexes for fast retrieval of conversation history
ChatMessageSchema.index({ sender: 1, receiver: 1 });
ChatMessageSchema.index({ receiver: 1, sender: 1 });
ChatMessageSchema.index({ createdAt: -1 });

export const ChatMessageModel = model<ChatMessageInterface>('ChatMessage', ChatMessageSchema);
