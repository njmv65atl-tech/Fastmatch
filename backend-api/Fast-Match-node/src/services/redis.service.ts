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

export default redisClient;
