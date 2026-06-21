import { Schema } from 'mongoose';
import { TransactionInterface } from './types';
import { stringType, numberType } from '../../helpers/commonTypes';

export const TransactionSchema = new Schema<TransactionInterface>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    type: {
        type: String,
        enum: ['purchase', 'gift_sent', 'gift_received', 'super_match', 'rewind'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: stringType(false),
    relatedUserId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    giftName: stringType(false),
}, {
    timestamps: true
});

TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ type: 1 });
