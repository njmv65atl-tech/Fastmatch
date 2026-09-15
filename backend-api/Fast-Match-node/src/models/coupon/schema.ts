import { Schema } from 'mongoose';
import { CouponInterface } from './types';
import { booleanType, numberType, stringType, dateType } from '../../helpers/commonTypes';

export const CouponSchema = new Schema<CouponInterface>({
    code: {
        ...stringType(true),
        uppercase: true,
        trim: true,
        unique: true
    },
    discountPercent: {
        ...numberType(true),
        min: 1,
        max: 100
    },
    discountAmount: numberType(false),
    applicablePlan: {
        type: String,
        enum: ['all', 'monthly', 'yearly'],
        default: 'all'
    },
    expiresAt: dateType(false),
    maxUses: numberType(false),
    usedCount: {
        type: Number,
        default: 0
    },
    isActive: {
        ...booleanType(false),
        default: true
    }
}, {
    timestamps: true
});

CouponSchema.index({ code: 1 });
CouponSchema.index({ isActive: 1 });
CouponSchema.index({ expiresAt: 1 });
