import { model } from 'mongoose';
import { StorySchema } from './schema';
import { StoryInterface } from './types';

export const Story = model<StoryInterface>('stories', StorySchema);
