import { Router } from 'express';
import { generateQRCode, generateQRCodeBuffer } from '../services/qrcodeService.js';

const router = Router();

interface GenerateRequest {
    url: string;
    size?: number;
    darkColor?: string;
    lightColor?: string;
}

// Generate QR code as data URL
router.post('/generate', async (req, res) => {
    try {
        const { url, size, darkColor, lightColor } = req.body as GenerateRequest;

        if (!url) {
            res.status(400).json({ error: 'Bad Request', message: 'Content/URL is required' });
            return;
        }

        // Validate content length
        if (url.length > 2000) {
            res.status(400).json({ error: 'Bad Request', message: 'Content too long. Maximum 2000 characters.' });
            return;
        }

        const result = await generateQRCode(url, {
            size,
            darkColor,
            lightColor,
        });

        if (result.success && result.dataUrl) {
            res.json({ dataUrl: result.dataUrl });
        } else {
            res.status(500).json({
                error: 'Internal Server Error',
                message: result.error || 'QR code generation failed'
            });
        }
    } catch (error) {
        console.error('QR code error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Generate and download QR code as PNG file
router.post('/download', async (req, res) => {
    try {
        const { url, size, darkColor, lightColor } = req.body as GenerateRequest;

        if (!url) {
            res.status(400).json({ error: 'Bad Request', message: 'Content/URL is required' });
            return;
        }

        const buffer = await generateQRCodeBuffer(url, {
            size: size || 512,
            darkColor,
            lightColor,
        });

        if (!buffer) {
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to generate QR code'
            });
            return;
        }

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', 'attachment; filename="qrcode.png"');
        res.send(buffer);
    } catch (error) {
        console.error('QR code download error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
