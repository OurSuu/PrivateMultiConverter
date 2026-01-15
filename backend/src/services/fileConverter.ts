import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';

const tempDir = path.resolve(config.tempDir);

export type ConversionType = 'mp4-to-mp3' | 'image-to-webp' | 'pdf-to-jpg' | 'docx-to-pdf';

interface ConversionResult {
    success: boolean;
    outputPath?: string;
    outputFileName?: string;
    error?: string;
}

// MP4 to MP3 conversion using ffmpeg
export const convertMp4ToMp3 = (inputPath: string): Promise<ConversionResult> => {
    return new Promise((resolve) => {
        const outputFileName = `${uuidv4()}.mp3`;
        const outputPath = path.join(tempDir, outputFileName);

        ffmpeg(inputPath)
            .toFormat('mp3')
            .audioBitrate('192k')
            .on('end', () => {
                resolve({ success: true, outputPath, outputFileName });
            })
            .on('error', (err) => {
                resolve({ success: false, error: err.message });
            })
            .save(outputPath);
    });
};

// Image to WebP conversion using sharp
export const convertImageToWebp = async (inputPath: string): Promise<ConversionResult> => {
    try {
        const outputFileName = `${uuidv4()}.webp`;
        const outputPath = path.join(tempDir, outputFileName);

        await sharp(inputPath)
            .webp({ quality: 85 })
            .toFile(outputPath);

        return { success: true, outputPath, outputFileName };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Conversion failed' };
    }
};

// PDF to JPG conversion - simplified approach using sharp for first page
export const convertPdfToJpg = async (inputPath: string): Promise<ConversionResult> => {
    try {
        // Note: For full PDF to JPG conversion, you would need pdf-poppler or similar
        // This is a simplified version that works with single-page PDF images
        const outputFileName = `${uuidv4()}.jpg`;
        const outputPath = path.join(tempDir, outputFileName);

        // Try using sharp's PDF support (requires libvips with poppler)
        await sharp(inputPath, { density: 150 })
            .jpeg({ quality: 90 })
            .toFile(outputPath);

        return { success: true, outputPath, outputFileName };
    } catch (err) {
        return {
            success: false,
            error: 'PDF to JPG conversion requires libvips with poppler support. ' +
                (err instanceof Error ? err.message : 'Conversion failed')
        };
    }
};

// DOCX to PDF conversion - requires libreoffice
export const convertDocxToPdf = async (inputPath: string): Promise<ConversionResult> => {
    try {
        const outputFileName = `${uuidv4()}.pdf`;
        const outputPath = path.join(tempDir, outputFileName);

        // For Windows, we can use libreoffice command line
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        // Try using libreoffice
        await execAsync(
            `soffice --headless --convert-to pdf --outdir "${tempDir}" "${inputPath}"`
        );

        // LibreOffice outputs with the same name but .pdf extension
        const baseName = path.basename(inputPath, path.extname(inputPath));
        const libreOutputPath = path.join(tempDir, `${baseName}.pdf`);

        if (fs.existsSync(libreOutputPath)) {
            // Rename to our UUID-based filename
            fs.renameSync(libreOutputPath, outputPath);
            return { success: true, outputPath, outputFileName };
        }

        return { success: false, error: 'LibreOffice conversion failed - output file not found' };
    } catch (err) {
        return {
            success: false,
            error: 'DOCX to PDF conversion requires LibreOffice. ' +
                (err instanceof Error ? err.message : 'Conversion failed')
        };
    }
};

// Main conversion dispatcher
export const convertFile = async (
    inputPath: string,
    conversionType: ConversionType
): Promise<ConversionResult> => {
    switch (conversionType) {
        case 'mp4-to-mp3':
            return convertMp4ToMp3(inputPath);
        case 'image-to-webp':
            return convertImageToWebp(inputPath);
        case 'pdf-to-jpg':
            return convertPdfToJpg(inputPath);
        case 'docx-to-pdf':
            return convertDocxToPdf(inputPath);
        default:
            return { success: false, error: 'Unknown conversion type' };
    }
};
