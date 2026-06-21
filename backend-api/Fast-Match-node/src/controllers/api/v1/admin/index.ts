import { Request, Response } from 'express';
import { constants } from '@config/constant';
import { responseEncryptor } from '@config/decryptor';
import adminServices from '@services/admin.services';
import { tryCatchMiddleware } from '@middlewares/async';

export const adminLogin = tryCatchMiddleware(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await adminServices.adminLogin({ email, password });
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Login successful', result));
});

export const adminForgotPass = tryCatchMiddleware(async (req: Request, res: Response) => {
    const { email } = req.body;
    await adminServices.adminForgotPass({ email });
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Otp sent to your email'));
});

export const adminResetPassword = tryCatchMiddleware(async (req: Request, res: Response) => {
    const { password } = req.body;
    let token = req.headers['x-access-token'] as string;
    if (token?.startsWith('Bearer ')) {
        token = token.split(' ')[1];
    }
    await adminServices.adminResetPassword(password, token);
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Password reset successful'));
});

export const adminVerifyOtp = tryCatchMiddleware(async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    const result = await adminServices.adminVerifyOtp(email, Number(otp));
    res.status(constants.successCode).json(responseEncryptor(req, true, 'OTP verified successfully', result));
});

export const adminLogout = tryCatchMiddleware(async (req: any, res: Response) => {
    await adminServices.adminLogout(req.user._id);
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Logout successful'));
});

export const adminGetProfile = tryCatchMiddleware(async (req: any, res: Response) => {
    const result = await adminServices.adminGetProfile(req.user._id);
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Profile fetched successfully', result));
});

export const getDashboardStats = tryCatchMiddleware(async (req: Request, res: Response) => {
    const result = await adminServices.getDashboardOverview();
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Dashboard stats fetched successfully', result));
});

export const getUsers = tryCatchMiddleware(async (req: Request, res: Response) => {
    const result = await adminServices.listUsers(req.query);
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Users list fetched successfully', result));
});

export const updateUserDetails = tryCatchMiddleware(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await adminServices.updateUser(id as string, req.body);
    res.status(constants.successCode).json(responseEncryptor(req, true, 'User updated successfully', result));
});

export const deleteTargetUser = tryCatchMiddleware(async (req: Request, res: Response) => {
    const { id } = req.params;
    await adminServices.deleteUser(id as string);
    res.status(constants.successCode).json(responseEncryptor(req, true, 'User deleted successfully'));
});

export const banUser = tryCatchMiddleware(async (req: Request, res: Response) => {
    const { id } = req.params;
    await adminServices.banUser(id as string);
    res.status(constants.successCode).json(responseEncryptor(req, true, 'User banned successfully'));
});

export const unbanUser = tryCatchMiddleware(async (req: Request, res: Response) => {
    const { id } = req.params;
    await adminServices.unbanUser(id as string);
    res.status(constants.successCode).json(responseEncryptor(req, true, 'User unbanned successfully'));
});

export const getAllReports = tryCatchMiddleware(async (req: Request, res: Response) => {
    const result = await adminServices.getReportList(req.query);
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Reports fetched successfully', result));
});

export const getActivityLogs = tryCatchMiddleware(async (req: Request, res: Response) => {
    const result = await adminServices.getActivityLogs(req.query);
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Activity logs fetched successfully', result));
});

export const getActiveSessions = tryCatchMiddleware(async (req: Request, res: Response) => {
    const result = await adminServices.getActiveSessions(req.query);
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Active sessions fetched successfully', result));
});

export const getAnalyticsData = tryCatchMiddleware(async (req: Request, res: Response) => {
    const result = await adminServices.getAnalytics();
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Analytics data fetched successfully', result));
});

// Subscription Management
export const getSubscribers = tryCatchMiddleware(async (req: Request, res: Response) => {
    const result = await adminServices.getSubscribers(req.query);
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Subscribers fetched successfully', result));
});

export const grantPremium = tryCatchMiddleware(async (req: Request, res: Response) => {
    const { userId, plan } = req.body;
    const result = await adminServices.grantPremium(userId, plan);
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Premium granted successfully', result));
});

export const revokePremium = tryCatchMiddleware(async (req: Request, res: Response) => {
    const result = await adminServices.revokePremium(req.params.id as string);
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Premium revoked successfully', result));
});

// Icebreaker Management
export const getIcebreakers = tryCatchMiddleware(async (req: Request, res: Response) => {
    const result = await adminServices.getIcebreakers(req.query);
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Icebreakers fetched successfully', result));
});

export const createIcebreaker = tryCatchMiddleware(async (req: Request, res: Response) => {
    const result = await adminServices.createIcebreaker(req.body);
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Icebreaker created successfully', result));
});

export const updateIcebreaker = tryCatchMiddleware(async (req: Request, res: Response) => {
    const result = await adminServices.updateIcebreaker(req.params.id as string, req.body);
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Icebreaker updated successfully', result));
});

export const deleteIcebreaker = tryCatchMiddleware(async (req: Request, res: Response) => {
    await adminServices.deleteIcebreaker(req.params.id as string);
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Icebreaker deleted successfully'));
});

// Announcement Management
export const getAnnouncements = tryCatchMiddleware(async (req: Request, res: Response) => {
    const result = await adminServices.getAnnouncements(req.query);
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Announcements fetched successfully', result));
});

export const createAnnouncement = tryCatchMiddleware(async (req: Request, res: Response) => {
    const result = await adminServices.createAnnouncement(req.body);
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Announcement created successfully', result));
});

export const deleteAnnouncement = tryCatchMiddleware(async (req: Request, res: Response) => {
    await adminServices.deleteAnnouncement(req.params.id as string);
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Announcement deleted successfully'));
});

// Icebreakers for mobile app (public)
export const getActiveIcebreakers = tryCatchMiddleware(async (req: Request, res: Response) => {
    const result = await adminServices.getActiveIcebreakers();
    res.status(constants.successCode).json(responseEncryptor(req, true, 'Active icebreakers fetched successfully', result));
});
