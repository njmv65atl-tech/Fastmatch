import { Router } from 'express';
import * as adminController from '@controllers/api/v1/admin';
import userController from '@controllers/api/v1/user';
import { validator } from '@middlewares/validator';
import { uploadProfilePicture } from '@middlewares/upload';
// Note: You would normally define validation schemas here. I'll assume they exist or can be added later.

import { verifyAdminToken } from '@middlewares/adminAuth';

import * as adminValidation from './validation';

const router = Router();

router.post('/login', validator(adminValidation.loginSchema), adminController.adminLogin);
router.post('/forgot-password', validator(adminValidation.forgotPasswordSchema), adminController.adminForgotPass);
router.post('/verify-otp', validator(adminValidation.verifyOtpSchema), adminController.adminVerifyOtp);
router.post('/reset-password', validator(adminValidation.resetPasswordSchema), adminController.adminResetPassword);
router.post('/logout', verifyAdminToken, adminController.adminLogout);
router.get('/get-profile', verifyAdminToken, adminController.adminGetProfile);
router.get('/dashboard-stats', verifyAdminToken, adminController.getDashboardStats);

// User Management
router.get('/users', verifyAdminToken, adminController.getUsers);
router.patch('/update-user/:id', verifyAdminToken, adminController.updateUserDetails);
router.delete('/delete-user/:id', verifyAdminToken, adminController.deleteTargetUser);
router.post('/ban-user/:id', verifyAdminToken, adminController.banUser);
router.post('/unban-user/:id', verifyAdminToken, adminController.unbanUser);

// Activity & Reports
router.get('/reports', verifyAdminToken, adminController.getAllReports);
router.get('/activity-logs', verifyAdminToken, adminController.getActivityLogs);
router.get('/active-sessions', verifyAdminToken, adminController.getActiveSessions);
router.get('/analytics', verifyAdminToken, adminController.getAnalyticsData);

import * as userValidation from '../user/validation';

// Admin Self Profile Management
router.get('/my-profile', verifyAdminToken, userController.profileDetails);
router.post('/update-profile', verifyAdminToken, uploadProfilePicture, validator(userValidation.completeProfile), userController.completeProfile);
router.post('/change-password', verifyAdminToken, validator(userValidation.changePasswordValidation), userController.changePassword);

// Subscription Management
router.get('/subscribers', verifyAdminToken, adminController.getSubscribers);
router.post('/grant-premium', verifyAdminToken, adminController.grantPremium);
router.post('/revoke-premium/:id', verifyAdminToken, adminController.revokePremium);

// Icebreaker Management
router.get('/icebreakers', verifyAdminToken, adminController.getIcebreakers);
router.post('/icebreakers', verifyAdminToken, adminController.createIcebreaker);
router.patch('/icebreakers/:id', verifyAdminToken, adminController.updateIcebreaker);
router.delete('/icebreakers/:id', verifyAdminToken, adminController.deleteIcebreaker);

// Announcement Management
router.get('/announcements', verifyAdminToken, adminController.getAnnouncements);
router.post('/announcements', verifyAdminToken, adminController.createAnnouncement);
router.delete('/announcements/:id', verifyAdminToken, adminController.deleteAnnouncement);

// Icebreakers for mobile app (public)
router.get('/public/icebreakers', adminController.getActiveIcebreakers);

export default router;
