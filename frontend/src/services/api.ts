import axios, { AxiosError, AxiosResponse } from 'axios';
import type { ConversionType, YouTubeFormat, ConversionJob, YouTubeJob, YouTubeVideoInfo, QRCodeResult } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';
const API_KEY = import.meta.env.VITE_API_KEY || '';

// Create axios instance with defaults
const api = axios.create({
    baseURL: API_URL,
    timeout: 120000, // 2 minute timeout for large files
    headers: {
        'x-api-key': API_KEY,
    },
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError<{ message?: string; error?: string }>) => {
        if (error.response) {
            // Server responded with an error
            const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
            const status = error.response.status;

            if (status === 401) {
                throw new Error('Authentication failed. Please check your API key.');
            } else if (status === 403) {
                throw new Error('Access denied. Invalid API key.');
            } else if (status === 429) {
                throw new Error('Too many requests. Please wait a moment and try again.');
            } else if (status === 413) {
                throw new Error('File too large. Maximum size is 100MB.');
            } else if (status >= 500) {
                throw new Error('Server error. Please try again later.');
            }
            throw new Error(message);
        } else if (error.request) {
            // No response received
            if (error.code === 'ECONNABORTED') {
                throw new Error('Request timed out. Please try again.');
            }
            throw new Error('Network error. Please check your connection.');
        }
        throw new Error('An unexpected error occurred.');
    }
);

// Retry logic for transient failures
const retryRequest = async <T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
): Promise<T> => {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0 && error instanceof Error && error.message.includes('Network error')) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryRequest(fn, retries - 1, delay * 2);
        }
        throw error;
    }
};

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

export const generateQRCode = async (
    url: string,
    options?: { size?: number; darkColor?: string; lightColor?: string }
): Promise<QRCodeResult> => {
    const response = await api.post<QRCodeResult>('/api/qrcode/generate', {
        url,
        ...options
    });
    return response.data;
};

export const getDownloadUrl = (path: string): string => {
    const headers = API_KEY ? `?apiKey=${encodeURIComponent(API_KEY)}` : '';
    return `${API_URL}${path}${headers}`;
};

// Health check
export const checkHealth = async (): Promise<boolean> => {
    try {
        const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
        return response.status === 200;
    } catch {
        return false;
    }
};
