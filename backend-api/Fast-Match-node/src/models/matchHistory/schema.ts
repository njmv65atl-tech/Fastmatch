import { Schema } from 'mongoose';
import { MatchHistoryInterface } from './types';
import { refType, stringType, numberType, dateType } from '../../helpers/commonTypes';

const matchStatusEnum = ['pending', 'accepted', 'declined', 'timeout', 'completed'];
const userStatusEnum = ['pending', 'accepted', 'declined', 'timeout'];
const preferenceEnum = ['everyone', 'male', 'female'];
const matchTypeEnum = ['random', 'interest', 'super_match'];

export const MatchHistorySchema = new Schema<MatchHistoryInterface>({
    user1: refType('users'),
    user2: refType('users'),
    user1Status: {
        type: String,
        enum: userStatusEnum,
        default: 'pending'
    },
    user2Status: {
        type: String,
        enum: userStatusEnum,
        default: 'pending'
    },
    matchStatus: {
        type: String,
        enum: matchStatusEnum,
        default: 'pending'
    },
    matchType: {
        type: String,
        enum: matchTypeEnum,
        default: 'random'
    },
    preference: {
        type: String,
        enum: preferenceEnum,
        default: 'everyone'
    },
    matchedAt: {
        type: Date,
        default: Date.now
    },
    callStartedAt: dateType(false),
    callEndedAt: dateType(false),
    callDuration: numberType(false),
    endedBy: refType('users'),
    user1Rating: { type: Number, default: 0 },
    user2Rating: { type: Number, default: 0 },
}, {
    timestamps: true
});

MatchHistorySchema.index({ user1: 1, user2: 1 });
MatchHistorySchema.index({ matchStatus: 1 });
MatchHistorySchema.index({ createdAt: -1 });
