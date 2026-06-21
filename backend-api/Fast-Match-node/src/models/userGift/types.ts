import { Document, Types } from 'mongoose';

export interface UserGiftInterface extends Document {
    ownerId: Types.ObjectId;
    senderId: Types.ObjectId;
    giftName: string;
    coinValue: number;
    status: 'available' | 'converted' | 'regifted';
    createdAt: Date;
    updatedAt: Date;
}
