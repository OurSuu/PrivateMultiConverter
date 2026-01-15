export type ConversionType =
    | 'mp4-to-mp3'
    | 'image-to-webp'
    | 'pdf-to-jpg'
    | 'docx-to-pdf';

export type YouTubeFormat = 'audio' | 'video-only' | 'video-audio' | 'separate';

export type YouTubeQuality = '360' | '480' | '720' | '1080' | 'best';

export interface ConversionJob {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    originalFileName?: string;
    convertedFileName?: string;
    downloadUrl?: string;
    error?: string;
    // New fields for enhanced feedback
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
    // New fields
    duration?: string;
    fileSize?: string;
}

export interface YouTubeVideoInfo {
    title: string;
    duration: string;
    thumbnail: string;
    // New fields
    formats?: {
        quality: string;
        format: string;
        size?: string;
    }[];
}

export interface QRCodeResult {
    dataUrl: string;
}

export interface QRCodeOptions {
    size?: number;
    darkColor?: string;
    lightColor?: string;
}

export interface ApiError {
    error: string;
    message: string;
}

// Health check response
export interface HealthCheck {
    status: 'ok' | 'error';
    timestamp: string;
    version?: string;
}
