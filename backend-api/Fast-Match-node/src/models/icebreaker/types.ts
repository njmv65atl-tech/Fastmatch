import { Document } from 'mongoose';

export interface IcebreakerInterface extends Document {
    text: string;
    category: 'funny' | 'romantic' | 'intellectual' | 'casual' | 'bold';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
