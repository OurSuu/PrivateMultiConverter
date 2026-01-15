import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

export const rateLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
        error: 'Too Many Requests',
        message: `You have exceeded the ${config.rateLimit.max} requests per ${config.rateLimit.windowMs / 60000} minutes limit`,
    },
    standardHeaders: true,
    legacyHeaders: false,
});
