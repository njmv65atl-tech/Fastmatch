import { Document, Schema } from "mongoose";

export interface TransactionInterface extends Document {
    userId: Schema.Types.ObjectId;
    type: 'purchase' | 'buy_coin' | 'subscription' | 'gift_sent' | 'gift_received' | 'super_match' | 'rewind' | 'daily_reward' | 'converted_gift' | 'trial';
    amount: number; // positive for purchase/received, negative for spent
    description: string;
    purchaseToken?: string;
    productId?: string;
    relatedUserId?: Schema.Types.ObjectId; // For gifts
    giftName?: string; // If a gift was sent
}
