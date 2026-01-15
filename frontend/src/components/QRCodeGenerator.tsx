import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';
import SuccessAnimation from './SuccessAnimation';
import { generateQRCode } from '../services/api';
import { toast } from './NotificationToast';

type QRType = 'url' | 'text' | 'wifi' | 'email';

interface WifiConfig {
    ssid: string;
    password: string;
    encryption: 'WPA' | 'WEP' | 'nopass';
}

const qrTypes: { value: QRType; label: string; icon: string }[] = [
    { value: 'url', label: 'URL', icon: '🔗' },
    { value: 'text', label: 'Text', icon: '📝' },
    { value: 'wifi', label: 'WiFi', icon: '📶' },
    { value: 'email', label: 'Email', icon: '📧' },
];

const colorPresets = [
    { dark: '#000000', light: '#FFFFFF', name: 'Classic' },
    { dark: '#D4AF37', light: '#0B0E14', name: 'Gold' },
    { dark: '#1a365d', light: '#FFFFFF', name: 'Navy' },
    { dark: '#22543d', light: '#FFFFFF', name: 'Forest' },
    { dark: '#742a2a', light: '#FFFFFF', name: 'Wine' },
];

export default function QRCodeGenerator() {
    const [qrType, setQrType] = useState<QRType>('url');
    const [url, setUrl] = useState('');
    const [text, setText] = useState('');
    const [email, setEmail] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [wifi, setWifi] = useState<WifiConfig>({ ssid: '', password: '', encryption: 'WPA' });
    const [qrSize, setQrSize] = useState(512);
    const [darkColor, setDarkColor] = useState('#000000');
    const [lightColor, setLightColor] = useState('#FFFFFF');
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const getQRContent = (): string => {
        switch (qrType) {
            case 'url': {
                let finalUrl = url;
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    finalUrl = 'https://' + url;
                }
                return finalUrl;
            }
            case 'text':
                return text;
            case 'wifi':
                return `WIFI:T:${wifi.encryption};S:${wifi.ssid};P:${wifi.password};;`;
            case 'email':
                return `mailto:${email}${emailSubject ? `?subject=${encodeURIComponent(emailSubject)}` : ''}`;
            default:
                return '';
        }
    };

    const isValidInput = (): boolean => {
        switch (qrType) {
            case 'url':
                return url.trim().length > 0;
            case 'text':
                return text.trim().length > 0;
            case 'wifi':
                return wifi.ssid.trim().length > 0;
            case 'email':
                return email.trim().length > 0 && email.includes('@');
            default:
                return false;
        }
    };

    const handleGenerate = async () => {
        if (!isValidInput()) {
            setError('Please fill in the required fields');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setShowSuccess(false);

        try {
            const content = getQRContent();
            const result = await generateQRCode(content, {
                size: qrSize,
                darkColor,
                lightColor,
            });
            setQrDataUrl(result.dataUrl);
            setShowSuccess(true);
            toast.success('QR Code generated successfully!');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to generate QR code';
            setError(message);
            toast.error(message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!qrDataUrl) return;

        const link = document.createElement('a');
        link.download = `qrcode-${Date.now()}.png`;
        link.href = qrDataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('QR Code downloaded!');
    };

    const handleCopyToClipboard = async () => {
        if (!qrDataUrl) return;

        try {
            const response = await fetch(qrDataUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            toast.success('QR Code copied to clipboard!');
        } catch {
            toast.error('Failed to copy to clipboard');
        }
    };

    const handleReset = () => {
        setUrl('');
        setText('');
        setEmail('');
        setEmailSubject('');
        setWifi({ ssid: '', password: '', encryption: 'WPA' });
        setQrDataUrl(null);
        setError(null);
        setShowSuccess(false);
    };

    const applyColorPreset = (preset: typeof colorPresets[0]) => {
        setDarkColor(preset.dark);
        setLightColor(preset.light);
    };

    return (
        <div className="space-y-6">
            {/* QR Type Selector */}
            <div>
                <label className="block text-sm font-medium text-dark-300 mb-3">
                    QR Code Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {qrTypes.map((type) => (
                        <motion.button
                            key={type.value}
                            onClick={() => {
                                setQrType(type.value);
                                setQrDataUrl(null);
                                setShowSuccess(false);
                            }}
                            className={`format-card text-center py-3 ${qrType === type.value ? 'selected' : ''}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className="text-xl block mb-1">{type.icon}</span>
                            <span className="text-xs">{type.label}</span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Input Fields based on type */}
            <div className="space-y-4">
                {qrType === 'url' && (
                    <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">URL</label>
                        <motion.input
                            type="text"
                            value={url}
                            onChange={(e) => {
                                setUrl(e.target.value);
                                setError(null);
                                setQrDataUrl(null);
                                setShowSuccess(false);
                            }}
                            placeholder="example.com or https://example.com"
                            className="input-luxury"
                            disabled={isGenerating}
                            whileFocus={{ boxShadow: '0 0 30px rgba(212, 175, 55, 0.2)' }}
                        />
                    </div>
                )}

                {qrType === 'text' && (
                    <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">Text</label>
                        <motion.textarea
                            value={text}
                            onChange={(e) => {
                                setText(e.target.value);
                                setError(null);
                                setQrDataUrl(null);
                                setShowSuccess(false);
                            }}
                            placeholder="Enter any text..."
                            className="input-luxury min-h-[100px] resize-none"
                            disabled={isGenerating}
                        />
                    </div>
                )}

                {qrType === 'wifi' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">Network Name (SSID)</label>
                            <input
                                type="text"
                                value={wifi.ssid}
                                onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                                placeholder="WiFi Network Name"
                                className="input-luxury"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">Password</label>
                            <input
                                type="password"
                                value={wifi.password}
                                onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                                placeholder="WiFi Password"
                                className="input-luxury"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">Encryption</label>
                            <select
                                value={wifi.encryption}
                                onChange={(e) => setWifi({ ...wifi, encryption: e.target.value as WifiConfig['encryption'] })}
                                className="input-luxury"
                            >
                                <option value="WPA">WPA/WPA2</option>
                                <option value="WEP">WEP</option>
                                <option value="nopass">None</option>
                            </select>
                        </div>
                    </>
                )}

                {qrType === 'email' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="input-luxury"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">Subject (Optional)</label>
                            <input
                                type="text"
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                placeholder="Email subject..."
                                className="input-luxury"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Customization Options */}
            {!showSuccess && (
                <div className="glass-card p-4 space-y-4">
                    <h3 className="text-sm font-medium text-dark-300 flex items-center gap-2">
                        🎨 Customization
                    </h3>

                    {/* Color Presets */}
                    <div>
                        <label className="block text-xs text-dark-400 mb-2">Color Presets</label>
                        <div className="flex gap-2 flex-wrap">
                            {colorPresets.map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => applyColorPreset(preset)}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors text-xs"
                                    title={preset.name}
                                >
                                    <span
                                        className="w-4 h-4 rounded"
                                        style={{ background: preset.dark, border: `1px solid ${preset.light}` }}
                                    />
                                    <span className="text-dark-300">{preset.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Colors */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-dark-400 mb-2">Foreground Color</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={darkColor}
                                    onChange={(e) => setDarkColor(e.target.value)}
                                    className="w-10 h-10 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={darkColor}
                                    onChange={(e) => setDarkColor(e.target.value)}
                                    className="input-luxury text-xs flex-1"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-dark-400 mb-2">Background Color</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={lightColor}
                                    onChange={(e) => setLightColor(e.target.value)}
                                    className="w-10 h-10 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={lightColor}
                                    onChange={(e) => setLightColor(e.target.value)}
                                    className="input-luxury text-xs flex-1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Size */}
                    <div>
                        <label className="block text-xs text-dark-400 mb-2">
                            Size: {qrSize}×{qrSize}px
                        </label>
                        <input
                            type="range"
                            min="128"
                            max="1024"
                            step="64"
                            value={qrSize}
                            onChange={(e) => setQrSize(parseInt(e.target.value))}
                            className="w-full accent-gold-500"
                        />
                    </div>
                </div>
            )}

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <p className="font-medium">⚠️ Error</p>
                        <p className="text-sm mt-1 text-red-400">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading */}
            {isGenerating && (
                <motion.div
                    className="flex flex-col items-center py-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <LoadingSpinner size={50} />
                    <p className="text-dark-400 mt-4">Generating QR Code...</p>
                </motion.div>
            )}

            {/* QR Code Display */}
            <AnimatePresence>
                {showSuccess && qrDataUrl && (
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <SuccessAnimation message="QR Code Generated!" />

                        {/* QR Code with gold border */}
                        <motion.div
                            className="inline-block p-6 rounded-2xl mt-4"
                            style={{
                                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(255, 209, 102, 0.05))',
                                border: '2px solid rgba(212, 175, 55, 0.3)',
                                boxShadow: '0 0 40px rgba(212, 175, 55, 0.15)',
                            }}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                        >
                            <div className="bg-white p-4 rounded-xl">
                                <img
                                    src={qrDataUrl}
                                    alt="Generated QR Code"
                                    className="w-56 h-56"
                                />
                            </div>
                        </motion.div>

                        {/* Action buttons */}
                        <motion.div
                            className="flex flex-wrap justify-center gap-3 mt-6"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <motion.button
                                onClick={handleDownload}
                                className="btn-gold"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                ⬇️ Download PNG
                            </motion.button>
                            <motion.button
                                onClick={handleCopyToClipboard}
                                className="btn-ghost border-gold-500/50"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                📋 Copy to Clipboard
                            </motion.button>
                            <motion.button
                                onClick={handleReset}
                                className="btn-ghost"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Generate Another
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Generate Button */}
            {!isGenerating && !showSuccess && (
                <motion.button
                    onClick={handleGenerate}
                    disabled={!isValidInput()}
                    className={`w-full text-lg py-4 ${isValidInput() ? 'btn-gold' : 'bg-dark-800 text-dark-500 rounded-xl cursor-not-allowed'}`}
                    whileHover={isValidInput() ? { scale: 1.02 } : {}}
                    whileTap={isValidInput() ? { scale: 0.98 } : {}}
                >
                    ✨ Generate QR Code
                </motion.button>
            )}

            {/* Info Card */}
            <motion.div
                className="p-4 glass-card text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <p className="text-dark-400 text-sm">
                    💡 QR codes work with URLs, text, WiFi credentials, and email addresses
                </p>
            </motion.div>
        </div>
    );
}
