import { Document } from "mongoose";

export interface CouponInterface extends Document {
    code: string;
    discountPercent: number;
    discountAmount?: number;
    applicablePlan: 'all' | 'monthly' | 'yearly';
    expiresAt?: Date;
    maxUses?: number;
    usedCount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
