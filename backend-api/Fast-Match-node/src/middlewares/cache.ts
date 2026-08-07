import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';

// TTL of 5 minutes by default
const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

export const cacheMiddleware = (duration?: number) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Exclude methods other than GET
        if (req.method !== 'GET') {
            return next();
        }

        // Account for locale/language in the cache key
        const lang = req.headers['accept-language'] || 'en';
        
        // Build the cache key
        const key = `__express__${req.originalUrl || req.url}__${lang}`;
        
        // Check if we have a cached response
        const cachedBody = cache.get(key);
        
        if (cachedBody) {
            // Serve from cache
            res.setHeader('X-Cache', 'HIT');
            return res.send(cachedBody);
        } else {
            res.setHeader('X-Cache', 'MISS');
            
            // We need to intercept the res.send and res.json methods to capture the response
            const originalSend = res.send.bind(res);
            
            res.send = (body: any): Response => {
                cache.set(key, body, duration || 300);
                return originalSend(body);
            };
            
            return next();
        }
    };
};
