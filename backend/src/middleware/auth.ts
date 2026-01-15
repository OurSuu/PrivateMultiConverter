import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.headers['x-api-key'];

    if (!config.apiKey) {
        // If no API key configured, allow all requests (development mode)
        next();
        return;
    }

    if (!apiKey) {
        res.status(401).json({ error: 'Unauthorized', message: 'API key is required' });
        return;
    }

    if (apiKey !== config.apiKey) {
        res.status(403).json({ error: 'Forbidden', message: 'Invalid API key' });
        return;
    }

    next();
};
