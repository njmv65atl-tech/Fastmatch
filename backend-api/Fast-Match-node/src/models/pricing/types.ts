import { Document } from "mongoose";

export interface PricingInterface extends Document {
    monthlyPrice: number;
    yearlyPrice: number;
    coinPackages: {
        id: string;
        amount: number;
        price: number;
        bonus: number;
    }[];
    updatedAt: Date;
}
