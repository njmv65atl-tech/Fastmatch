import { Request, Response } from 'express';
import { ResponseHandler } from '@config/responseHandler';
import reportService from '@services/report.services';
import { Types } from 'mongoose';

const reportMessages = {
    reportSubmitted: 'Your report has been submitted successfully.',
    reportFetched: 'Reports fetched successfully.',
};

class ReportController extends ResponseHandler {

    constructor() {
        super();
        this.submitReport = this.submitReport.bind(this);
        this.getMyReports = this.getMyReports.bind(this);
        this.reportAndBlockUser = this.reportAndBlockUser.bind(this);
    }

    /**
     * POST /api/v1/report
     * Body: reportedUser (optional), matchId (optional), category, message
     */
    async submitReport(req: Request, res: Response) {
        const userId = req.user._id as Types.ObjectId;
        const { reportedUser, matchId, category, message } = req.body;

        if (!category && !message) {
            throw new Error('At least a category or a message is required to submit a report.');
        }

        const report = await reportService.createReport({
            reporter: userId,
            reportedUser,
            matchId,
            category: Array.isArray(category) ? category : (category ? [category] : ['other']),
            message
        });

        return this.handleResponse(res, reportMessages.reportSubmitted, report);
    }

    /**
     * GET /api/v1/report/my
     * Fetch reports submitted by the current user
     */
    async getMyReports(req: Request, res: Response) {
        const userId = req.user._id as Types.ObjectId;
        const reports = await reportService.getUserReports(userId, 'reporter');
        return this.handleResponse(res, reportMessages.reportFetched, reports);
    }

    /**
     * POST /api/v1/report/report-block
     * Body: reportedUser, category, message
     */
    async reportAndBlockUser(req: Request, res: Response) {
        const userId = req.user._id as Types.ObjectId;
        const { reportedUser, category, message } = req.body;

        if (!reportedUser) {
            throw new Error('Reported user ID is required.');
        }

        const report = await reportService.reportAndBlockUser({
            reporter: userId,
            reportedUser,
            category: Array.isArray(category) ? category : (category ? [category] : ['misbehavior']),
            message
        });

        return this.handleResponse(res, reportMessages.reportSubmitted, report);
    }
}

export default new ReportController();
