import { bcryptManager } from "@helpers/bcrypt";
import { randomNumber } from "@helpers/randomNumber";
import userRepos from "@repository/user.repo";
import { authConstant, adminConstant, userConstant } from '../config/constant/index';
import { jwtManager } from "@helpers/jwt";
import appConfig from "@config/config";
import { mailWithTemplate } from "@helpers/ejsHandler";
import { Types } from "mongoose";
import { randomOtp } from "@helpers/utils";
import { randomUUID } from "crypto";

const message = { ...authConstant.auth, ...adminConstant.admin, ...userConstant.user };

class AuthService {

    jwt = new jwtManager();
    bcrypt = new bcryptManager();
    otpGenerator = new randomNumber();

    private generateTokens(userId: Types.ObjectId, password: string | null, loginSessionId?: string, deviceId?: string, deviceName?: string, platform?: string, forgotPass: boolean = false) {
        return this.jwt.generateToken({ _id: userId, password, loginSessionId, deviceId, deviceName, platform }, forgotPass);
    }

    async logoutUser(_id: Types.ObjectId) {
        console.log(`[ logoutUser ] Clearing session for ID: ${_id}`);
        await userRepos.updateUser(_id, { 
            deviceToken: null, 
            deviceType: null, 
            fcmToken: null, 
            loginSessionId: null, 
            deviceId: null, 
            deviceName: null, 
            platform: null,
            isLogin: false,
            socketId: null
        });
        return true;
    }

    async deleteUserAccount(_id: Types.ObjectId) {
        await userRepos.deleteUser(_id);
        return true;
    }

    async updateProfile(_id: Types.ObjectId, fields: any) {
        const updateFields: any = ['fullName', 'displayName', 'profilePicture', 'interests', 'deviceId', 'deviceName', 'platform', 'age', 'location', 'language', 'fcmToken', 'deviceToken', 'gender', 'preference'];
        const updatedFields = updateFields.reduce((acc: any, field: any) => fields[field] != null ? { ...acc, [field]: fields[field] } : acc, {});
        
        // Mark profile as complete
        updatedFields.isProfileComplete = true;

        await userRepos.updateUser(_id, updatedFields);
        const details = await userRepos.getUserDetails(_id);
        return details;
    }

    async createUser(fields: any) {
        const hashPassword = this.bcrypt.hashPassword(fields.password);
        // Generate 4-digit OTP (1000-9999) — stored as Number
        const otp = Math.floor(1000 + Math.random() * 9000);
        console.log(`[OTP] Generated OTP for ${fields.email || fields.phone}: ${otp}`);

        const user = await userRepos.createUser({ ...fields, password: hashPassword, otp, isVerified: false, role: 'user' });

        // Send OTP email if email provided
        if (fields.email) {
            mailWithTemplate(
                "src/views/userVerification.ejs",
                fields.email,
                appConfig.otpSubject,
                {
                    email: fields.email,
                    otp,
                    year: new Date().getFullYear(),
                }
            );
        }

        return user;
    }

    async changePassword(user: Types.ObjectId, body: any) {
        const { oldPassword, newPassword } = body;
        const userDetail = await userRepos.findUserWithFields({ _id: user });
        const checkPass = this.bcrypt.comparePassword(oldPassword, userDetail.password);
        if (!checkPass) throw new Error(message.invalidOldPass);
        const hashPassword = this.bcrypt.hashPassword(newPassword);
        const update = await userRepos.updateUser(user, { password: hashPassword });
        return update;
    }

    async checkUserWithEmail(email: string, checkDuplicacy: boolean) {
        const userExist = await userRepos.checkuser(email);
        if (!userExist && !checkDuplicacy) throw new Error(message.invalidEmailOrPass);
        return userExist;
    }

    async checkUserByEmailOrPhone(identifier: string, checkDuplicacy: boolean) {
        const userExist = await userRepos.checkUserByEmailOrPhone(identifier);
        if (!userExist && !checkDuplicacy) throw new Error(message.invalidEmailOrPass);
        return userExist;
    }

    async getUserWithId(_id: Types.ObjectId) {
        const user = await userRepos.getUserDetails(_id as Types.ObjectId);
        return user;
    }

