import { Document, Schema } from "mongoose";

export interface TransactionInterface extends Document {
    userId: Schema.Types.ObjectId;
    type: 'purchase' | 'gift_sent' | 'gift_received' | 'super_match' | 'rewind';
    amount: number; // positive for purchase/received, negative for spent
    description: string;
    relatedUserId?: Schema.Types.ObjectId; // For gifts
    giftName?: string; // If a gift was sent
}
