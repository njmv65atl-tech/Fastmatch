import { Request, Response } from 'express';
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
import { RekognitionClient, DetectModerationLabelsCommand } from "@aws-sdk/client-rekognition";
import notificationServices from '@services/notification.services';

const rekognition = new RekognitionClient({ region: process.env.AWS_REGION || "us-east-1" });

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
        this.removeFriend = this.removeFriend.bind(this);
        this.moderateFrame = this.moderateFrame.bind(this);
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
        await authServices.forgotPass({ email });
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
            const users = await User.aggregate([
                { $match: { _id: { $ne: currentUserId }, isBanned: false } },
                { $sample: { size: 20 } },
                { $project: { password: 0, otps: 0 } }
            ]);
            return this.handleResponse(res, "Discovered users fetched", users);
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async requestVerification(req: Request, res: Response) {
        try {
            const currentUserId = req.user._id;
            // Simulate auto-approval for verification
            await User.findByIdAndUpdate(currentUserId, { isVerified: true });
            return this.handleResponse(res, "Verification successful");
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }
    async buyCoinsMock(req: Request, res: Response) {
        try {
            const { amount } = req.body;
            if (!amount || typeof amount !== 'number') {
                return res.status(400).send(responseEncryptor(req, false, "Invalid amount"));
            }
            const currentUserId = req.user._id;
            const updatedUser = await User.findByIdAndUpdate(
                currentUserId,
                { $inc: { walletBalance: amount } },
                { new: true }
            ).select('-password -otps');
            
            return res.status(200).send(responseEncryptor(req, true, "Coins added successfully", updatedUser));
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

            // Convert gift to coins
            gift.status = 'converted';
            await gift.save();

            const updatedUser = await User.findByIdAndUpdate(
                currentUserId,
                { $inc: { walletBalance: gift.coinValue } },
                { new: true }
            ).select('-password -otps');

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
                const hoursSinceLastClaim = Math.abs(now.getTime() - lastClaim.getTime()) / 36e5;
                if (hoursSinceLastClaim < 24) {
                    return res.status(400).send(responseEncryptor(req, false, "Reward already claimed today."));
                } else if (hoursSinceLastClaim > 48) {
                    streak = 0; // Reset streak if missed a day
                }
            }

            streak += 1;
            const rewardCoins = streak >= 7 ? 100 : 10;
            
            user.loginStreak = streak;
            user.lastRewardClaimedAt = now;
            user.walletBalance += rewardCoins;
            await user.save();

            return res.status(200).send(responseEncryptor(req, true, `Claimed ${rewardCoins} coins! Streak: ${streak}`, user));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async upgradePremiumMock(req: Request, res: Response) {
        try {
            const currentUserId = req.user._id;
            const updatedUser = await User.findByIdAndUpdate(
                currentUserId,
                { isPremium: 'premium', subscriptionPlan: 'monthly', subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
                { new: true }
            ).select('-password -otps');
            return res.status(200).send(responseEncryptor(req, true, "Upgraded to Premium Mock", updatedUser));
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
            const { targetUserId } = req.body;
            if (!targetUserId) return res.status(400).send(responseEncryptor(req, false, "Target user ID required"));

            const existing = await FriendModel.findOne({ requester: currentUserId, recipient: targetUserId });
            if (existing) return res.status(400).send(responseEncryptor(req, false, "Request already sent"));

            const request = await FriendModel.create({ requester: currentUserId, recipient: targetUserId });
            
            // Send notification to recipient
            const currentUser = await User.findById(currentUserId).select('displayName');
            if (currentUser) {
                await notificationServices.sendNotification(
                    new Types.ObjectId(targetUserId),
                    'New Friend Request',
                    `${currentUser.displayName} sent you a friend request.`,
                    'friend_request',
                    { requestId: request._id }
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

            // Emit socket event to the requester that the request was accepted
            (req as any).io.to(request.requester.toString()).emit('friend-request-accepted', { recipientId: currentUserId });

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
            }).populate('requester recipient', 'displayName profilePicture isOnline isPremium publicKey');

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
            }).populate('requester', 'displayName profilePicture isOnline isPremium publicKey');

            return res.status(200).send(responseEncryptor(req, true, "Friend requests fetched", requests));
        } catch (error: any) {
            return res.status(constants.errorCode)
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

            const response = await rekognition.send(command);
            const labels = response.ModerationLabels || [];

            // Define critical explicit labels
            const explicitLabels = ["Explicit Nudity", "Nudity", "Sexual Activity", "Graphic Male Nudity", "Graphic Female Nudity"];
            
            const isExplicit = labels.some(label => explicitLabels.includes(label.Name || ""));

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
}

export default new UserController();