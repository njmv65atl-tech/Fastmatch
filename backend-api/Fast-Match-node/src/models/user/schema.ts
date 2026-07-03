import { Schema } from 'mongoose';
import { UserInterface } from './types';
import { booleanType, numberType, stringType, dateType } from '../../helpers/commonTypes';
import { deviceTypes } from '@config/constant';

const genderEnum = ['male', 'female', 'other'];

export const UserSchema = new Schema<UserInterface>({
    email: {
        ...stringType(false),
        lowercase: true
    },
    phone: stringType(false),
    deviceType: {
        type: String,
        enum: Object.values(deviceTypes),
        default: null
    },
    deviceToken: stringType(false),
    fcmToken: stringType(false),
    password: stringType(false),
    fullName: stringType(false),
    displayName: stringType(false),
    socketId: stringType(false),
    profilePicture: stringType(false),
    interests: {
        type: [String],
        default: []
    },
    gender: {
        type: String,
        enum: genderEnum,
        default: null
    },
    preference: {
        type: String,
        enum: ['everyone', 'male', 'female'],
        default: 'everyone'
    },
    dateOfBirth: dateType(false),
    isVerified: booleanType(false),
    isOnline: booleanType(false),
    isLogin: booleanType(false),
    otp: numberType(false),
    forgotToken: stringType(false),
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isPremium: {
        type: String,
        enum: ['free', 'premium'],
        default: 'free'
    },
    deviceId: stringType(false),
    loginSessionId: stringType(false),
    deviceName: stringType(false),
    platform: {
        type: String,
        enum: ['android', 'ios', 'web'],
        default: null
    },
    blockedUsers: {
        type: [Schema.Types.ObjectId],
        ref: 'users',
        default: []
    },
    age: stringType(false),
    location: stringType(false),
    language: stringType(false),
    totalRatingScore: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    lastOnlineNotificationAt: { type: Date, default: null },
    dailyMatchCount: { type: Number, default: 0 },
    dailyMatchDate: { type: Date, default: null },
    subscriptionPlan: {
        type: String,
        enum: ['monthly', 'yearly', null],
        default: null
    },
    subscriptionExpiresAt: {
        type: Date,
        default: null
    },
    isProfileComplete: booleanType(false),
    isBanned: booleanType(false),
    blockedCalls: {
        type: [Schema.Types.ObjectId],
        ref: 'users',
        default: []
    },
    skippedUsers: [{
        userId: { type: Schema.Types.ObjectId, ref: 'users' },
        skippedAt: { type: Date, default: Date.now }
    }],
    walletBalance: { type: Number, default: 0 },
    trustScore: { type: Number, default: 100 },
    lastRewardClaimedAt: { type: Date },
    loginStreak: { type: Number, default: 0 },
    publicKey: { type: String },
}, {
    timestamps: true
})

UserSchema.index({ email: 1 })
UserSchema.index({ phone: 1 })
UserSchema.index({ isOnline: 1 })
UserSchema.index({ isBanned: 1 })
UserSchema.index({ gender: 1 })
