import { Schema } from 'mongoose';
import { PricingInterface } from './types';

export const PricingSchema = new Schema<PricingInterface>({
    monthlyPrice: { type: Number, default: 9.00 },
    yearlyPrice: { type: Number, default: 90.00 },
    coinPackages: {
        type: [{
            id: String,
            amount: Number,
            price: Number,
            bonus: Number
        }],
        default: [
            { id: "com.fastmatch.coins_100", amount: 100, price: 0.99, bonus: 0 },
            { id: "com.fastmatch.coins_500", amount: 500, price: 4.99, bonus: 50 },
            { id: "com.fastmatch.coins_1000", amount: 1000, price: 9.99, bonus: 200 }
        ]
    }
}, { timestamps: true });
