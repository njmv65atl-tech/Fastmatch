import { Schema } from 'mongoose';
import { IcebreakerInterface } from './types';
import { stringType, booleanType } from '../../helpers/commonTypes';

export const IcebreakerSchema = new Schema<IcebreakerInterface>({
    text: stringType(true),
    category: { type: String, enum: ['funny', 'romantic', 'intellectual', 'casual', 'bold'], required: true },
    isActive: { ...booleanType(false), default: true },
}, { timestamps: true });

IcebreakerSchema.index({ category: 1 });
IcebreakerSchema.index({ isActive: 1 });
IcebreakerSchema.index({ createdAt: -1 });
