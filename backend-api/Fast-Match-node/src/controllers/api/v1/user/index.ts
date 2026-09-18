import { Request, Response } from 'express';
import { userSocketMap } from '@config/socket';
import { userConstant, authConstant, constants } from '@config/constant/index';
import authServices from '@services/auth.services';
import { ResponseHandler } from '@config/responseHandler';
import { Types } from 'mongoose';
import { jwtManager } from "@helpers/jwt";
import { logActivity } from "@helpers/activityLogger";
import userRepos from '@repository/user.repo';
import { responseEncryptor } from '@config/decryptor';
import { User } from '@models/user';
import { UserGift } from '@models/userGift';
import { FriendModel } from '@models/friend';
import { ChatMessageModel } from '@models/chat/schema';
import { Transaction } from '@models/transaction';
import SupportTicket from '@models/supportTicket';
import Coupon from '@models/coupon';
import Pricing from '@models/pricing';
import { sendEmail } from '@helpers/email';
import { RekognitionClient, DetectModerationLabelsCommand } from "@aws-sdk/client-rekognition";
import notificationServices from '@services/notification.services';
import { createCircuitBreaker } from '@config/circuitBreaker';

// eslint-disable-next-line no-restricted-syntax
const rekognition = new RekognitionClient({ region: process.env.AWS_REGION || "us-east-1" });

// Circuit Breaker for AWS Rekognition
const rekognitionBreaker = createCircuitBreaker(async (command: any) => {
    return await rekognition.send(command);
}, { name: 'AWSRekognition' });

rekognitionBreaker.fallback((command, error) => {
    console.warn('[AWS Rekognition] Circuit open/failed. Bypassing moderation.', error.message);
    // Return empty labels to simulate a clean frame
    return { ModerationLabels: [] };
});

const message = { ...authConstant.auth, ...userConstant.user };
const { forbidden } = constants;

class UserController extends ResponseHandler {

    jwt = new jwtManager();

    constructor() {
        super();
        this.signUp = this.signUp.bind(this);
        this.verifyOtpSignUp = this.verifyOtpSignUp.bind(this);
        this.resendOtp = this.resendOtp.bind(this);
        this.signIn = this.signIn.bind(this);
        this.logout = this.logout.bind(this);
        this.deleteAccount = this.deleteAccount.bind(this);
        this.profileDetails = this.profileDetails.bind(this);
        this.completeProfile = this.completeProfile.bind(this);
        this.changePassword = this.changePassword.bind(this);
        this.forgotPassword = this.forgotPassword.bind(this);
        this.getUserGifts = this.getUserGifts.bind(this);
        this.convertGiftToCoins = this.convertGiftToCoins.bind(this);
        this.verifyOtp = this.verifyOtp.bind(this);
        this.resetPassword = this.resetPassword.bind(this);
        this.discoverUsers = this.discoverUsers.bind(this);
        this.requestVerification = this.requestVerification.bind(this);
        this.claimDailyReward = this.claimDailyReward.bind(this);
        this.upgradePremiumMock = this.upgradePremiumMock.bind(this);
        this.updatePublicKey = this.updatePublicKey.bind(this);
        this.sendFriendRequest = this.sendFriendRequest.bind(this);
        this.acceptFriendRequest = this.acceptFriendRequest.bind(this);
        this.myFriends = this.myFriends.bind(this);
        this.friendRequests = this.friendRequests.bind(this);
        this.getSentFriendRequests = this.getSentFriendRequests.bind(this);
        this.removeFriend = this.removeFriend.bind(this);
        this.moderateFrame = this.moderateFrame.bind(this);
        this.walletHistory = this.walletHistory.bind(this);
        this.socialAuth = this.socialAuth.bind(this);
        this.createSupportTicket = this.createSupportTicket.bind(this);
        this.getUserSupportTickets = this.getUserSupportTickets.bind(this);
        this.replySupportTicket = this.replySupportTicket.bind(this);
        this.applyCoupon = this.applyCoupon.bind(this);
        this.getAppPricing = this.getAppPricing.bind(this);
        this.verifyPurchase = this.verifyPurchase.bind(this);
    }

