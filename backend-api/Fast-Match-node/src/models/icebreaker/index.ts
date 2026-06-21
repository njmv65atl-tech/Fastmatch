import { model } from 'mongoose';
import { IcebreakerSchema } from './schema';
import { IcebreakerInterface } from './types';

export const Icebreaker = model<IcebreakerInterface>('icebreakers', IcebreakerSchema);
export { IcebreakerInterface };
