/**
 * Backend Entry Point
 * 
 * This is the main entry file for the Private Multi-Converter backend.
 * It sets up Express with all middleware, routes, and scheduled jobs.
 */

import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { config, VERSION, isProduction } from './config/index.js';
import { authMiddleware, authMiddlewareOptional } from './middleware/auth.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { cleanupTempFiles, ensureTempDir } from './utils/cleanup.js';
import convertRoutes from './routes/convert.js';
import youtubeRoutes from './routes/youtube.js';
import qrcodeRoutes from './routes/qrcode.js';

const app = express();

// ============================================
// Startup: Ensure temp directory exists
// ============================================
ensureTempDir();

// ============================================
// Security Middleware
// ============================================
app.disable('x-powered-by');

// Trust proxy when behind reverse proxy (for accurate rate limiting)
if (isProduction) {
    app.set('trust proxy', 1);
}

// ============================================
// CORS Configuration
// Supports single origin or array of origins
// ============================================
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like curl, Postman, or same-origin)
        if (!origin) {
            callback(null, true);
            return;
        }

        const allowedOrigins = Array.isArray(config.corsOrigin)
            ? config.corsOrigin
            : [config.corsOrigin];

        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            console.warn(`⚠️  CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization'],
}));

// ============================================
// Body Parsing
// ============================================
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ============================================
// Request Logging
// ============================================
app.use((req, _res, next) => {
    const timestamp = new Date().toISOString();
    const apiKey = req.headers['x-api-key'] ? '✓' : '✗';
    console.log(`[${timestamp}] ${req.method} ${req.path} [API Key: ${apiKey}]`);
    next();
});

// ============================================
// Health Check (NO auth required)
// ============================================
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: VERSION,
        uptime: Math.floor(process.uptime()),
        environment: config.nodeEnv,
    });
});

// ============================================
// Root Endpoint (NO auth required)
// ============================================
app.get('/', (_req, res) => {
    res.json({
        name: 'Private Multi-Converter API',
        version: VERSION,
        status: 'running',
        endpoints: {
            health: 'GET /health',
            convert: 'POST /api/convert',
            youtube: 'POST /api/youtube/download',
            qrcode: 'POST /api/qrcode/generate',
        },
        documentation: 'https://github.com/OurSuu/PrivateMultiConverter',
    });
});

// ============================================
// API Routes (with rate limiting and auth)
// ============================================
app.use('/api', rateLimiter);
app.use('/api', authMiddleware);

// Route handlers
app.use('/api/convert', convertRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/qrcode', qrcodeRoutes);

// ============================================
// 404 Handler
// ============================================
app.use((_req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested endpoint does not exist. Check /health for API status.',
    });
});

// ============================================
// Global Error Handler
// ============================================
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('❌ Server error:', err.message);

    // Handle CORS errors specifically
    if (err.message === 'Not allowed by CORS') {
        res.status(403).json({
            error: 'CORS Error',
            message: 'Origin not allowed. Contact administrator.',
        });
        return;
    }

    // Don't expose internal error details in production
    const message = isProduction ? 'Internal Server Error' : err.message;

    res.status(500).json({
        error: 'Internal Server Error',
        message,
    });
});

// ============================================
// Scheduled Cleanup Job
// ============================================
cron.schedule(`*/${config.cleanupIntervalMinutes} * * * *`, () => {
    console.log(`[${new Date().toISOString()}] 🧹 Running scheduled cleanup...`);
    cleanupTempFiles();
});

// ============================================
// Graceful Shutdown Handler
// ============================================
const gracefulShutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    cleanupTempFiles();
    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// Start Server
// ============================================
const server = app.listen(config.port, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 Private Multi-Converter Backend v${VERSION}                 ║
║                                                               ║
║   Server:          http://localhost:${config.port}                     ║
║   Environment:     ${config.nodeEnv.padEnd(29)}       ║
║   API Key:         ${config.apiKey ? 'Required ✓' : 'Not Required (Dev Mode)'}               ║
║   Cleanup:         Every ${config.cleanupIntervalMinutes} minutes                         ║
║   Max Upload:      ${Math.round(config.maxFileSize / (1024 * 1024))}MB                                       ║
║                                                               ║
║   Endpoints:                                                  ║
║   ├─ GET  /health              Health check                   ║
║   ├─ POST /api/convert         File conversion                ║
║   ├─ POST /api/youtube/info    Video info                     ║
║   ├─ POST /api/youtube/download YouTube download              ║
║   └─ POST /api/qrcode/generate QR code generation             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);
});

// Handle server errors
server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${config.port} is already in use. Try a different port.`);
        process.exit(1);
    }
    throw error;
});

export default app;
