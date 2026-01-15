import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';

const tempDir = path.resolve(config.tempDir);

export type YouTubeFormat = 'audio' | 'video-only' | 'video-audio' | 'separate';

interface YouTubeResult {
    success: boolean;
    outputPath?: string;
    outputFileName?: string;
    audioPath?: string;
    audioFileName?: string;
    title?: string;
    error?: string;
}

interface VideoInfo {
    title: string;
    duration: string;
    thumbnail: string;
}

// Execute yt-dlp command
const execYtDlp = (args: string[]): Promise<{ stdout: string; stderr: string; code: number }> => {
    return new Promise((resolve) => {
        const process = spawn('yt-dlp', args, { shell: true });
        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        process.on('close', (code) => {
            resolve({ stdout, stderr, code: code || 0 });
        });

        process.on('error', (err) => {
            resolve({ stdout: '', stderr: err.message, code: 1 });
        });
    });
};

// Validate YouTube URL
export const isValidYouTubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[\w-]+/;
    return youtubeRegex.test(url);
};

// Get video info using yt-dlp
export const getVideoInfo = async (url: string): Promise<VideoInfo | null> => {
    try {
        const result = await execYtDlp([
            '--dump-json',
            '--no-download',
            url
        ]);

        if (result.code !== 0) {
            console.error('yt-dlp info error:', result.stderr);
            return null;
        }

        const info = JSON.parse(result.stdout);
        return {
            title: info.title || 'Unknown',
            duration: info.duration_string || info.duration?.toString() || 'Unknown',
            thumbnail: info.thumbnail || '',
        };
    } catch (err) {
        console.error('Failed to get video info:', err);
        return null;
    }
};

// Download audio only (MP3)
export const downloadAudio = async (url: string): Promise<YouTubeResult> => {
    const jobId = uuidv4();
    const outputFileName = `${jobId}.mp3`;
    const outputPath = path.join(tempDir, outputFileName);

    try {
        // Get title first
        const info = await getVideoInfo(url);

        const result = await execYtDlp([
            '-x',                           // Extract audio
            '--audio-format', 'mp3',        // Convert to MP3
            '--audio-quality', '0',         // Best quality
            '-o', outputPath,               // Output path
            '--no-playlist',                // Single video only
            '--ffmpeg-location', 'ffmpeg',  // Use ffmpeg from PATH
            url
        ]);

        if (result.code !== 0) {
            const errorMsg = parseYtDlpError(result.stderr);
            return { success: false, error: errorMsg };
        }

        return {
            success: true,
            outputPath,
            outputFileName,
            title: info?.title
        };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Download failed'
        };
    }
};

// Download video only (MP4 no audio)
export const downloadVideoOnly = async (url: string): Promise<YouTubeResult> => {
    const jobId = uuidv4();
    const outputFileName = `${jobId}.mp4`;
    const outputPath = path.join(tempDir, outputFileName);

    try {
        const info = await getVideoInfo(url);

        const result = await execYtDlp([
            '-f', 'bestvideo[ext=mp4]/bestvideo',  // Best video only
            '-o', outputPath,
            '--no-playlist',
            '--ffmpeg-location', 'ffmpeg',
            url
        ]);

        if (result.code !== 0) {
            const errorMsg = parseYtDlpError(result.stderr);
            return { success: false, error: errorMsg };
        }

        return {
            success: true,
            outputPath,
            outputFileName,
            title: info?.title
        };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Download failed'
        };
    }
};

// Download video + audio merged (MP4)
export const downloadVideoAudio = async (url: string): Promise<YouTubeResult> => {
    const jobId = uuidv4();
    const outputFileName = `${jobId}.mp4`;
    const outputPath = path.join(tempDir, outputFileName);

    try {
        const info = await getVideoInfo(url);

        const result = await execYtDlp([
            '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',  // Best video+audio
            '--merge-output-format', 'mp4',  // Merge to MP4
            '-o', outputPath,
            '--no-playlist',
            '--ffmpeg-location', 'ffmpeg',
            url
        ]);

        if (result.code !== 0) {
            const errorMsg = parseYtDlpError(result.stderr);
            return { success: false, error: errorMsg };
        }

        return {
            success: true,
            outputPath,
            outputFileName,
            title: info?.title
        };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Download failed'
        };
    }
};

