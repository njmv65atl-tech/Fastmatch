import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

// Default to local Redis for development, use env var for production
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on('error', (err) => {
  console.error('[Redis Error]', err);
});

redisClient.on('connect', () => {
  console.log('[Redis] Connected successfully to', REDIS_URL);
});

export const enqueueUser = async (userId: string, userData: any) => {
    await redisClient.hset(`queue:user:${userId}`, 'data', JSON.stringify(userData));
    // Prioritize premium users by giving them a lower score (earlier in time equivalent)
    const score = userData.isPremium ? Date.now() - 1000000000 : Date.now();
    await redisClient.zadd('queue:global', score, userId);
};

export const dequeueUser = async (userId: string) => {
    await redisClient.del(`queue:user:${userId}`);
    await redisClient.zrem('queue:global', userId);
};

export const getQueueUser = async (userId: string): Promise<any | null> => {
    const data = await redisClient.hget(`queue:user:${userId}`, 'data');
    return data ? JSON.parse(data) : null;
};

export const getCandidates = async (limit: number = 50): Promise<any[]> => {
    const userIds = await redisClient.zrange('queue:global', '0', String(limit - 1));
    const candidates = [];
    for (const userId of userIds) {
        const data = await getQueueUser(userId);
        if (data) candidates.push(data);
    }
    return candidates;
};

export const lockMatch = async (lockId: string, ttlMs: number = 3000): Promise<boolean> => {
    const result = await redisClient.set(`lock:match:${lockId}`, '1', 'PX', ttlMs, 'NX');
    return result === 'OK';
};

export const unlockMatch = async (lockId: string) => {
    await redisClient.del(`lock:match:${lockId}`);
};

export const addSkip = async (userId: string, skippedUserId: string, ttlMs: number = 60000) => {
    await redisClient.set(`skip:${userId}:${skippedUserId}`, '1', 'PX', ttlMs);
};

export const hasSkipped = async (userId: string, skippedUserId: string): Promise<boolean> => {
    const exists = await redisClient.exists(`skip:${userId}:${skippedUserId}`);
    return exists === 1;
};

export const setGhostCooldown = async (userId: string, ttlMs: number = 120000) => {
    await redisClient.set(`ghost:${userId}`, '1', 'PX', ttlMs);
};

export const hasGhostCooldown = async (userId: string): Promise<boolean> => {
    const exists = await redisClient.exists(`ghost:${userId}`);
    return exists === 1;
};

export const setActiveCall = async (matchId: string, user1Id: string, user2Id: string) => {
    await redisClient.hset(`call:${matchId}`, { user1Id, user2Id });
    await redisClient.set(`user:incall:${user1Id}`, matchId);
    await redisClient.set(`user:incall:${user2Id}`, matchId);
};

export const removeActiveCall = async (matchId: string) => {
    const callData = await redisClient.hgetall(`call:${matchId}`);
    if (callData.user1Id) await redisClient.del(`user:incall:${callData.user1Id}`);
    if (callData.user2Id) await redisClient.del(`user:incall:${callData.user2Id}`);
    await redisClient.del(`call:${matchId}`);
};

export const checkActiveCall = async (userId: string): Promise<boolean> => {
    const exists = await redisClient.exists(`user:incall:${userId}`);
    return exists === 1;
};

export const getActiveCallMatchId = async (userId: string): Promise<string | null> => {
    return await redisClient.get(`user:incall:${userId}`);
};

export const getCall = async (matchId: string): Promise<any | null> => {
    const callData = await redisClient.hgetall(`call:${matchId}`);
    if (!callData || !callData.user1Id) return null;
    return callData;
};

export const getQueueSize = async (): Promise<number> => {
    return await redisClient.zcard('queue:global');
};

export const setVerification = async (matchId: string, data: any, ttlSec: number = 30) => {
    await redisClient.setex(`verif:${matchId}`, ttlSec, JSON.stringify(data));
};

export const getVerification = async (matchId: string): Promise<any | null> => {
    const data = await redisClient.get(`verif:${matchId}`);
    return data ? JSON.parse(data) : null;
};

export const deleteVerification = async (matchId: string) => {
    await redisClient.del(`verif:${matchId}`);
};

export const getAllVerifications = async (): Promise<Map<string, any>> => {
    const keys = await redisClient.keys('verif:*');
    const map = new Map();
    for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) map.set(key.replace('verif:', ''), JSON.parse(data));
    }
    return map;
};

export default redisClient;
