import { Report } from "@models/report";
import { User } from "@models/user";
import { Types } from "mongoose";

class ReportService {
    /**
     * Create a new report/feedback entry
     */
    async createReport(data: {
        reporter: Types.ObjectId;
        reportedUser?: string;
        matchId?: string;
        category: string[];
        message?: string;
    }) {
        const { reporter, reportedUser, matchId, category, message } = data;

        const report = new Report({
            reporter,
            reportedUser: (reportedUser && Types.ObjectId.isValid(reportedUser)) ? new Types.ObjectId(reportedUser) : undefined,
            matchId: (matchId && Types.ObjectId.isValid(matchId)) ? new Types.ObjectId(matchId) : undefined,
            category,
            message: message || ''
        });

        await report.save();

        // Decrease trust score of reported user
        if (reportedUser && Types.ObjectId.isValid(reportedUser)) {
            await User.findByIdAndUpdate(reportedUser, { $inc: { trustScore: -20 } });
        }

        return report;
    }

    /**
     * Get reports for a specific user (as reporter or reported)
     */
    async getUserReports(userId: Types.ObjectId, role: 'reporter' | 'reported' = 'reporter') {
        const query = role === 'reporter' ? { reporter: userId } : { reportedUser: userId };
        return await Report.find(query).sort({ createdAt: -1 });
    }

    /**
     * Report a user and automatically block them
     */
    async reportAndBlockUser(data: {
        reporter: Types.ObjectId;
        reportedUser: string;
        category: string[];
        message?: string;
    }) {
        const { reporter, reportedUser, category, message } = data;

        // 1. Save Report
        const report = await this.createReport({
            reporter,
            reportedUser,
            category,
            message
        });

        // 2. Block User
        if (Types.ObjectId.isValid(reportedUser)) {
            await User.findByIdAndUpdate(reporter, {
                $addToSet: { blockedUsers: new Types.ObjectId(reportedUser) }
            });
        }

        return report;
    }
}

export default new ReportService();
