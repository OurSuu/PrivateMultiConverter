/**
 * Frontend API Service
 * 
 * Handles all communication with the backend API.
 * Supports both local development and production environments.
 * 
 * Environment Variables:
 * - VITE_API_BASE_URL: Backend URL (e.g., http://localhost:3001)
 * - VITE_API_KEY: API key for authentication
 */

import axios, { AxiosError, AxiosResponse } from 'axios';
import type {
    ConversionType,
    YouTubeFormat,
    ConversionJob,
    YouTubeJob,
    YouTubeVideoInfo,
    QRCodeResult
} from '../types';

// ============================================
// Environment Configuration
// ============================================

// Support both VITE_API_URL and VITE_API_BASE_URL for compatibility
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
const API_KEY = import.meta.env.VITE_API_KEY || '';

// Log configuration in development
if (import.meta.env.DEV) {
    console.log('🔌 API Configuration:');
    console.log(`   Base URL: ${API_BASE_URL || '(empty - using relative URLs)'}`);
    console.log(`   API Key: ${API_KEY ? '✓ Configured' : '✗ Not Set'}`);
}

// ============================================
// Axios Instance
// ============================================

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 300000, // 5 minute timeout for large files/long downloads
    headers: {
        'x-api-key': API_KEY,
    },
});

// ============================================
// Response Interceptor for Error Handling
// ============================================

api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError<{ message?: string; error?: string }>) => {
        // Log error in development
        if (import.meta.env.DEV) {
            console.error('API Error:', error.response?.data || error.message);
        }

        if (error.response) {
            // Server responded with an error
            const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
            const status = error.response.status;

            switch (status) {
                case 401:
                    throw new Error('Authentication failed. Please check your API key configuration.');
                case 403:
                    throw new Error('Access denied. Invalid API key.');
                case 404:
                    throw new Error('Endpoint not found. Please check if the backend is running.');
                case 429:
                    throw new Error('Too many requests. Please wait a moment and try again.');
                case 413:
                    throw new Error('File too large. Maximum size is 100MB.');
                case 500:
                case 502:
                case 503:
                    throw new Error('Server error. Please try again later.');
                default:
                    throw new Error(message);
            }
        } else if (error.request) {
            // No response received
            if (error.code === 'ECONNABORTED') {
                throw new Error('Request timed out. The operation is taking too long.');
            }
            if (error.code === 'ERR_NETWORK') {
                throw new Error('Cannot connect to server. Please ensure the backend is running.');
            }
            throw new Error('Network error. Please check your internet connection.');
        }
        throw new Error('An unexpected error occurred.');
    }
);

// ============================================
// Retry Logic for Transient Failures
// ============================================

const retryRequest = async <T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
): Promise<T> => {
    try {
        return await fn();
    } catch (error) {
        const isRetryable = error instanceof Error && (
            error.message.includes('Network error') ||
            error.message.includes('Cannot connect') ||
            error.message.includes('timed out')
        );

        if (retries > 0 && isRetryable) {
            console.log(`Retrying request... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryRequest(fn, retries - 1, delay * 2);
        }
        throw error;
    }
};

// ============================================
// File Conversion API
// ============================================

export const convertFile = async (
    file: File,
    conversionType: ConversionType,
    onProgress?: (progress: number) => void
): Promise<ConversionJob> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', conversionType);

    const response = await api.post<ConversionJob>('/api/convert', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
                // Upload is 0-50%, processing is 50-100%
                const progress = Math.round((progressEvent.loaded * 50) / progressEvent.total);
                onProgress(progress);
            }
        },
    });

    return response.data;
};

export const pollConversionStatus = async (jobId: string): Promise<ConversionJob> => {
    return retryRequest(async () => {
        const response = await api.get<ConversionJob>(`/api/convert/status/${jobId}`);
        return response.data;
    });
};

// ============================================
// YouTube API
// ============================================

export const getYouTubeInfo = async (url: string): Promise<YouTubeVideoInfo> => {
    const response = await api.post<YouTubeVideoInfo>('/api/youtube/info', { url });
    return response.data;
};

export const downloadYouTube = async (
    url: string,
    format: YouTubeFormat,
    quality?: string
): Promise<YouTubeJob> => {
    const response = await api.post<YouTubeJob>('/api/youtube/download', {
        url,
        format,
        quality,
    });
    return response.data;
};

export const pollYouTubeStatus = async (jobId: string): Promise<YouTubeJob> => {
    return retryRequest(async () => {
        const response = await api.get<YouTubeJob>(`/api/youtube/status/${jobId}`);
        return response.data;
    });
};

// ============================================
// QR Code API
// ============================================

export const generateQRCode = async (
    content: string,
    options?: { size?: number; darkColor?: string; lightColor?: string }
): Promise<QRCodeResult> => {
    const response = await api.post<QRCodeResult>('/api/qrcode/generate', {
        url: content,
        ...options
    });
    return response.data;
};

// ============================================
// Download URL Helper
// ============================================

/**
 * Constructs a download URL with API key authentication.
 * The API key is passed as a query parameter for direct browser downloads.
 */
export const getDownloadUrl = (path: string): string => {
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // Build full URL
    const baseUrl = API_BASE_URL || window.location.origin;
    const url = new URL(normalizedPath, baseUrl);

    // Add API key as query parameter for authenticated downloads
    if (API_KEY) {
        url.searchParams.set('apiKey', API_KEY);
    }

    return url.toString();
};

// ============================================
// Health Check
// ============================================

/**
 * Checks if the backend server is reachable and healthy.
 */
export const checkHealth = async (): Promise<boolean> => {
    try {
        const baseUrl = API_BASE_URL || window.location.origin;
        const response = await axios.get(`${baseUrl}/health`, {
            timeout: 5000,
            // Don't use the api instance to avoid auth requirement
        });
        return response.status === 200 && response.data?.status === 'ok';
    } catch (error) {
        if (import.meta.env.DEV) {
            console.warn('Health check failed:', error instanceof Error ? error.message : 'Unknown error');
        }
        return false;
    }
};

/**
 * Gets detailed health information from the backend.
 */
export const getHealthInfo = async (): Promise<{
    status: string;
    version: string;
    uptime: number;
} | null> => {
    try {
        const baseUrl = API_BASE_URL || window.location.origin;
        const response = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
        return response.data;
    } catch {
        return null;
    }
};
