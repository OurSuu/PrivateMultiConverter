import { Router } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { downloadYouTube, getVideoInfo, isValidYouTubeUrl, type YouTubeFormat } from '../services/youtubeService.js';
import { config } from '../config/index.js';

const router = Router();
const tempDir = path.resolve(config.tempDir);

// Store job statuses in memory
const jobs = new Map<string, {
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    title?: string;
    format?: YouTubeFormat;
    downloadUrl?: string;
    audioDownloadUrl?: string;
    error?: string;
    outputPath?: string;
    audioPath?: string;
}>();

// Get video info (for preview)
router.post('/info', async (req, res) => {
    try {
        const { url } = req.body as { url: string };

        if (!url) {
            res.status(400).json({ error: 'Bad Request', message: 'YouTube URL is required' });
            return;
        }

        if (!isValidYouTubeUrl(url)) {
            res.status(400).json({ error: 'Bad Request', message: 'Invalid YouTube URL' });
            return;
        }

        const info = await getVideoInfo(url);

        if (!info) {
            res.status(404).json({ error: 'Not Found', message: 'Could not retrieve video info' });
            return;
        }

        res.json(info);
    } catch (error) {
        console.error('YouTube info error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Start YouTube download
router.post('/download', async (req, res) => {
    try {
        const { url, format } = req.body as { url: string; format: YouTubeFormat };

        if (!url) {
            res.status(400).json({ error: 'Bad Request', message: 'YouTube URL is required' });
            return;
        }

        const validFormats: YouTubeFormat[] = ['audio', 'video-only', 'video-audio', 'separate'];
        if (!format || !validFormats.includes(format)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Format must be one of: audio, video-only, video-audio, separate'
            });
            return;
        }

        if (!isValidYouTubeUrl(url)) {
            res.status(400).json({ error: 'Bad Request', message: 'Invalid YouTube URL' });
            return;
        }

        const jobId = uuidv4();

        // Get video info first
        const info = await getVideoInfo(url);

        // Initialize job
        jobs.set(jobId, {
            status: 'processing',
            progress: 10,
            title: info?.title,
            format,
        });

        // Start download in background
        (async () => {
            // Update progress
            jobs.set(jobId, { ...jobs.get(jobId)!, progress: 30 });

            const result = await downloadYouTube(url, format);

            if (result.success && result.outputPath && result.outputFileName) {
                const jobData: typeof jobs extends Map<string, infer V> ? V : never = {
                    ...jobs.get(jobId)!,
                    status: 'completed',
                    progress: 100,
                    title: result.title,
                    downloadUrl: `/api/youtube/file/${result.outputFileName}`,
                    outputPath: result.outputPath,
                };

                // For separate format, include audio download URL
                if (format === 'separate' && result.audioPath && result.audioFileName) {
                    jobData.audioDownloadUrl = `/api/youtube/file/${result.audioFileName}`;
                    jobData.audioPath = result.audioPath;
                }

                jobs.set(jobId, jobData);
            } else {
                jobs.set(jobId, {
                    ...jobs.get(jobId)!,
                    status: 'error',
                    error: result.error || 'Download failed',
                });
            }
        })();

        res.json({
            id: jobId,
            status: 'processing',
            progress: 10,
            title: info?.title,
            format,
        });
    } catch (error) {
        console.error('YouTube download error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get job status
router.get('/status/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
        res.status(404).json({ error: 'Not Found', message: 'Job not found' });
        return;
    }

    res.json({
        id: jobId,
        status: job.status,
        progress: job.progress,
        title: job.title,
        format: job.format,
        downloadUrl: job.downloadUrl,
        audioDownloadUrl: job.audioDownloadUrl,
        error: job.error,
    });
});

// Download file
router.get('/file/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(tempDir, filename);

    res.download(filePath, (err) => {
        if (err && !res.headersSent) {
            res.status(404).json({ error: 'Not Found', message: 'File not found' });
        }
    });
});

export default router;
