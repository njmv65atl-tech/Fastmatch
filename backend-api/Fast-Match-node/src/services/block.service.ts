import { User } from '@models/user';
import { Types } from 'mongoose';

export interface BlockStatus {
    amIBlocked: boolean;
    isBlockedByMe: boolean;
}

class BlockService {
    async getBlockStatus(userId: Types.ObjectId | string, targetUserId: Types.ObjectId | string): Promise<BlockStatus> {
        const [user, target] = await Promise.all([
            User.findById(userId).select('blockedUsers blockedCalls').lean(),
            User.findById(targetUserId).select('blockedUsers blockedCalls').lean()
        ]);

        const userIdStr = userId.toString();
        const targetIdStr = targetUserId.toString();

        const isBlockedByMe = user?.blockedUsers?.some((id: any) => id.toString() === targetIdStr) || false;
        const amIBlocked = target?.blockedUsers?.some((id: any) => id.toString() === userIdStr) || false;

        return { amIBlocked, isBlockedByMe };
    }

    async getCallBlockStatus(userId: Types.ObjectId | string, targetUserId: Types.ObjectId | string): Promise<{ callsBlockedByMe: boolean; amICallBlocked: boolean }> {
        const [user, target] = await Promise.all([
            User.findById(userId).select('blockedCalls').lean(),
            User.findById(targetUserId).select('blockedCalls').lean()
        ]);

        const userIdStr = userId.toString();
        const targetIdStr = targetUserId.toString();

        const callsBlockedByMe = user?.blockedCalls?.some((id: any) => id.toString() === targetIdStr) || false;
        const amICallBlocked = target?.blockedCalls?.some((id: any) => id.toString() === userIdStr) || false;

        return { callsBlockedByMe, amICallBlocked };
    }

    async canCallUser(userId: Types.ObjectId | string, targetUserId: Types.ObjectId | string): Promise<{ allowed: boolean; reason?: string }> {
        const [fullBlock, callBlock] = await Promise.all([
            this.getBlockStatus(userId, targetUserId),
            this.getCallBlockStatus(userId, targetUserId)
        ]);

        if (fullBlock.amIBlocked) return { allowed: false, reason: 'This user has blocked you.' };
        if (fullBlock.isBlockedByMe) return { allowed: false, reason: 'You have blocked this user.' };
        if (callBlock.amICallBlocked) return { allowed: false, reason: 'This user has blocked calls from you.' };
        if (callBlock.callsBlockedByMe) return { allowed: false, reason: 'You have blocked calls from this user.' };

        return { allowed: true };
    }

    async throwIfBlocked(userId: Types.ObjectId | string, targetUserId: Types.ObjectId | string, action: string = 'perform this action'): Promise<void> {
        const { amIBlocked, isBlockedByMe } = await this.getBlockStatus(userId, targetUserId);

        if (isBlockedByMe) {
            throw new Error(`You have blocked this user. Cannot ${action}.`);
        }
        if (amIBlocked) {
            throw new Error(`This user has blocked you. Cannot ${action}.`);
        }
    }

    async blockUser(userId: string, targetUserId: string) {
        if (userId === targetUserId) throw new Error('Cannot block yourself');
        return await User.findByIdAndUpdate(
            userId,
            { $addToSet: { blockedUsers: new Types.ObjectId(targetUserId) } },
            { new: true }
        );
    }

    async unblockUser(userId: string, targetUserId: string) {
        return await User.findByIdAndUpdate(
            userId,
            { $pull: { blockedUsers: new Types.ObjectId(targetUserId) } },
            { new: true }
        );
    }

    async blockCalls(userId: string, targetUserId: string) {
        if (userId === targetUserId) throw new Error('Cannot block calls from yourself');
        return await User.findByIdAndUpdate(
            userId,
            { $addToSet: { blockedCalls: new Types.ObjectId(targetUserId) } },
            { new: true }
        );
    }

    async unblockCalls(userId: string, targetUserId: string) {
        return await User.findByIdAndUpdate(
            userId,
            { $pull: { blockedCalls: new Types.ObjectId(targetUserId) } },
            { new: true }
        );
    }
}

export default new BlockService();
