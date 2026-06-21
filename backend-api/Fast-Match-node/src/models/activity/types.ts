import { Document, Types } from "mongoose"

export interface ActivityInterface extends Document {
    user: Types.ObjectId,
    action: string,
    detail: string,
    tag: 'WARNING' | 'SYSTEM INFO' | 'CRITICAL' | 'POLICY',
    location: string,
    ip: string,
    deviceName: string,
    platform: string,
    status: 'ACTIVE' | 'IDLE',
    lastActiveAt?: Date,
}
