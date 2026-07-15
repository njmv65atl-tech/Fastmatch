import { authConstant, adminConstant } from '../config/constant/index';
import userRepos from "@repository/user.repo";
import adminRepos from "@repository/admin.repo";
import { bcryptManager } from "@helpers/bcrypt";
import { jwtManager } from "@helpers/jwt";
import { mailWithTemplate } from "@helpers/ejsHandler";
import appConfig from "@config/config";
import { Types } from "mongoose";
import { User } from '../models/user';
import { Icebreaker } from '../models/icebreaker';
import { Announcement } from '../models/announcement';
import notificationServices from "./notification.services";

const message = { ...authConstant.auth, ...adminConstant.admin };

class AdminService {
    jwt = new jwtManager();
    bcrypt = new bcryptManager();

    private generateTokens(userId: Types.ObjectId, password: string | null, forgotPass: boolean = false) {
        return this.jwt.generateToken({ _id: userId, password }, forgotPass);
    }

    async adminLogin({ email, password }: any) {
        const user = await userRepos.checkuser(email);
        if (!user) throw new Error(message.invalidEmailOrPass);

        if (user.role !== 'admin') {
            throw new Error(message.notAuthorized);
        }

        if (!(this.bcrypt.comparePassword(password, user.password))) {
            throw new Error(message.invalidEmailOrPass);
        }

        const token = this.generateTokens(user._id as Types.ObjectId, user.password);
        return { token, user: await userRepos.getUserDetails(user._id) };
    }

    async adminForgotPass({ email }: any) {
        const user = await userRepos.checkuser(email);
        if (!user) throw new Error(message.emailNotRegis);
        
        if (user.role !== 'admin') {
            throw new Error(message.notAuthorized);
        }

        const otp = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
        await userRepos.updateUser(user._id, { otp });
        
        await mailWithTemplate(
            "src/views/admin/adminOtpMail.ejs",
            email,
            appConfig.otpSubject,
            {
                email,
                otp,
                year: new Date().getFullYear(),
            }
        );
        return true;
    }

    async adminVerifyOtp(email: string, otp: number) {
        const user = await userRepos.checkuser(email);
        if (!user) throw new Error(message.emailNotRegis);

        if (user.otp !== otp) throw new Error(message.invalidOtp);
        
        // Generate a temporary reset token valid for 15 mins
        const token = this.generateTokens(user._id as Types.ObjectId, user.password, true);
        await userRepos.updateUser(user._id, { otp: null, forgotToken: token });
        
        return { token };
    }

    async adminResetPassword(password: string, token: string) {
        const { payload } = this.jwt.decryptToken(token);
        if (!payload?._id) throw new Error(message.tokenExpire);

        const user = await userRepos.findUserWithFields({ _id: payload._id, forgotToken: token });
        if (!user) throw new Error(message.tokenExpire);

        const hashPassword = this.bcrypt.hashPassword(password);
        await userRepos.updateUser(user._id, { forgotToken: null, password: hashPassword });
        return true;
    }

    async adminLogout(userId: Types.ObjectId) {
        // Here we can clear session or blacklist token if needed
        // For now, just returning true as client-side will clear the token
        return true;
    }

    async adminGetProfile(userId: Types.ObjectId) {
        return await userRepos.getUserDetails(userId);
    }

    async getDashboardOverview() {
        const metrics = await adminRepos.getDashboardMetrics();
        const userGrowth = await adminRepos.getUserGrowthStats();
        const monthlyActivity = await adminRepos.getMonthlyActivityStats();

        return {
            metrics,
            userGrowth,
            monthlyActivity
        };
    }

    async listUsers(query: any) {
        return await adminRepos.listUsers(query);
    }

    async updateUser(_id: string, data: any) {
        return await adminRepos.updateUserStatus(_id, data);
    }

    async deleteUser(_id: string) {
        return await adminRepos.deleteUser(_id);
    }

    async banUser(_id: string) {
        return await adminRepos.updateUserStatus(_id, { isBanned: true });
    }

    async unbanUser(_id: string) {
        return await adminRepos.updateUserStatus(_id, { isBanned: false });
    }

    async getReportList(query: any) {
        return await adminRepos.getReports(query);
    }

    async getActivityLogs(query: any) {
        return await adminRepos.getActivityLogs(query);
    }

    async getActiveSessions(query: any) {
        return await adminRepos.getActiveSessions(query);
    }

    async getAnalytics() {
        return await adminRepos.getAnalyticsData();
    }

    // Subscription Management
    async getSubscribers(query: any) {
        const { page = 1, limit = 10, search = '' } = query;
        const filter: any = { isPremium: 'premium' };
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const users = await User.find(filter).skip(skip).limit(Number(limit)).sort({ subscriptionExpiresAt: -1 });
        const total = await User.countDocuments(filter);
        return { users, total, page: Number(page), limit: Number(limit) };
    }

    async grantPremium(userId: string, plan: string) {
        const expiresAt = new Date();
        if (plan === 'yearly') {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
        }
        return await User.findByIdAndUpdate(userId, {
            isPremium: 'premium',
            subscriptionPlan: plan,
            subscriptionExpiresAt: expiresAt
        }, { new: true });
    }

    async revokePremium(userId: string) {
        return await User.findByIdAndUpdate(userId, {
            isPremium: 'free',
            subscriptionPlan: null,
            subscriptionExpiresAt: null
        }, { new: true });
    }

    // Icebreaker Management
    async getIcebreakers(query: any) {
        const filter = query.category ? { category: query.category } : {};
        return await Icebreaker.find(filter).sort({ createdAt: -1 });
    }

    async createIcebreaker(data: any) {
        return await Icebreaker.create(data);
    }

    async updateIcebreaker(id: string, data: any) {
        return await Icebreaker.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteIcebreaker(id: string) {
        return await Icebreaker.findByIdAndDelete(id);
    }

    async getActiveIcebreakers() {
        return await Icebreaker.find({ isActive: true });
    }

    // Announcement Management
    async getAnnouncements(query: any) {
        return await Announcement.find().populate('createdBy', 'fullName email').sort({ createdAt: -1 });
    }

    async createAnnouncement(data: any) {
        const announcement = await Announcement.create(data);
        
        // Determine target audience
        let query: any = { role: 'user', deletedAt: null };
        if (data.targetAudience === 'premium') {
            query.isPremium = 'premium';
        } else if (data.targetAudience === 'free') {
            query.isPremium = 'free';
        }

        // Fetch users and send push notifications asynchronously
        const users = await User.find(query).select('_id');
        users.forEach(user => {
            notificationServices.sendNotification(
                user._id,
                data.title,
                data.message,
                'announcement',
                { announcementId: announcement._id.toString() }
            ).catch(err => console.error('FCM Error:', err));
        });

        return announcement;
    }

    async deleteAnnouncement(id: string) {
        return await Announcement.findByIdAndDelete(id);
    }
}

export default new AdminService();
