import { Router } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { upload } from '../middleware/upload.js';
import { convertFile, type ConversionType } from '../services/fileConverter.js';
import { deleteFile } from '../utils/cleanup.js';
import { config } from '../config/index.js';

const router = Router();
const tempDir = path.resolve(config.tempDir);

// Store job statuses in memory (use Redis for production)
const jobs = new Map<string, {
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    originalFileName?: string;
    convertedFileName?: string;
    downloadUrl?: string;
    error?: string;
    inputPath?: string;
    outputPath?: string;
}>();

// Start conversion
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'Bad Request', message: 'No file uploaded' });
            return;
        }

        const conversionType = req.body.type as ConversionType;
        if (!conversionType) {
            deleteFile(req.file.path);
            res.status(400).json({ error: 'Bad Request', message: 'Conversion type is required' });
            return;
        }

        const jobId = uuidv4();
        const inputPath = req.file.path;

        // Initialize job
        jobs.set(jobId, {
            status: 'processing',
            progress: 50,
            originalFileName: req.file.originalname,
            inputPath,
        });

        // Start conversion in background
        (async () => {
            const result = await convertFile(inputPath, conversionType);

            if (result.success && result.outputPath && result.outputFileName) {
                jobs.set(jobId, {
                    ...jobs.get(jobId)!,
                    status: 'completed',
                    progress: 100,
                    convertedFileName: result.outputFileName,
                    downloadUrl: `/api/convert/download/${result.outputFileName}`,
                    outputPath: result.outputPath,
                });
            } else {
                jobs.set(jobId, {
                    ...jobs.get(jobId)!,
                    status: 'error',
                    error: result.error || 'Conversion failed',
                });
            }

            // Delete input file after conversion
            deleteFile(inputPath);
        })();

        res.json({
            id: jobId,
            status: 'processing',
            progress: 50,
            originalFileName: req.file.originalname,
        });
    } catch (error) {
        console.error('Conversion error:', error);
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
        originalFileName: job.originalFileName,
        convertedFileName: job.convertedFileName,
        downloadUrl: job.downloadUrl,
        error: job.error,
    });
});

// Download converted file
router.get('/download/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(tempDir, filename);

    res.download(filePath, (err) => {
        if (err && !res.headersSent) {
            res.status(404).json({ error: 'Not Found', message: 'File not found' });
        }
    });
});

export default router;
