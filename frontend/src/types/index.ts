// ============================================
// Conversion Types (must match backend)
// ============================================

export type ConversionType =
    // Audio/Video
    | 'mp4-to-mp3'
    // Image conversions (bidirectional)
    | 'png-to-jpg'
    | 'jpg-to-png'
    | 'png-to-webp'
    | 'jpg-to-webp'
    | 'webp-to-png'
    | 'webp-to-jpg'
    // Legacy (still supported)
    | 'image-to-webp'
    | 'pdf-to-jpg'
    | 'docx-to-pdf';

// ============================================
// YouTube Types
// ============================================

export type YouTubeFormat = 'audio' | 'video-only' | 'video-audio' | 'separate';

export type YouTubeQuality = '360' | '480' | '720' | '1080' | 'best';

// ============================================
// Job Interfaces
// ============================================

export interface ConversionJob {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    originalFileName?: string;
    convertedFileName?: string;
    downloadUrl?: string;
    error?: string;
    inputSize?: number;
    outputSize?: number;
}

export interface ConversionOptions {
    quality?: number; // 1-100 for image quality
    bitrate?: string; // e.g., '192k' for audio
}

export interface YouTubeJob {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    title?: string;
    format?: YouTubeFormat;
    quality?: YouTubeQuality;
    downloadUrl?: string;
    audioDownloadUrl?: string;
    error?: string;
    duration?: string;
    fileSize?: string;
}

export interface YouTubeVideoInfo {
    title: string;
    duration: string;
    thumbnail: string;
    formats?: {
        quality: string;
        format: string;
        size?: string;
    }[];
}

// ============================================
// QR Code Types
// ============================================

export interface QRCodeResult {
    dataUrl: string;
}

export interface QRCodeOptions {
    size?: number;
    darkColor?: string;
    lightColor?: string;
}

// ============================================
// API Types
// ============================================

export interface ApiError {
    error: string;
    message: string;
}

export interface HealthCheck {
    status: 'ok' | 'error';
    timestamp: string;
    version?: string;
}
