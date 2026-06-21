import { Activity } from "../models/activity/schema";
import { Types } from "mongoose";

interface LogPayload {
    user: Types.ObjectId;
    action: string;
    detail?: string;
    tag?: 'WARNING' | 'SYSTEM INFO' | 'CRITICAL' | 'POLICY';
    location?: string;
    ip?: string;
    deviceName?: string;
    platform?: string;
}

export const logActivity = async (payload: LogPayload) => {
    try {
        await Activity.create({
            ...payload,
            status: 'ACTIVE',
            lastActiveAt: new Date()
        });
        return true;
    } catch (error) {
        console.error('Error logging activity:', error);
        return false;
    }
}
