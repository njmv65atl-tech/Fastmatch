
import { model } from 'mongoose';
import { UserSchema } from './schema';
import { UserInterface } from './types';

const User = model<UserInterface>('users', UserSchema);
export { User, UserInterface };