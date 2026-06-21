import { Schema } from 'mongoose';
import { UserGiftInterface } from './types';

export const userGiftSchema = new Schema<UserGiftInterface>({
    ownerId: { type: Schema.Types.ObjectId, ref: 'users', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    giftName: { type: String, required: true },
    coinValue: { type: Number, required: true },
    status: { type: String, enum: ['available', 'converted', 'regifted'], default: 'available' },
}, {
    timestamps: true
});