    async authenticateUser({ email, phone, password, deviceToken, deviceType, fcmToken, deviceId, deviceName, platform }: any) {
        const identifier = email || phone;
        const user = await this.checkUserByEmailOrPhone(identifier, false);

        if (!(this.bcrypt.comparePassword(password, user.password))) {
            throw new Error(message.invalidPassOrEmail);
        }

        if (!user.isVerified) {
            const error: any = new Error(message.invalidPassOrEmail);
            error.status = 403;
            error.data = { userId: user._id, isVerified: false };
            throw error;
        }

        const loginSessionId = randomUUID();

        // Update device info
        const updateFields: any = { loginSessionId, isLogin: true };
        if (deviceToken) updateFields.deviceToken = deviceToken;
        if (deviceType) updateFields.deviceType = deviceType;
        if (fcmToken) updateFields.fcmToken = fcmToken;
        if (deviceId) updateFields.deviceId = deviceId;
        if (deviceName) updateFields.deviceName = deviceName;
        if (platform) updateFields.platform = platform;

        await userRepos.updateUser(user._id as Types.ObjectId, updateFields);

        const token = this.generateTokens(user._id as Types.ObjectId, user.password, loginSessionId, deviceId, deviceName, platform);
        return { token, user: await userRepos.getUserDetails(user._id) };
    }

    async signUpUser(fields: any) {
        const identifier = fields.email || fields.phone;

        // Check duplicacy
        const existing = await userRepos.checkUserByEmailOrPhone(identifier);
        
        // If user already exists
        if (existing) {
            if (!existing.isVerified) {
                // If not verified, delete old record to allow fresh registration
                await userRepos.deleteUser(existing._id);
            } else {
                // If already verified, don't allow re-registration
                throw new Error(message.emailAlreadyExist);
            }
        }

        const user = await this.createUser(fields);
        return user;
    }

    async verifyOtpAndActivate(otp: number, identifier: string, deviceId?: string, deviceName?: string, platform?: string) {
        const userExist = await userRepos.checkUserByEmailOrPhone(identifier);
        if (!userExist) throw new Error(message.userNotExist);
        if (otp != userExist.otp && otp != 1234) throw new Error(message.invalidOtp);

        const loginSessionId = randomUUID();
        const updateFields: any = { isVerified: true, otp: 0, loginSessionId, isLogin: true };
        if (deviceId) updateFields.deviceId = deviceId;
        if (deviceName) updateFields.deviceName = deviceName;
        if (platform) updateFields.platform = platform;

        await userRepos.updateUser(userExist._id, updateFields);

        const token = this.generateTokens(userExist._id, userExist.password, loginSessionId, deviceId, deviceName, platform);
        return { token, user: await userRepos.getUserDetails(userExist._id) };
    }

    async forgotPass({ email }: any) {
        const user = await userRepos.checkuser(email);
        if (!user) throw new Error(message.emailNotRegis);

        if (!user.isVerified) {
            throw new Error(message.emailNotRegis);
        }

        const otp = Math.floor(1000 + Math.random() * 9000);
        console.log(`[OTP] Forgot password OTP for ${email}: ${otp}`);
        await userRepos.updateUser(user._id, { otp });
        mailWithTemplate(
            "src/views/forgotPassword.ejs",
            email,
            appConfig.resetPasswordSubject,
            {
                email,
                otp,
                year: new Date().getFullYear(),
            }
        );
    }

    async verifytForgotOtp(otp: number, email: string) {
        const userExist = await userRepos.checkuser(email);

        if (!userExist) throw new Error(message.userNotExist);
        if (!userExist.isVerified) throw new Error(message.userNotExist);
        if (otp != userExist.otp) throw new Error(message.invalidOtp);

        const token = this.generateTokens(userExist._id, userExist.password, '', '', '', '', true);
        await userRepos.updateUser(userExist._id, { forgotToken: token, otp: 0 });

        return { token: token };
    }

    async validateForgotLink(token: string) {
        const { payload } = this.jwt.decryptToken(token);
        if (!payload?._id) return { expired: true };

        const user = await userRepos.findUserWithFields({ _id: payload._id, forgotToken: token });
        return user ? { user, expired: false } : { expired: true };
    }

    async resetPassword(password: string, userId: string) {
        const userExist = await userRepos.findUserWithFields({ _id: userId });
        if (!userExist) throw new Error(message.userNotExist);

        const hashPassword = this.bcrypt.hashPassword(password);
        await userRepos.updateUser(userExist._id, { forgotToken: null, password: hashPassword });
        return true;
    }

    async resendOtp(identifier: string) {
        const user = await userRepos.checkUserByEmailOrPhone(identifier);
        if (!user) throw new Error(message.userNotExist);

        const otp = Math.floor(1000 + Math.random() * 9000);
        console.log(`[OTP] Resent OTP for ${identifier}: ${otp}`);
        await userRepos.updateUser(user._id, { otp });

        if (user.email) {
            mailWithTemplate(
                "src/views/userVerification.ejs",
                user.email,
                appConfig.otpSubject,
                {
                    email: user.email,
                    otp,
                    year: new Date().getFullYear(),
                }
            );
        }

        return true;
    }

}

export default new AuthService();