    // Step 1: Sign Up — sends OTP to email/phone
    async signUp(req: Request, res: Response) {
        console.log("req.body----------", req.body);
        const user: any = await authServices.signUpUser(req.body);

        // Log Signup Activity
        await logActivity({
            user: user._id,
            action: 'New user registration',
            detail: 'User account created successfully',
            tag: 'SYSTEM INFO',
            ip: req.ip as string,
            deviceName: req.body.deviceName || 'Unknown Device',
            platform: req.body.platform || 'Unknown Platform',
            location: 'Local Network'
        });

        return this.handleResponse(res, message.otpSent, { userId: user._id });
    }

    // Step 2: Verify OTP — verifies OTP, activates account, returns token
    async verifyOtpSignUp(req: Request, res: Response) {
        const { email, phone, otp, deviceId, deviceName, platform } = req.body;
        const identifier = email || phone;
        const data = await authServices.verifyOtpAndActivate(otp, identifier, deviceId, deviceName, platform);
        return this.handleResponse(res, message.verifiedEmail, data);
    }

    // Resend OTP
    async resendOtp(req: Request, res: Response) {
        const { email, phone } = req.body;
        const identifier = email || phone;
        await authServices.resendOtp(identifier);
        return this.handleResponse(res, message.sendOtp);
    }

    // Step 3: Complete Profile (requires token from step 2)
    async completeProfile(req: Request, res: Response) {
        const { isUpdate } = req.body;

        // If it's NOT an intentional update call and profile is already complete, block it.
        if (req.user.isProfileComplete && !isUpdate) {
            throw new Error(message.profileAlreadyCompleted);
        }
        const file = (req as any).file;
        let profilePicture: string | undefined;

        if (file) {
            // Compress with sharp
            try {
                const sharp = require('sharp');
                const fs = require('fs');
                const tempPath = file.path + '.tmp';
                await sharp(file.path)
                    .resize({ width: 600, withoutEnlargement: true })
                    .jpeg({ quality: 80 })
                    .toFile(tempPath);
                fs.renameSync(tempPath, file.path);
            } catch (e) {
                console.error("Image compression error:", e);
            }

            // Extract path after /public/ to make it accessible via URL
            const profilePicturePath = file.path.split('public')[1].replace(/\\/g, '/');
            profilePicture = `/public${profilePicturePath}`;
        }

        let { fullName, displayName, interests, deviceId, deviceName, platform, age, location, language, fcmToken, deviceToken, gender, preference } = req.body;

        // Parse interests if it's a string (Figma requirement: single field from front-end)
        if (typeof interests === 'string') {
            try {
                // Try JSON parse first
                interests = JSON.parse(interests);
            } catch (e) {
                // Fallback to comma separated
                interests = interests.split(',').map((i: string) => i.trim());
            }
        }

        if (interests && (!Array.isArray(interests) || interests.length === 0)) {
            throw new Error('Interests must be a non-empty array if provided.');
        }

        const data = await authServices.updateProfile(req.user._id as Types.ObjectId, {
            fullName: fullName || displayName,
            displayName: displayName || fullName,
            interests,
            profilePicture,
            deviceId,
            deviceName,
            platform,
            age,
            location,
            language,
            fcmToken,
            deviceToken,
            gender,
            preference
        });

        // Log Profile Update Activity
        await logActivity({
            user: req.user._id as Types.ObjectId,
            action: 'Profile updated',
            detail: 'User updated their profile details',
            tag: 'SYSTEM INFO',
            ip: req.ip as string,
            deviceName: req.body.deviceName || 'Unknown Device',
            platform: req.body.platform || 'Unknown Platform',
            location: 'Local Network'
        });

        return this.handleResponse(res, message.profileUpdated, { user: data });
    }

    // Sign In
    async signIn(req: Request, res: Response) {
        const data = await authServices.authenticateUser(req.body);

        // Log Login Activity
        await logActivity({
            user: data.user?._id as any,
            action: 'Successful login',
            detail: `Logged in from IP: ${req.ip}`,
            tag: 'SYSTEM INFO',
            ip: req.ip as string,
            deviceName: req.body.deviceName || 'Unknown Device',
            platform: req.body.platform || 'Unknown Platform',
            location: 'Local Network' // Mock location
        });

        return this.handleResponse(res, message.loggedIn, data);
    }

    async logout(req: Request, res: Response) {
        console.log(`[ logout ] Attempting logout for user: ${req.user._id}`);
        await authServices.logoutUser(req.user._id as Types.ObjectId);
        return this.handleResponse(res, message.logOut);
    }

