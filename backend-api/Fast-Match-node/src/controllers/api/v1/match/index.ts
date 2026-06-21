import { Request, Response } from 'express';
import { ResponseHandler } from '@config/responseHandler';
import matchService from '@services/match.services';
import { Types } from 'mongoose';

const matchMessages = {
    historyFetched: 'Match history fetched successfully.',
    activeMatchFetched: 'Active match details fetched.',
    noActiveMatch: 'No active match found.',
    matchDetailsFetched: 'Match details fetched successfully.',
    matchNotFound: 'Match not found.',
    onlineUsersFetched: 'Online users count fetched.',
};

class MatchController extends ResponseHandler {

    constructor() {
        super();
        this.getMatchHistory = this.getMatchHistory.bind(this);
        this.getActiveMatch = this.getActiveMatch.bind(this);
        this.getMatchDetails = this.getMatchDetails.bind(this);
        this.getOnlineUsersCount = this.getOnlineUsersCount.bind(this);
        this.submitRating = this.submitRating.bind(this);
    }

    /**
     * GET /api/v1/match/history
     * Query: offset, limit
     * Get user's match/call history
     */
    async getMatchHistory(req: Request, res: Response) {
        const offset = parseInt(req.query.offset as string) || 0;
        const limit = parseInt(req.query.limit as string) || 20;
        const data = await matchService.getMatchHistory(req.user._id as Types.ObjectId, offset, limit);
        return this.handleResponse(res, matchMessages.historyFetched, data);
    }

    /**
     * GET /api/v1/match/active
     * Get current active/pending match for the user
     */
    async getActiveMatch(req: Request, res: Response) {
        const match = await matchService.getActiveMatch(req.user._id as Types.ObjectId);
        if (!match) {
            return this.handleResponse(res, matchMessages.noActiveMatch, null);
        }
        return this.handleResponse(res, matchMessages.activeMatchFetched, match);
    }

    /**
     * GET /api/v1/match/:matchId
     * Get specific match details
     */
    async getMatchDetails(req: Request, res: Response) {
        const matchId = req.params.matchId as string;
        const match = await matchService.getMatchDetails(new Types.ObjectId(matchId));
        if (!match) throw new Error(matchMessages.matchNotFound);
        return this.handleResponse(res, matchMessages.matchDetailsFetched, match);
    }

    /**
     * GET /api/v1/match/online-count
     * Get count of currently online users
     */
    async getOnlineUsersCount(req: Request, res: Response) {
        const { User } = await import('@models/user');
        const count = await User.countDocuments({ isOnline: true, isVerified: true });
        return this.handleResponse(res, matchMessages.onlineUsersFetched, { onlineCount: count });
    }

    /**
     * POST /api/v1/match/rate
     * Body: matchId, rating
     * Submit rating for a match partner
     */
    async submitRating(req: Request, res: Response) {
        const { matchId, rating } = req.body;
        if (!matchId || rating === undefined) throw new Error('matchId and rating are required.');
        const data = await matchService.submitRating(new Types.ObjectId(matchId), req.user._id as Types.ObjectId, rating);
        return this.handleResponse(res, 'Rating submitted successfully.', data);
    }
}

export default new MatchController();
