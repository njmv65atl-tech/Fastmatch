import { Schema, model, Document, Types } from 'mongoose';

export interface SubscriptionHistoryInterface extends Document {
    userId: Types.ObjectId;
    platform: 'ios' | 'android';
    plan: 'monthly' | 'yearly';
    status: 'active' | 'expired' | 'cancelled' | 'grace_period' | 'billing_retry';
    productId: string;
    originalTransactionId: string;
    latestTransactionId?: string;
    purchaseToken?: string;        // Android specific
    latestReceipt?: string;        // iOS specific
    price: number;
    currency: string;
    purchaseDate: Date;
    expiresDate: Date;
    cancellationDate?: Date;
    autoRenewing: boolean;
    isTrialPeriod: boolean;
    lastWebhookType?: string;
    lastWebhookPayload?: any;
    createdAt: Date;
    updatedAt: Date;
}

const SubscriptionHistorySchema = new Schema<SubscriptionHistoryInterface>({
    userId: { type: Schema.Types.ObjectId, ref: 'users', required: true, index: true },
    platform: { type: String, enum: ['ios', 'android'], required: true },
    plan: { type: String, enum: ['monthly', 'yearly'], required: true },
    status: { type: String, enum: ['active', 'expired', 'cancelled', 'grace_period', 'billing_retry'], default: 'active' },
    productId: { type: String, required: true },
    originalTransactionId: { type: String, required: true, unique: true },
    latestTransactionId: { type: String, default: null },
    purchaseToken: { type: String, default: null },
    latestReceipt: { type: String, default: null },
    price: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    purchaseDate: { type: Date, required: true },
    expiresDate: { type: Date, required: true },
    cancellationDate: { type: Date, default: null },
    autoRenewing: { type: Boolean, default: true },
    isTrialPeriod: { type: Boolean, default: false },
    lastWebhookType: { type: String, default: null },
    lastWebhookPayload: { type: Schema.Types.Mixed, default: null },
}, { timestamps: true });

// SubscriptionHistorySchema.index({ originalTransactionId: 1 });
SubscriptionHistorySchema.index({ userId: 1, status: 1 });

export const SubscriptionHistory = model<SubscriptionHistoryInterface>('subscription_histories', SubscriptionHistorySchema);
