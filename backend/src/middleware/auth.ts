/**
 * Authentication Middleware
 * 
 * Validates API key from:
 * 1. x-api-key header (primary method)
 * 2. apiKey query parameter (for download URLs)
 * 
 * In development mode (no API_KEY set), all requests are allowed.
 */

import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';

/**
 * Strict auth middleware - requires API key for API routes
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // Skip auth if no API key is configured (development mode)
    if (!config.apiKey) {
        next();
        return;
    }

    // Try to get API key from header first, then query parameter
    const apiKeyHeader = req.headers['x-api-key'] as string | undefined;
    const apiKeyQuery = req.query.apiKey as string | undefined;
    const apiKey = apiKeyHeader || apiKeyQuery;

    if (!apiKey) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'API key is required. Send it via x-api-key header or apiKey query parameter.',
        });
        return;
    }

    if (apiKey !== config.apiKey) {
        console.warn(`⚠️  Invalid API key attempt from ${req.ip}`);
        res.status(403).json({
            error: 'Forbidden',
            message: 'Invalid API key.',
        });
        return;
    }

    next();
};

/**
 * Optional auth middleware - allows requests without API key
 * Useful for public endpoints that may benefit from auth
 */
export const authMiddlewareOptional = (req: Request, res: Response, next: NextFunction): void => {
    // If no API key configured, just continue
    if (!config.apiKey) {
        next();
        return;
    }

    // Try to get API key from header or query
    const apiKeyHeader = req.headers['x-api-key'] as string | undefined;
    const apiKeyQuery = req.query.apiKey as string | undefined;
    const apiKey = apiKeyHeader || apiKeyQuery;

    // If API key provided, validate it
    if (apiKey && apiKey !== config.apiKey) {
        res.status(403).json({
            error: 'Forbidden',
            message: 'Invalid API key.',
        });
        return;
    }

    // Continue with or without valid API key
    next();
};
