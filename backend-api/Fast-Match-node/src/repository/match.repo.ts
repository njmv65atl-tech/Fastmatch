import { MatchHistory, MatchHistoryInterface } from "@models/matchHistory"
import { Types } from "mongoose"

class MatchRepository {

    async createMatch(data: any) {
        const match = new MatchHistory(data);
        await match.save();
        return match;
    }

    async getMatchById(_id: Types.ObjectId) {
        const match = await MatchHistory.findById(_id)
            .populate('user1', 'fullName displayName profilePicture gender dateOfBirth isOnline interests isVerified ratingCount totalRatingScore')
            .populate('user2', 'fullName displayName profilePicture gender dateOfBirth isOnline interests isVerified ratingCount totalRatingScore')
            .lean() as any;
        return match;
    }

    async updateMatch(_id: Types.ObjectId, updateFields: any) {
        await MatchHistory.updateOne({ _id }, updateFields);
    }

    async updateMatchWithDoc(_id: Types.ObjectId, updateFields: any) {
        const match = await MatchHistory.findByIdAndUpdate(_id, updateFields, { new: true })
            .populate('user1', 'fullName displayName profilePicture gender dateOfBirth isOnline isVerified ratingCount totalRatingScore')
            .populate('user2', 'fullName displayName profilePicture gender dateOfBirth isOnline isVerified ratingCount totalRatingScore')
            .lean() as any;
        return match;
    }

    async getUserMatchHistory(userId: Types.ObjectId, offset: number = 0, limit: number = 20) {
        const matches = await MatchHistory.find({
            $or: [{ user1: userId }, { user2: userId }],
            matchStatus: 'completed'
        })
            .populate('user1', 'fullName displayName profilePicture gender dateOfBirth isVerified ratingCount totalRatingScore')
            .populate('user2', 'fullName displayName profilePicture gender dateOfBirth isVerified ratingCount totalRatingScore')
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .lean();

        const totalCount = await MatchHistory.countDocuments({
            $or: [{ user1: userId }, { user2: userId }],
            matchStatus: 'completed'
        });

        return { data: matches, totalCount };
    }

    async getActiveMatchByUser(userId: Types.ObjectId) {
        const match = await MatchHistory.findOne({
            $or: [{ user1: userId }, { user2: userId }],
            matchStatus: { $in: ['pending', 'accepted'] }
        })
            .populate('user1', 'fullName displayName profilePicture gender dateOfBirth isOnline socketId isVerified ratingCount totalRatingScore')
            .populate('user2', 'fullName displayName profilePicture gender dateOfBirth isOnline socketId isVerified ratingCount totalRatingScore')
            .lean() as any;
        return match;
    }
}

export default new MatchRepository()
