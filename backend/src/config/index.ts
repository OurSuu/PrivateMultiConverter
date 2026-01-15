import dotenv from 'dotenv';
dotenv.config();

// Environment validation
const validateEnv = () => {
    const warnings: string[] = [];

    if (!process.env.API_KEY) {
        warnings.push('⚠️  API_KEY not set - running in development mode (no auth required)');
    }

    if (!process.env.CORS_ORIGIN) {
        warnings.push('⚠️  CORS_ORIGIN not set - defaulting to http://localhost:5173');
    }

    if (warnings.length > 0) {
        console.log('\n' + warnings.join('\n') + '\n');
    }
};

validateEnv();

export const config = {
    // Server
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // Authentication
    apiKey: process.env.API_KEY || '',

    // File handling
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10), // 100MB
    tempDir: process.env.TEMP_DIR || './temp',
    cleanupIntervalMinutes: parseInt(process.env.CLEANUP_INTERVAL_MINUTES || '30', 10),

    // CORS
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

    // Rate limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    },

    // Allowed file types for upload
    allowedFileTypes: [
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/gif',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],

    // Conversion settings
    conversion: {
        imageQuality: parseInt(process.env.IMAGE_QUALITY || '85', 10),
        audioBitrate: process.env.AUDIO_BITRATE || '192k',
    },

    // YouTube settings
    youtube: {
        maxDuration: parseInt(process.env.YOUTUBE_MAX_DURATION || '7200', 10), // 2 hours in seconds
        defaultQuality: process.env.YOUTUBE_DEFAULT_QUALITY || 'best',
    },
};

// Helper to check if we're in production
export const isProduction = config.nodeEnv === 'production';

// Version info
export const VERSION = '2.0.0';
