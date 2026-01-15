import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { config, VERSION, isProduction } from './config/index.js';
import { authMiddleware } from './middleware/auth.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { cleanupTempFiles, ensureTempDir } from './utils/cleanup.js';
import convertRoutes from './routes/convert.js';
import youtubeRoutes from './routes/youtube.js';
import qrcodeRoutes from './routes/qrcode.js';

const app = express();

// Ensure temp directory exists
ensureTempDir();

// Security middleware
app.disable('x-powered-by');

// Trust proxy (for rate limiting behind reverse proxy)
if (isProduction) {
    app.set('trust proxy', 1);
}

// CORS configuration
app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging (simple)
app.use((req, _res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Apply rate limiting and auth to API routes
app.use('/api', rateLimiter);
app.use('/api', authMiddleware);

// Routes
app.use('/api/convert', convertRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/qrcode', qrcodeRoutes);

// Health check (no auth required)
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: VERSION,
        uptime: process.uptime(),
    });
});

// Root endpoint
app.get('/', (_req, res) => {
    res.json({
        name: 'Private Multi-Converter API',
        version: VERSION,
        endpoints: {
            health: '/health',
            convert: '/api/convert',
            youtube: '/api/youtube',
            qrcode: '/api/qrcode',
        },
    });
});

// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested endpoint does not exist',
    });
});

// Error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Server error:', err);

    // Don't expose internal errors in production
    const message = isProduction ? 'Internal Server Error' : err.message;

    res.status(500).json({
        error: 'Internal Server Error',
        message,
    });
});

// Schedule cleanup cron job
cron.schedule(`*/${config.cleanupIntervalMinutes} * * * *`, () => {
    console.log(`[${new Date().toISOString()}] Running cleanup job...`);
    cleanupTempFiles();
});

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('\n🛑 Shutting down gracefully...');
    // Run final cleanup
    cleanupTempFiles();
    process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
app.listen(config.port, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Private Multi-Converter Backend v${VERSION}             ║
║                                                           ║
║   Server running on: http://localhost:${config.port}               ║
║   Environment:       ${config.nodeEnv.padEnd(25)}      ║
║   API Key Required:  ${config.apiKey ? 'Yes' : 'No (Dev Mode)'}                             ║
║   Cleanup Interval:  ${config.cleanupIntervalMinutes} minutes                           ║
║   Max File Size:     ${Math.round(config.maxFileSize / (1024 * 1024))}MB                                ║
║                                                           ║
║   Endpoints:                                              ║
║   • POST /api/convert     - File conversion               ║
║   • POST /api/youtube     - YouTube download              ║
║   • POST /api/qrcode      - QR code generation            ║
║   • GET  /health          - Health check                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
