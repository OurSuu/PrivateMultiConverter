/**
 * File Converter Service
 * 
 * Handles file conversions using ffmpeg (audio/video) and sharp (images).
 * Supports bidirectional conversions where logically possible.
 */

import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';

const tempDir = path.resolve(config.tempDir);

// ============================================
// Supported Conversion Types
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
    // Legacy types (keeping for backwards compatibility)
    | 'image-to-webp'
    | 'pdf-to-jpg'
    | 'docx-to-pdf';

interface ConversionResult {
    success: boolean;
    outputPath?: string;
    outputFileName?: string;
    error?: string;
}

// ============================================
// Audio/Video Conversions (using ffmpeg)
// ============================================

/**
 * MP4 to MP3 - Extract audio from video
 */
export const convertMp4ToMp3 = (inputPath: string): Promise<ConversionResult> => {
    return new Promise((resolve) => {
        const outputFileName = `${uuidv4()}.mp3`;
        const outputPath = path.join(tempDir, outputFileName);

        ffmpeg(inputPath)
            .toFormat('mp3')
            .audioBitrate(config.conversion.audioBitrate)
            .on('end', () => {
                resolve({ success: true, outputPath, outputFileName });
            })
            .on('error', (err) => {
                console.error('FFmpeg error:', err.message);
                resolve({ success: false, error: `Audio extraction failed: ${err.message}` });
            })
            .save(outputPath);
    });
};

// ============================================
// Image Conversions (using sharp)
// ============================================

/**
 * PNG to JPG
 */
