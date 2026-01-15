import QRCode from 'qrcode';

interface QRCodeOptions {
    size?: number;
    darkColor?: string;
    lightColor?: string;
}

interface QRCodeResult {
    success: boolean;
    dataUrl?: string;
    error?: string;
}

export const generateQRCode = async (
    content: string,
    options: QRCodeOptions = {}
): Promise<QRCodeResult> => {
    try {
        const {
            size = 512,
            darkColor = '#000000',
            lightColor = '#FFFFFF',
        } = options;

        // Validate size
        const validSize = Math.min(Math.max(size, 64), 2048);

        // Validate colors (basic hex validation)
        const hexPattern = /^#[0-9A-Fa-f]{6}$/;
        const validDarkColor = hexPattern.test(darkColor) ? darkColor : '#000000';
        const validLightColor = hexPattern.test(lightColor) ? lightColor : '#FFFFFF';

        const dataUrl = await QRCode.toDataURL(content, {
            width: validSize,
            margin: 2,
            color: {
                dark: validDarkColor,
                light: validLightColor,
            },
            errorCorrectionLevel: 'M',
        });

        return { success: true, dataUrl };
    } catch (err) {
        console.error('QR code generation error:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'QR code generation failed'
        };
    }
};

// Generate QR code as buffer (for file download)
export const generateQRCodeBuffer = async (
    content: string,
    options: QRCodeOptions = {}
): Promise<Buffer | null> => {
    try {
        const {
            size = 512,
            darkColor = '#000000',
            lightColor = '#FFFFFF',
        } = options;

        const buffer = await QRCode.toBuffer(content, {
            width: size,
            margin: 2,
            color: {
                dark: darkColor,
                light: lightColor,
            },
            errorCorrectionLevel: 'M',
            type: 'png',
        });

        return buffer;
    } catch (err) {
        console.error('QR code buffer generation error:', err);
        return null;
    }
};
