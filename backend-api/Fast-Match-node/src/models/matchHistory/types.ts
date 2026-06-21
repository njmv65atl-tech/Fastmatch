import { Document, Types } from "mongoose"

export interface MatchHistoryInterface extends Document {
    user1: Types.ObjectId,
    user2: Types.ObjectId,
    user1Status: 'pending' | 'accepted' | 'declined' | 'timeout',
    user2Status: 'pending' | 'accepted' | 'declined' | 'timeout',
    matchStatus: 'pending' | 'accepted' | 'declined' | 'timeout' | 'completed',
    matchType: 'random' | 'interest' | 'super_match',
    preference: 'everyone' | 'male' | 'female',
    matchedAt: Date,
    callStartedAt: Date | null,
    callEndedAt: Date | null,
    callDuration: number, // in seconds
    endedBy: Types.ObjectId | null,
    user1Rating?: number,
    user2Rating?: number,
}
