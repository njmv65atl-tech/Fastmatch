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
import SupportTicket from '../models/supportTicket';
import Coupon from '../models/coupon';
import Pricing from '../models/pricing';
import { sendEmail } from '../helpers/email';
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
        return await adminRepos.updateUserStatus(_id, { deletedByAdminAt: new Date() });
    }

    async recoverUser(_id: string) {
        return await adminRepos.updateUserStatus(_id, { deletedByAdminAt: null });
    }

    async hardDeleteUser(_id: string) {
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

        // Fetch users and send push notifications asynchronously via bulk operation
        const users = await User.find(query).select('_id');
        const userIds = users.map(u => u._id as Types.ObjectId);
        
        notificationServices.sendBulkNotification(
            userIds,
            data.title,
            data.message,
            'announcement',
            { announcementId: announcement._id.toString() }
        ).catch(err => console.error('Bulk FCM Error:', err));

        return announcement;
    }

    async deleteAnnouncement(id: string) {
        return await Announcement.findByIdAndDelete(id);
    }

    // Support Ticket Management
    async getSupportTickets(query: any) {
        const filter: any = {};
        if (query.status) filter.status = query.status;
        if (query.category) filter.category = query.category;
        return await SupportTicket.find(filter).populate('user', 'fullName displayName email profilePicture').sort({ createdAt: -1 });
    }

    async updateSupportTicket(id: string, data: any) {
        const updateData: any = { ...data };
        if (data.adminReply && data.adminReply.trim()) {
            updateData.$push = {
                messages: {
                    sender: 'admin',
                    message: data.adminReply.trim(),
                    createdAt: new Date()
                }
            };
        }
        const ticket = await SupportTicket.findByIdAndUpdate(id, updateData, { new: true }).populate('user', 'email fullName');
        if (!ticket) throw new Error("Ticket not found");

        if (data.adminReply && (ticket.email || (ticket.user as any)?.email)) {
            const recipient = ticket.email || (ticket.user as any)?.email;
            const subject = `Update on your support ticket #${ticket._id.toString().slice(-6)}: ${ticket.subject}`;
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border-radius: 8px; background: #fdfdfd; border: 1px solid #eaeaea;">
                    <h2 style="color: #333;">Fastmatch Support Response</h2>
                    <p>Hello,</p>
                    <p>Our support team has replied to your request regarding: <strong>${ticket.subject}</strong></p>
                    <div style="background: #f4f4f5; padding: 15px; border-left: 4px solid #F59E0B; margin: 15px 0; border-radius: 4px;">
                        <p style="margin: 0; color: #222; font-size: 15px; line-height: 1.5;">${data.adminReply}</p>
                    </div>
                    <p style="color: #666; font-size: 13px;">Status: <strong>${ticket.status.toUpperCase()}</strong></p>
                    <p style="color: #999; font-size: 12px; margin-top: 20px;">– Fastmatch Support Team (support@fastmatch.app)</p>
                </div>
            `;
            try {
                sendEmail(recipient, subject, html);
            } catch (err) {
                console.error("Support response email failed:", err);
            }
        }
        return ticket;
    }

    // Coupon Management
    async getCoupons(query: any) {
        return await Coupon.find().sort({ createdAt: -1 });
    }

    async createCoupon(data: any) {
        const existing = await Coupon.findOne({ code: data.code.toUpperCase() });
        if (existing) throw new Error("A coupon with this code already exists");
        return await Coupon.create({
            ...data,
            code: data.code.toUpperCase()
        });
    }

    async deleteCoupon(id: string) {
        return await Coupon.findByIdAndDelete(id);
    }

    // Dynamic Pricing Management
    async getPricing() {
        let pricing = await Pricing.findOne();
        if (!pricing) {
            pricing = await Pricing.create({
                monthlyPrice: 9.00,
                yearlyPrice: 90.00,
                coinPackages: [
                    { id: "com.fastmatch.coins_100", amount: 100, price: 0.99, bonus: 0 },
                    { id: "com.fastmatch.coins_500", amount: 500, price: 4.99, bonus: 50 },
                    { id: "com.fastmatch.coins_1000", amount: 1000, price: 9.99, bonus: 200 }
                ]
            });
        }
        return pricing;
    }

    async updatePricing(data: any) {
        return await Pricing.findOneAndUpdate({}, data, { upsert: true, new: true });
    }
}

export default new AdminService();
