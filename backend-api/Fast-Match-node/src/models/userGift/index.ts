import { model } from 'mongoose';
import { userGiftSchema } from './schema';
import { UserGiftInterface } from './types';

export const UserGift = model<UserGiftInterface>('UserGift', userGiftSchema);
