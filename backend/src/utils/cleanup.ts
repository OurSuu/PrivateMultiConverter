import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';

const tempDir = path.resolve(config.tempDir);

/**
 * Clean up old temporary files
 */
export const cleanupTempFiles = async (): Promise<void> => {
    if (!fs.existsSync(tempDir)) {
        return;
    }

    try {
        const files = fs.readdirSync(tempDir);
        const now = Date.now();
        const maxAge = config.cleanupIntervalMinutes * 60 * 1000;
        let cleanedCount = 0;

        for (const file of files) {
            const filePath = path.join(tempDir, file);

            try {
                const stats = fs.statSync(filePath);

                // Skip directories
                if (stats.isDirectory()) {
                    continue;
                }

                if (now - stats.mtimeMs > maxAge) {
                    // Try to delete, but don't fail if file is locked
                    try {
                        fs.unlinkSync(filePath);
                        cleanedCount++;
                        console.log(`  ✓ Cleaned up: ${file}`);
                    } catch (unlinkError) {
                        // File might be in use, skip it
                        console.log(`  ⚠ Skipped (in use): ${file}`);
                    }
                }
            } catch (statError) {
                console.error(`  ✗ Error checking ${file}:`, statError);
            }
        }

        if (cleanedCount > 0) {
            console.log(`  📊 Cleaned up ${cleanedCount} file(s)`);
        }
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
};

/**
 * Delete a specific file
 */
export const deleteFile = (filePath: string): boolean => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
        return false;
    }
};

/**
 * Schedule a file for deletion after a delay
 */
export const scheduleDelete = (filePath: string, delayMs: number = 60000): void => {
    setTimeout(() => {
        deleteFile(filePath);
    }, delayMs);
};

/**
 * Ensure temp directory exists
 */
export const ensureTempDir = (): void => {
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
        console.log(`📁 Created temp directory: ${tempDir}`);
    }
};

/**
 * Get temp directory path
 */
export const getTempDir = (): string => tempDir;

/**
 * Get disk usage of temp directory
 */
export const getTempDirStats = (): { files: number; totalSize: number } => {
    if (!fs.existsSync(tempDir)) {
        return { files: 0, totalSize: 0 };
    }

    try {
        const files = fs.readdirSync(tempDir);
        let totalSize = 0;
        let fileCount = 0;

        for (const file of files) {
            const filePath = path.join(tempDir, file);
            try {
                const stats = fs.statSync(filePath);
                if (stats.isFile()) {
                    totalSize += stats.size;
                    fileCount++;
                }
            } catch {
                // Skip files that can't be read
            }
        }

        return { files: fileCount, totalSize };
    } catch {
        return { files: 0, totalSize: 0 };
    }
};