export const convertPngToJpg = async (inputPath: string): Promise<ConversionResult> => {
    try {
        const outputFileName = `${uuidv4()}.jpg`;
        const outputPath = path.join(tempDir, outputFileName);

        await sharp(inputPath)
            .flatten({ background: { r: 255, g: 255, b: 255 } }) // White background for transparency
            .jpeg({ quality: config.conversion.imageQuality })
            .toFile(outputPath);

        return { success: true, outputPath, outputFileName };
    } catch (err) {
        return { success: false, error: `PNG to JPG failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
    }
};

/**
 * JPG to PNG
 */
export const convertJpgToPng = async (inputPath: string): Promise<ConversionResult> => {
    try {
        const outputFileName = `${uuidv4()}.png`;
        const outputPath = path.join(tempDir, outputFileName);

        await sharp(inputPath)
            .png({ compressionLevel: 6 })
            .toFile(outputPath);

        return { success: true, outputPath, outputFileName };
    } catch (err) {
        return { success: false, error: `JPG to PNG failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
    }
};

/**
 * PNG to WebP
 */
export const convertPngToWebp = async (inputPath: string): Promise<ConversionResult> => {
    try {
        const outputFileName = `${uuidv4()}.webp`;
        const outputPath = path.join(tempDir, outputFileName);

        await sharp(inputPath)
            .webp({ quality: config.conversion.imageQuality })
            .toFile(outputPath);

        return { success: true, outputPath, outputFileName };
    } catch (err) {
        return { success: false, error: `PNG to WebP failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
    }
};

/**
 * JPG to WebP
 */
export const convertJpgToWebp = async (inputPath: string): Promise<ConversionResult> => {
    try {
        const outputFileName = `${uuidv4()}.webp`;
        const outputPath = path.join(tempDir, outputFileName);

        await sharp(inputPath)
            .webp({ quality: config.conversion.imageQuality })
            .toFile(outputPath);

        return { success: true, outputPath, outputFileName };
    } catch (err) {
        return { success: false, error: `JPG to WebP failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
    }
};

/**
 * WebP to PNG
 */
export const convertWebpToPng = async (inputPath: string): Promise<ConversionResult> => {
    try {
        const outputFileName = `${uuidv4()}.png`;
        const outputPath = path.join(tempDir, outputFileName);

        await sharp(inputPath)
            .png({ compressionLevel: 6 })
            .toFile(outputPath);

        return { success: true, outputPath, outputFileName };
    } catch (err) {
        return { success: false, error: `WebP to PNG failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
    }
};

/**
 * WebP to JPG
 */
export const convertWebpToJpg = async (inputPath: string): Promise<ConversionResult> => {
    try {
        const outputFileName = `${uuidv4()}.jpg`;
        const outputPath = path.join(tempDir, outputFileName);

        await sharp(inputPath)
            .flatten({ background: { r: 255, g: 255, b: 255 } })
            .jpeg({ quality: config.conversion.imageQuality })
            .toFile(outputPath);

        return { success: true, outputPath, outputFileName };
    } catch (err) {
        return { success: false, error: `WebP to JPG failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
    }
};

/**
 * Generic Image to WebP (legacy - accepts any image format)
 */
export const convertImageToWebp = async (inputPath: string): Promise<ConversionResult> => {
    try {
        const outputFileName = `${uuidv4()}.webp`;
        const outputPath = path.join(tempDir, outputFileName);

        await sharp(inputPath)
            .webp({ quality: config.conversion.imageQuality })
            .toFile(outputPath);

        return { success: true, outputPath, outputFileName };
    } catch (err) {
        return { success: false, error: `Image to WebP failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
    }
};

// ============================================
// Document Conversions
// ============================================

/**
 * PDF to JPG - Requires libvips with poppler
 */
export const convertPdfToJpg = async (inputPath: string): Promise<ConversionResult> => {
    try {
        const outputFileName = `${uuidv4()}.jpg`;
        const outputPath = path.join(tempDir, outputFileName);

        await sharp(inputPath, { density: 150 })
            .jpeg({ quality: 90 })
            .toFile(outputPath);

        return { success: true, outputPath, outputFileName };
    } catch (err) {
        return {
            success: false,
            error: 'PDF to JPG requires libvips with poppler support. ' +
                (err instanceof Error ? err.message : 'Conversion failed')
        };
    }
};

/**
 * DOCX to PDF - Requires LibreOffice
 */
export const convertDocxToPdf = async (inputPath: string): Promise<ConversionResult> => {
    try {
        const outputFileName = `${uuidv4()}.pdf`;
        const outputPath = path.join(tempDir, outputFileName);

        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        await execAsync(
            `soffice --headless --convert-to pdf --outdir "${tempDir}" "${inputPath}"`
        );

        const baseName = path.basename(inputPath, path.extname(inputPath));
        const libreOutputPath = path.join(tempDir, `${baseName}.pdf`);

        if (fs.existsSync(libreOutputPath)) {
            fs.renameSync(libreOutputPath, outputPath);
            return { success: true, outputPath, outputFileName };
        }

        return { success: false, error: 'LibreOffice conversion failed - output file not found' };
    } catch (err) {
        return {
            success: false,
            error: 'DOCX to PDF requires LibreOffice. ' +
                (err instanceof Error ? err.message : 'Conversion failed')
        };
    }
};

// ============================================
// Main Conversion Dispatcher
// ============================================

export const convertFile = async (
    inputPath: string,
    conversionType: ConversionType
): Promise<ConversionResult> => {
    console.log(`[Converter] Starting ${conversionType} conversion`);

    switch (conversionType) {
        // Audio/Video
        case 'mp4-to-mp3':
            return convertMp4ToMp3(inputPath);

        // Image conversions - PNG
        case 'png-to-jpg':
            return convertPngToJpg(inputPath);
        case 'png-to-webp':
            return convertPngToWebp(inputPath);

        // Image conversions - JPG
        case 'jpg-to-png':
            return convertJpgToPng(inputPath);
        case 'jpg-to-webp':
            return convertJpgToWebp(inputPath);

        // Image conversions - WebP
        case 'webp-to-png':
            return convertWebpToPng(inputPath);
        case 'webp-to-jpg':
            return convertWebpToJpg(inputPath);

        // Legacy/generic
        case 'image-to-webp':
            return convertImageToWebp(inputPath);

        // Document conversions
        case 'pdf-to-jpg':
            return convertPdfToJpg(inputPath);
        case 'docx-to-pdf':
            return convertDocxToPdf(inputPath);

        default:
            return {
                success: false,
                error: `Unsupported conversion type: ${conversionType}. Supported types: mp4-to-mp3, png-to-jpg, jpg-to-png, png-to-webp, jpg-to-webp, webp-to-png, webp-to-jpg, pdf-to-jpg, docx-to-pdf`
            };
    }
};

// ============================================
// Validation Helper
// ============================================

export const isValidConversionType = (type: string): type is ConversionType => {
    const validTypes: ConversionType[] = [
        'mp4-to-mp3',
        'png-to-jpg', 'jpg-to-png',
        'png-to-webp', 'jpg-to-webp',
        'webp-to-png', 'webp-to-jpg',
        'image-to-webp',
        'pdf-to-jpg', 'docx-to-pdf'
    ];
    return validTypes.includes(type as ConversionType);
};