    async profileDetails(req: Request, res: Response) {
        const user = await authServices.getUserWithId(req.user._id as Types.ObjectId);
        if (!user) throw new Error(message.userNot);
        return this.handleResponse(res, message.userDetail, user);
    }

    async deleteAccount(req: Request, res: Response) {
        await authServices.deleteUserAccount(req.user._id as Types.ObjectId);

        // Log Critical Activity
        await logActivity({
            user: req.user._id as Types.ObjectId,
            action: 'Account deleted',
            detail: 'User has permanently deleted their account',
            tag: 'CRITICAL',
            ip: req.ip as string,
            location: 'Local Network'
        });

        return this.handleResponse(res, message.accountDeleted);
    }

    async changePassword(req: Request, res: Response) {
        await authServices.changePassword(req.user._id as Types.ObjectId, req.body);

        // Log Critical Activity
        await logActivity({
            user: req.user._id as Types.ObjectId,
            action: 'Password changed successfully',
            detail: 'Security credentials updated',
            tag: 'CRITICAL',
            ip: req.ip as string,
            location: 'Local Network'
        });

        return this.handleResponse(res, message.passChanged);
    }

    async forgotPassword(req: Request, res: Response) {
        const { email } = req.body;
        const user = await userRepos.checkuser(email);
        if (!user) {
            return res.status(404).send(responseEncryptor(req, false, message.emailNotRegis));
        }
        const otp = await authServices.forgotPass({ email });
        return this.handleResponse(res, message.otpSent);
    }

    async verifyOtp(req: Request, res: Response) {
        const { otp, email } = req.body;
        const { token } = await authServices.verifytForgotOtp(otp, email);
        return this.handleResponse(res, message.verifyOtp, { token });
    }

    async resetPassword(req: Request, res: Response) {
        const { newPassword } = req.body;

        let token: string = req.headers["x-access-token"] as string;
        if (!token || !token.startsWith("Bearer ")) throw new Error(message.noAuth);

        token = token.split(" ")[1];

        const tokenDetails: any = this.jwt.decryptToken(token);

        if (!tokenDetails?.success || !tokenDetails.payload?._id) {
            throw new Error(message.tokenExpire);
        }

        await authServices.resetPassword(newPassword, tokenDetails.payload._id);

        // Log Critical Activity
        await logActivity({
            user: tokenDetails.payload._id,
            action: 'Password reset successful',
            detail: 'Security credentials recovered',
            tag: 'CRITICAL',
            ip: req.ip as string,
            location: 'Local Network'
        });

        return this.handleResponse(res, message.passwordReset);
    }

