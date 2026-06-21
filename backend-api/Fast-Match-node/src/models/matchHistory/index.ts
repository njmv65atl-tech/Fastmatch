import { model } from 'mongoose';
import { MatchHistorySchema } from './schema';
import { MatchHistoryInterface } from './types';

const MatchHistory = model<MatchHistoryInterface>('matchHistories', MatchHistorySchema);
export { MatchHistory, MatchHistoryInterface };