// Download separate video & audio files
export const downloadSeparate = async (url: string): Promise<YouTubeResult> => {
    const jobId = uuidv4();
    const videoFileName = `${jobId}_video.mp4`;
    const audioFileName = `${jobId}_audio.mp3`;
    const videoPath = path.join(tempDir, videoFileName);
    const audioPath = path.join(tempDir, audioFileName);

    try {
        const info = await getVideoInfo(url);

        // Download video only
        const videoResult = await execYtDlp([
            '-f', 'bestvideo[ext=mp4]/bestvideo',
            '-o', videoPath,
            '--no-playlist',
            '--ffmpeg-location', 'ffmpeg',
            url
        ]);

        if (videoResult.code !== 0) {
            const errorMsg = parseYtDlpError(videoResult.stderr);
            return { success: false, error: `Video download failed: ${errorMsg}` };
        }

        // Download audio only
        const audioResult = await execYtDlp([
            '-x',
            '--audio-format', 'mp3',
            '--audio-quality', '0',
            '-o', audioPath,
            '--no-playlist',
            '--ffmpeg-location', 'ffmpeg',
            url
        ]);

        if (audioResult.code !== 0) {
            // Clean up video file if audio fails
            if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
            const errorMsg = parseYtDlpError(audioResult.stderr);
            return { success: false, error: `Audio download failed: ${errorMsg}` };
        }

        return {
            success: true,
            outputPath: videoPath,
            outputFileName: videoFileName,
            audioPath,
            audioFileName,
            title: info?.title
        };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Download failed'
        };
    }
};

// Parse yt-dlp errors to user-friendly messages
const parseYtDlpError = (stderr: string): string => {
    const lowerErr = stderr.toLowerCase();

    if (lowerErr.includes('video unavailable') || lowerErr.includes('private video')) {
        return 'Video is unavailable or private';
    }
    if (lowerErr.includes('age-restricted') || lowerErr.includes('sign in')) {
        return 'Video is age-restricted and requires sign-in';
    }
    if (lowerErr.includes('copyright') || lowerErr.includes('blocked')) {
        return 'Video is blocked due to copyright';
    }
    if (lowerErr.includes('does not exist') || lowerErr.includes('removed')) {
        return 'Video does not exist or has been removed';
    }
    if (lowerErr.includes('live event') || lowerErr.includes('premiere')) {
        return 'Cannot download live events or premieres';
    }
    if (lowerErr.includes('yt-dlp') && lowerErr.includes('not found')) {
        return 'yt-dlp is not installed. Please install it: https://github.com/yt-dlp/yt-dlp';
    }
    if (lowerErr.includes('ffmpeg') && lowerErr.includes('not found')) {
        return 'FFmpeg is not installed or not in PATH';
    }
    if (lowerErr.includes('unable to extract') || lowerErr.includes('extractor error')) {
        return 'YouTube extractor error - yt-dlp may need updating. Run: yt-dlp -U';
    }

    // Return first line of error or generic message
    const firstLine = stderr.split('\n').find(line => line.trim().length > 0);
    return firstLine || 'Download failed - unknown error';
};

// Main download dispatcher
export const downloadYouTube = async (
    url: string,
    format: YouTubeFormat
): Promise<YouTubeResult> => {
    // Validate URL
    if (!isValidYouTubeUrl(url)) {
        return { success: false, error: 'Invalid YouTube URL' };
    }

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    switch (format) {
        case 'audio':
            return downloadAudio(url);
        case 'video-only':
            return downloadVideoOnly(url);
        case 'video-audio':
            return downloadVideoAudio(url);
        case 'separate':
            return downloadSeparate(url);
        default:
            return { success: false, error: 'Unknown format' };
    }
};