    async discoverUsers(req: Request, res: Response) {
        try {
            // Fetch 20 random users (excluding self)
            const currentUserId = req.user._id;
            
            // Get all online user IDs except current user
            const onlineUserIds = Array.from(userSocketMap.keys())
                .filter(id => id !== currentUserId.toString())
                .map(id => new Types.ObjectId(id));

            const users = await User.aggregate([
                { $match: { _id: { $in: onlineUserIds }, isBanned: false } },
                { $sample: { size: 20 } },
                { $project: { password: 0, otp: 0, walletBalance: 0, trustScore: 0, lastActive: 0, fcmToken: 0, deviceToken: 0, loginSessionId: 0 } }
            ]);
            return this.handleResponse(res, "Discovered users fetched", users);
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async requestVerification(req: Request, res: Response) {
        try {
            const currentUserId = req.user._id;
            // Mock disabled in prod: await User.findByIdAndUpdate(currentUserId, { isVerified: true });
            return res.status(403).send(responseEncryptor(req, false, "Verification must be done via standard flow (disabled)"));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async buyCoinsMock(req: Request, res: Response) {
        try {
            return res.status(403).send(responseEncryptor(req, false, "Purchasing coins via mock is disabled in production"));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async getUserGifts(req: Request, res: Response) {
        try {
            const currentUserId = req.user._id;
            const gifts = await UserGift.find({ ownerId: currentUserId, status: 'available' })
                .populate('senderId', 'displayName profilePicture')
                .sort({ createdAt: -1 });

            return res.status(200).send(responseEncryptor(req, true, "Gifts fetched successfully", gifts));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async convertGiftToCoins(req: Request, res: Response) {
        try {
            const currentUserId = req.user._id;
            const { giftId } = req.body;

            if (!giftId) {
                return res.status(400).send(responseEncryptor(req, false, "Gift ID is required"));
            }

            const gift = await UserGift.findOne({ _id: giftId, ownerId: currentUserId, status: 'available' });
            if (!gift) {
                return res.status(404).send(responseEncryptor(req, false, "Gift not found or already converted"));
            }

            const user = await User.findById(currentUserId);
            const maxWalletLimit = 50000;
            const currentBalance = user?.walletBalance || 0;
            
            if (currentBalance + gift.coinValue > maxWalletLimit) {
                return res.status(400).send(responseEncryptor(req, false, "Maximum only 50000 coins can be stored in your wallet. Convert some coins later."));
            }
            
            // Convert gift to coins
            gift.status = 'converted';
            await gift.save();
            
            if (user) {
                user.walletBalance = currentBalance + gift.coinValue;
                await user.save();
            }
            
            const updatedUser = user;

            return res.status(200).send(responseEncryptor(req, true, "Gift converted successfully", updatedUser));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async claimDailyReward(req: Request, res: Response) {
        try {
            const currentUserId = req.user._id;
            const user = await User.findById(currentUserId);
            if (!user) return res.status(404).send(responseEncryptor(req, false, "User not found"));

            const now = new Date();
            const lastClaim = user.lastRewardClaimedAt;
            let streak = user.loginStreak || 0;
            
            if (lastClaim) {
                const isSameDate = lastClaim.getUTCFullYear() === now.getUTCFullYear() &&
                                   lastClaim.getUTCMonth() === now.getUTCMonth() &&
                                   lastClaim.getUTCDate() === now.getUTCDate();
                
                if (isSameDate) {
                    return res.status(400).send(responseEncryptor(req, false, "Reward already claimed today."));
                }
                
                const yesterday = new Date(now);
                yesterday.setUTCDate(yesterday.getUTCDate() - 1);
                const isYesterday = lastClaim.getUTCFullYear() === yesterday.getUTCFullYear() &&
                                    lastClaim.getUTCMonth() === yesterday.getUTCMonth() &&
                                    lastClaim.getUTCDate() === yesterday.getUTCDate();
                                    
                if (!isYesterday) {
                    streak = 0; // Reset streak if missed yesterday
                }
            }

            streak += 1;
            
            const isPremium = user.isPremium === 'premium';
            let rewardCoins = isPremium ? 50 : 10;
            
            if (streak >= 7) {
                rewardCoins = isPremium ? 200 : 100;
            }
            
            user.loginStreak = streak;
            user.lastRewardClaimedAt = now;
            const maxWalletLimit = 50000;
            const currentBalance = user.walletBalance || 0;
            
            if (currentBalance + rewardCoins > maxWalletLimit) {
                return res.status(400).send(responseEncryptor(req, false, "Maximum only 50000 coins can be stored in your wallet."));
            }
            
            user.walletBalance = currentBalance + rewardCoins;
            await user.save();

            // Record transaction
            await Transaction.create({
                userId: user._id,
                type: 'daily_reward',
                amount: rewardCoins,
                description: `Daily reward claimed. Streak: ${streak}`,
            });

            return res.status(200).send(responseEncryptor(req, true, `Claimed ${rewardCoins} coins! Streak: ${streak}`, user));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async upgradePremiumMock(req: Request, res: Response) {
        try {
            return res.status(403).send(responseEncryptor(req, false, "Premium upgrade mock is disabled in production"));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async updatePublicKey(req: Request, res: Response) {
        try {
            const { publicKey } = req.body;
            if (!publicKey) return res.status(400).send(responseEncryptor(req, false, "Public key is required"));
            
            const updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                { publicKey },
                { new: true }
            ).select('-password -otps');
            
            return res.status(200).send(responseEncryptor(req, true, "Public key updated successfully", updatedUser));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async sendFriendRequest(req: Request, res: Response) {
        try {
            const currentUserId = req.user._id;
            const { targetUserId, message } = req.body;
            if (!targetUserId) return res.status(400).send(responseEncryptor(req, false, "Target user ID required"));

            const currentUser = await User.findById(currentUserId).select('displayName role isPremium');
            if (!currentUser) return res.status(404).send(responseEncryptor(req, false, "User not found"));

            if (currentUser.isPremium !== 'premium' && currentUser.role !== 'admin') {
                return res.status(403).send(responseEncryptor(req, false, "You must be a premium user to send a connection request."));
            }

            const existing = await FriendModel.findOne({ requester: currentUserId, recipient: targetUserId });
            if (existing) return res.status(400).send(responseEncryptor(req, false, "Request already sent"));

            const request = await FriendModel.create({ requester: currentUserId, recipient: targetUserId, message: message || '' });
            
            // Send notification to recipient
            if (currentUser) {
                await notificationServices.sendNotification(
                    new Types.ObjectId(targetUserId),
                    'New Friend Request',
                    `${currentUser.displayName} sent you a friend request.`,
                    'friend_request',
                    { requestId: request._id.toString() }
                );
            }

            return res.status(201).send(responseEncryptor(req, true, "Friend request sent", request));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async acceptFriendRequest(req: Request, res: Response) {
        try {
            const currentUserId = req.user._id;
            const { requestId } = req.body;
            if (!requestId) return res.status(400).send(responseEncryptor(req, false, "Request ID required"));

            const request = await FriendModel.findOneAndUpdate(
                { _id: requestId, recipient: currentUserId, status: 'pending' },
                { status: 'accepted' },
                { new: true }
            );

            if (!request) return res.status(404).send(responseEncryptor(req, false, "Request not found"));

            // Insert initial message into Chat if it exists
            if (request.message && request.message.trim().length > 0) {
                await ChatMessageModel.create({
                    sender: request.requester,
                    receiver: currentUserId,
                    message: request.message,
                    messageType: 'text',
                    isRead: false,
                    deliveredAt: new Date()
                });
            }

            // Emit socket event to the requester that the request was accepted
            (req as any).io.to(request.requester.toString()).emit('friend-request-accepted', { recipientId: currentUserId });

            // Send notification to requester
            const currentUser = await User.findById(currentUserId).select('displayName');
            if (currentUser) {
                await notificationServices.sendNotification(
                    request.requester as Types.ObjectId,
                    'Friend Request Accepted',
                    `${currentUser.displayName} accepted your friend request.`,
                    'friend_accepted',
                    { recipientId: currentUserId.toString() }
                );
            }

            return res.status(200).send(responseEncryptor(req, true, "Friend request accepted", request));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async myFriends(req: Request, res: Response) {
        try {
            const currentUserId = req.user._id;
            const friends = await FriendModel.find({
                $or: [{ requester: currentUserId }, { recipient: currentUserId }],
                status: 'accepted'
            }).populate('requester recipient', 'displayName fullName profilePicture isOnline isPremium publicKey lastActive age trustScore ratingCount totalRatingScore gender');

            return res.status(200).send(responseEncryptor(req, true, "Friends fetched", friends));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async friendRequests(req: Request, res: Response) {
        try {
            const currentUserId = req.user._id;
            const requests = await FriendModel.find({
                recipient: currentUserId,
                status: 'pending'
            }).populate('requester', 'displayName fullName profilePicture isOnline isPremium publicKey lastActive age trustScore ratingCount totalRatingScore gender');

            return res.status(200).send(responseEncryptor(req, true, "Friend requests fetched", requests));
        } catch (error: any) {
            return res.status(constants.errorCode)
                .send(responseEncryptor(req, false, error.message));
        }
    }

    async getSentFriendRequests(req: Request, res: Response) {
        try {
            const currentUserId = req.user._id;
            const requests = await FriendModel.find({
                requester: currentUserId,
                status: 'pending'
            }).populate('recipient', 'displayName profilePicture');

            return res.status(200).send(responseEncryptor(req, true, "Sent friend requests fetched", requests));
        } catch (error: any) {
            return res.status(constants.errorCode || 500)
                .send(responseEncryptor(req, false, error.message));
        }
    }

    async removeFriend(req: Request, res: Response) {
        try {
            const currentUserId = req.user._id;
            const { targetUserId } = req.body;
            if (!targetUserId) throw new Error("targetUserId is required");

            await FriendModel.findOneAndDelete({
                $or: [
                    { requester: currentUserId, recipient: targetUserId },
                    { requester: targetUserId, recipient: currentUserId }
                ]
            });
            return res.status(200).send(responseEncryptor(req, true, "Friend removed"));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async checkFriendStatus(req: Request, res: Response) {
        try {
            const currentUserId = req.user._id;
            const targetUserId = req.params.userId;
            if (!targetUserId) throw new Error("targetUserId is required");

            const friendship = await FriendModel.findOne({
                $or: [
                    { requester: currentUserId, recipient: targetUserId },
                    { requester: targetUserId, recipient: currentUserId }
                ]
            });

            return res.status(200).send(responseEncryptor(req, true, "Status fetched", friendship));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async moderateFrame(req: Request, res: Response) {
        try {
            const currentUserId = req.user._id;
            const { imageBase64 } = req.body;
            if (!imageBase64) return res.status(400).send(responseEncryptor(req, false, "Image required"));

            // Strip prefix if any (data:image/jpeg;base64,)
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
            const imageBuffer = Buffer.from(base64Data, 'base64');

            const command = new DetectModerationLabelsCommand({
                Image: { Bytes: imageBuffer },
                MinConfidence: 80
            });

            const response = await rekognitionBreaker.fire(command);
            const labels = response.ModerationLabels || [];

            // Define critical explicit labels
            const explicitLabels = ["Explicit Nudity", "Nudity", "Sexual Activity", "Graphic Male Nudity", "Graphic Female Nudity"];
            
            const isExplicit = labels.some((label: any) => explicitLabels.includes(label.Name || ""));

            if (isExplicit) {
                // Auto-ban user
                const user = await User.findByIdAndUpdate(currentUserId, { isBanned: true }, { new: true });
                // Return flag to client to instantly kill socket call
                return res.status(200).send(responseEncryptor(req, true, "Explicit content detected. User banned.", { isBanned: true }));
            }

            return res.status(200).send(responseEncryptor(req, true, "Frame is clean", { isBanned: false }));
        } catch (error: any) {
            console.error("Moderation Error:", error);
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async walletHistory(req: Request, res: Response) {
        try {
            const currentUserId = req.user._id;
            const history = await Transaction.find({ userId: currentUserId }).sort({ createdAt: -1 });
            return res.status(200).send(responseEncryptor(req, true, "Wallet history fetched", history));
        } catch (error: any) {
            console.error("Wallet History Error:", error);
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async getGlobalUsers(req: Request, res: Response) {
        try {
            const currentUserId = req.user._id;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 100;
            const skip = (page - 1) * limit;

            const currentUser = await User.findById(currentUserId).select('blockedUsers');
            const blockedUsers = currentUser?.blockedUsers || [];

            // Fetch all registered users except current user, user's blocked users, and admin banned/deleted accounts
            const query: any = {
                _id: { $nin: [currentUserId, ...blockedUsers] },
                isBanned: { $ne: true },
                deletedByAdminAt: null
            };

            const users = await User.find(query)
                .select('displayName fullName profilePicture isOnline lastActive age gender location interests language createdAt')
                .sort({ isOnline: -1, lastActive: -1 })
                .skip(skip)
                .limit(limit);
            
            const total = await User.countDocuments(query);

            return res.status(200).send(responseEncryptor(req, true, "Global users fetched", {
                users,
                total,
                page,
                pages: Math.ceil(total / limit)
            }));
        } catch (error: any) {
            console.error("Global Users Error:", error);
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async rejectFriendRequest(req: Request, res: Response) {
        try {
            const currentUserId = req.user._id;
            const { requestId } = req.body;
            if (!requestId) return res.status(400).send(responseEncryptor(req, false, "Request ID required"));

            const request = await FriendModel.findOneAndDelete({
                _id: requestId,
                recipient: currentUserId,
                status: 'pending'
            });

            if (!request) return res.status(404).send(responseEncryptor(req, false, "Request not found or already processed"));

            return res.status(200).send(responseEncryptor(req, true, "Friend request rejected"));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async toggleFavorite(req: Request, res: Response) {
        try {
            const currentUserId = req.user._id;
            const { targetUserId } = req.body;
            if (!targetUserId) return res.status(400).send(responseEncryptor(req, false, "Target User ID required"));

            const currentUser = await User.findById(currentUserId);
            if (!currentUser) throw new Error("User not found");

            const favIndex = currentUser.favoriteUsers?.indexOf(targetUserId);
            let isFavorite = false;
            if (favIndex > -1) {
                currentUser.favoriteUsers.splice(favIndex, 1);
            } else {
                currentUser.favoriteUsers = currentUser.favoriteUsers || [];
                currentUser.favoriteUsers.push(targetUserId);
                isFavorite = true;
            }
            await currentUser.save();

            return res.status(200).send(responseEncryptor(req, true, isFavorite ? "Added to favorites" : "Removed from favorites", { isFavorite }));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async getFavorites(req: Request, res: Response) {
        try {
            const currentUserId = req.user._id;
            const currentUser = await User.findById(currentUserId).populate({
                path: 'favoriteUsers',
                select: 'fullName displayName profilePicture isOnline lastActive gender age location'
            });

            if (!currentUser) throw new Error("User not found");

            return res.status(200).send(responseEncryptor(req, true, "Favorites fetched", currentUser.favoriteUsers || []));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async socialAuth(req: Request, res: Response) {
        try {
            const { email, fullName, displayName, profilePicture, deviceId, deviceName, platform, fcmToken } = req.body;
            if (!email) {
                return res.status(400).send(responseEncryptor(req, false, "Email is required for social authentication"));
            }

            const cleanEmail = email.toLowerCase().trim();
            let user = await User.findOne({ email: cleanEmail });
            let isNewUser = false;

            if (!user) {
                isNewUser = true;
                user = await User.create({
                    email: cleanEmail,
                    fullName: fullName || displayName || cleanEmail.split('@')[0],
                    displayName: displayName || fullName || cleanEmail.split('@')[0],
                    profilePicture: profilePicture || null,
                    deviceId,
                    deviceName,
                    platform: platform || 'android',
                    fcmToken: fcmToken || '',
                    isVerified: true,
                    isProfileComplete: false,
                    role: 'user',
                    isPremium: 'free'
                });
            } else {
                if (deviceId) user.deviceId = deviceId;
                if (deviceName) user.deviceName = deviceName;
                if (platform) user.platform = platform;
                if (fcmToken) user.fcmToken = fcmToken;
                if (!user.isVerified) user.isVerified = true;
                await user.save();
            }

            const token = this.jwt.generateToken({ _id: user._id as Types.ObjectId, password: null }, false);
            return res.status(200).send(responseEncryptor(req, true, isNewUser ? "Account created via social login" : "Signed in successfully", {
                token,
                user
            }));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async createSupportTicket(req: Request, res: Response) {
        try {
            const { category, subject, message: ticketMsg, email } = req.body;
            const currentUserId = req.user?._id;
            const userEmail = email || req.user?.email;

            if (!subject || !ticketMsg) {
                return res.status(400).send(responseEncryptor(req, false, "Subject and message are required"));
            }

            const ticket = await SupportTicket.create({
                user: currentUserId || null,
                email: userEmail,
                category: category || 'other',
                subject,
                message: ticketMsg,
                status: 'open'
            });

            if (userEmail) {
                const mailSubject = `Fastmatch Support Ticket Received: #${ticket._id.toString().slice(-6)}`;
                const html = `
                    <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border-radius: 8px; background: #fff; border: 1px solid #eee;">
                        <h2 style="color: #333;">Support Request Received</h2>
                        <p>Hello,</p>
                        <p>We have received your support request regarding: <strong>${subject}</strong> (Ticket #${ticket._id.toString().slice(-6)}).</p>
                        <p>Our team is reviewing your ticket and will get back to you shortly.</p>
                        <p style="color: #888; font-size: 12px; margin-top: 20px;">– Fastmatch Support (support@fastmatch.app)</p>
                    </div>
                `;
                try {
                    sendEmail(userEmail, mailSubject, html);
                } catch (e) {
                    console.error("Support confirmation email failed:", e);
                }
            }

            return res.status(200).send(responseEncryptor(req, true, "Support ticket created successfully", ticket));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async getUserSupportTickets(req: Request, res: Response) {
        try {
            const currentUserId = req.user?._id;
            const tickets = await SupportTicket.find({ user: currentUserId }).sort({ createdAt: -1 });
            return res.status(200).send(responseEncryptor(req, true, "Tickets fetched successfully", tickets));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async replySupportTicket(req: Request, res: Response) {
        try {
            const currentUserId = req.user?._id;
            const ticketId = req.params.id;
            const { message } = req.body;

            if (!message || !message.trim()) {
                return res.status(400).send(responseEncryptor(req, false, "Message is required"));
            }

            const ticket = await SupportTicket.findOne({ _id: ticketId, user: currentUserId });
            if (!ticket) {
                return res.status(404).send(responseEncryptor(req, false, "Ticket not found"));
            }

            ticket.userReply = message.trim();
            if (!ticket.messages) {
                ticket.messages = [];
            }
            ticket.messages.push({
                sender: 'user',
                message: message.trim(),
                createdAt: new Date()
            });

            if (ticket.status === 'resolved' || ticket.status === 'closed') {
                ticket.status = 'open';
            }
            await ticket.save();

            return res.status(200).send(responseEncryptor(req, true, "Reply submitted successfully", ticket));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async applyCoupon(req: Request, res: Response) {
        try {
            const { code, plan } = req.body;
            if (!code) {
                return res.status(400).send(responseEncryptor(req, false, "Coupon code is required"));
            }

            const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true });
            if (!coupon) {
                return res.status(404).send(responseEncryptor(req, false, "Invalid or inactive promo code"));
            }

            if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
                return res.status(400).send(responseEncryptor(req, false, "This promo code has expired"));
            }

            if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
                return res.status(400).send(responseEncryptor(req, false, "This promo code has reached maximum redemptions"));
            }

            if (coupon.applicablePlan !== 'all' && plan && coupon.applicablePlan !== plan.toLowerCase()) {
                return res.status(400).send(responseEncryptor(req, false, `This code is only applicable to the ${coupon.applicablePlan} plan`));
            }

            return res.status(200).send(responseEncryptor(req, true, `Promo code applied! ${coupon.discountPercent}% OFF`, {
                code: coupon.code,
                discountPercent: coupon.discountPercent,
                applicablePlan: coupon.applicablePlan
            }));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async getAppPricing(req: Request, res: Response) {
        try {
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
            return res.status(200).send(responseEncryptor(req, true, "Pricing fetched", pricing));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async verifyPurchase(req: Request, res: Response) {
        try {
            const currentUserId = req.user._id;
            const { productId, purchaseToken, receipt, platform } = req.body;

            if (!productId) {
                return res.status(400).send(responseEncryptor(req, false, "Product ID is required"));
            }

            const user = await User.findById(currentUserId);
            if (!user) {
                return res.status(404).send(responseEncryptor(req, false, "User not found"));
            }

            // Subscription products
            if (productId === 'com.fastmatch.premium.monthly' || productId === 'com.fastmatch.premium.yearly') {
                user.isPremium = 'premium';
                await user.save();

                await Transaction.create({
                    userId: user._id,
                    type: 'subscription',
                    amount: productId === 'com.fastmatch.premium.yearly' ? 90 : 9,
                    description: `Premium subscription unlocked via ${platform === 'ios' ? 'Apple App Store' : 'Google Play'} (${productId})`,
                });

                return res.status(200).send(responseEncryptor(req, true, "Premium subscription activated successfully!", user));
            }

            // Coin packages
            let coinsToAdd = 0;
            let pricePaid = 0;
            if (productId === 'com.fastmatch.coins_100') {
                coinsToAdd = 100;
                pricePaid = 0.99;
            } else if (productId === 'com.fastmatch.coins_500') {
                coinsToAdd = 550; // 500 + 50 bonus
                pricePaid = 4.99;
            } else if (productId === 'com.fastmatch.coins_1000') {
                coinsToAdd = 1200; // 1000 + 200 bonus
                pricePaid = 9.99;
            } else {
                return res.status(400).send(responseEncryptor(req, false, "Unknown product ID"));
            }

            const maxWalletLimit = 50000;
            const currentBalance = user.walletBalance || 0;
            user.walletBalance = Math.min(maxWalletLimit, currentBalance + coinsToAdd);
            await user.save();

            await Transaction.create({
                userId: user._id,
                type: 'buy_coin',
                amount: coinsToAdd,
                description: `${coinsToAdd} Coins purchased via ${platform === 'ios' ? 'Apple App Store' : 'Google Play'} ($${pricePaid})`,
            });

            return res.status(200).send(responseEncryptor(req, true, `Successfully added ${coinsToAdd} coins to your wallet!`, user));
        } catch (error: any) {
            console.error("verifyPurchase Error:", error);
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }
}

export default new UserController();