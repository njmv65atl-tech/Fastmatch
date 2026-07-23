import express, { Router } from 'express';
import UserController from '@controllers/api/v1/user/index';
import { tryCatchMiddleware } from '@middlewares/async';
import { validator } from '@middlewares/validator';
import {
    signUp,
    verifyOtpSignUp,
    resendOtp,
    signIn,
    completeProfile,
    changePasswordValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    verifyOtpValidation
} from './validation';
import { verifyToken } from '@middlewares/auth';
import { uploadProfilePicture } from '@middlewares/upload';

const router: Router = express();

// ─── Auth Flow ───────────────────────────────────────────────
router.post('/signUp', validator(signUp), tryCatchMiddleware(UserController.signUp))
router.post('/verify-signup-otp', validator(verifyOtpSignUp), tryCatchMiddleware(UserController.verifyOtpSignUp))
router.post('/resend-otp', validator(resendOtp), tryCatchMiddleware(UserController.resendOtp))

router.post('/complete-profile', verifyToken, uploadProfilePicture, validator(completeProfile), tryCatchMiddleware(UserController.completeProfile))
router.post('/signIn', validator(signIn), tryCatchMiddleware(UserController.signIn))

router.post('/forgot-password', validator(forgotPasswordValidation), tryCatchMiddleware(UserController.forgotPassword))
router.post('/verify-otp', validator(verifyOtpValidation), tryCatchMiddleware(UserController.verifyOtp))
router.post('/reset-password', validator(resetPasswordValidation), tryCatchMiddleware(UserController.resetPassword))

router.get('/profile', verifyToken, tryCatchMiddleware(UserController.profileDetails))
router.post('/update-profile', verifyToken, uploadProfilePicture, tryCatchMiddleware(UserController.completeProfile))
router.post('/change-password', verifyToken, validator(changePasswordValidation), tryCatchMiddleware(UserController.changePassword))
router.post('/logout', verifyToken, tryCatchMiddleware(UserController.logout))
router.delete('/delete-profile', verifyToken, tryCatchMiddleware(UserController.deleteAccount))
router.get('/discover', verifyToken, tryCatchMiddleware(UserController.discoverUsers))
router.get('/gifts', verifyToken, tryCatchMiddleware(UserController.getUserGifts))
router.post('/gifts/convert', verifyToken, tryCatchMiddleware(UserController.convertGiftToCoins))
router.post('/request-verification', verifyToken, tryCatchMiddleware(UserController.requestVerification))
router.post('/buy-coins-mock', verifyToken, tryCatchMiddleware(UserController.buyCoinsMock))
router.post('/claim-daily-reward', verifyToken, tryCatchMiddleware(UserController.claimDailyReward))
router.post('/upgrade-premium-mock', verifyToken, tryCatchMiddleware(UserController.upgradePremiumMock))
router.post('/update-public-key', verifyToken, tryCatchMiddleware(UserController.updatePublicKey))
router.post('/send-friend-request', verifyToken, tryCatchMiddleware(UserController.sendFriendRequest))
router.post('/accept-friend-request', verifyToken, tryCatchMiddleware(UserController.acceptFriendRequest))
router.post('/remove-friend', verifyToken, tryCatchMiddleware(UserController.removeFriend))
router.get('/my-friends', verifyToken, tryCatchMiddleware(UserController.myFriends))
router.get('/friend-requests', verifyToken, tryCatchMiddleware(UserController.friendRequests))
router.get('/check-friend-status/:userId', verifyToken, tryCatchMiddleware(UserController.checkFriendStatus))
router.post('/moderate-frame', verifyToken, tryCatchMiddleware(UserController.moderateFrame))

export default router;