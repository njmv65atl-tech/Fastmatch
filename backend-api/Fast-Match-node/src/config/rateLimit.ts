import rateLimit from 'express-rate-limit';
import { constants } from './constant';

export const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: constants.maxRequest
})