import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProgressBar from './ProgressBar';
import SuccessAnimation from './SuccessAnimation';
import LoadingSpinner from './LoadingSpinner';
import { downloadYouTube, pollYouTubeStatus, getDownloadUrl, getYouTubeInfo } from '../services/api';
import type { YouTubeFormat, YouTubeJob, YouTubeVideoInfo } from '../types';

const formatOptions: { value: YouTubeFormat; label: string; description: string; icon: string }[] = [
    { value: 'audio', label: 'Audio Only', description: 'MP3 file • Best for music', icon: '🎵' },
    { value: 'video-audio', label: 'Video + Audio', description: 'MP4 merged • Recommended', icon: '🎬' },
    { value: 'video-only', label: 'Video Only', description: 'MP4 no audio • For editing', icon: '🎞️' },
    { value: 'separate', label: 'Separate Files', description: 'Video & Audio • Professional', icon: '📦' },
];

export default function YouTubeDownloader() {
    const [url, setUrl] = useState('');
    const [format, setFormat] = useState<YouTubeFormat>('video-audio');
    const [videoInfo, setVideoInfo] = useState<YouTubeVideoInfo | null>(null);
    const [job, setJob] = useState<YouTubeJob | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingInfo, setIsLoadingInfo] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const isValidUrl = (url: string) => {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[\w-]+/;
        return youtubeRegex.test(url);
    };

    const handleUrlChange = async (newUrl: string) => {
        setUrl(newUrl);
        setError(null);
        setVideoInfo(null);
        setJob(null);
        setShowSuccess(false);

        if (isValidUrl(newUrl)) {
            setIsLoadingInfo(true);
            try {
                const info = await getYouTubeInfo(newUrl);
                setVideoInfo(info);
            } catch {
                // Silently fail
            } finally {
                setIsLoadingInfo(false);
            }
        }
    };

    const handleDownload = async () => {
        if (!url || !isValidUrl(url)) {
            setError('Please enter a valid YouTube URL');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setShowSuccess(false);

        try {
            const initialJob = await downloadYouTube(url, format);
            setJob(initialJob);

            let currentJob = initialJob;
            while (currentJob.status === 'pending' || currentJob.status === 'processing') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                currentJob = await pollYouTubeStatus(currentJob.id);
                setJob(currentJob);
            }

            if (currentJob.status === 'error') {
                setError(currentJob.error || 'Download failed');
            } else if (currentJob.status === 'completed') {
                setShowSuccess(true);
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'An error occurred';
            if (typeof err === 'object' && err !== null && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setError(axiosErr.response?.data?.message || errorMsg);
            } else {
                setError(errorMsg);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadFile = (downloadUrl?: string) => {
        if (downloadUrl) {
            window.open(getDownloadUrl(downloadUrl), '_blank');
        }
    };

    const handleReset = () => {
        setUrl('');
        setVideoInfo(null);
        setJob(null);
        setError(null);
        setShowSuccess(false);
    };

    return (
        <div className="space-y-6">
            {/* Format Selector */}
            <div>
                <label className="block text-sm font-medium text-dark-300 mb-3">
                    Select Download Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {formatOptions.map((option) => (
                        <motion.button
                            key={option.value}
                            onClick={() => setFormat(option.value)}
                            disabled={isProcessing}
                            className={`format-card ${format === option.value ? 'selected' : ''} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            whileHover={!isProcessing ? { scale: 1.02, y: -2 } : {}}
                            whileTap={!isProcessing ? { scale: 0.98 } : {}}
                        >
                            <span className="text-2xl block mb-1">{option.icon}</span>
                            <span className="font-medium text-sm block">{option.label}</span>
                            <span className="text-xs text-dark-400 block mt-1">{option.description}</span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Success State */}
            <AnimatePresence>
                {showSuccess && job?.downloadUrl && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <SuccessAnimation message="Download Ready!" />
                        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
                            <motion.button
                                onClick={() => handleDownloadFile(job.downloadUrl)}
                                className="btn-gold"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {format === 'audio' ? '🎵 Download MP3' : '🎬 Download Video'}
                            </motion.button>

                            {format === 'separate' && job.audioDownloadUrl && (
                                <motion.button
                                    onClick={() => handleDownloadFile(job.audioDownloadUrl)}
                                    className="btn-ghost border-gold-500/50"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    🎵 Download Audio
                                </motion.button>
                            )}

                            <motion.button
                                onClick={handleReset}
                                className="btn-ghost"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Download Another
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* URL Input */}
            {!showSuccess && (
                <div>
                    <label className="block text-sm font-medium text-dark-300 mb-3">
                        YouTube URL
                    </label>
                    <motion.input
                        type="url"
                        value={url}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="input-luxury"
                        disabled={isProcessing}
                        whileFocus={{ boxShadow: '0 0 30px rgba(212, 175, 55, 0.2)' }}
                    />
                </div>
            )}

            {/* Video Info Preview */}
            <AnimatePresence>
                {(videoInfo || isLoadingInfo) && !showSuccess && (
                    <motion.div
                        className="p-4 glass-card"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {isLoadingInfo ? (
                            <div className="flex items-center gap-3">
                                <LoadingSpinner size={24} />
                                <span className="text-dark-300">Fetching video info...</span>
                            </div>
                        ) : videoInfo && (
                            <div className="flex gap-4">
                                {videoInfo.thumbnail && (
                                    <img
                                        src={videoInfo.thumbnail}
                                        alt="Thumbnail"
                                        className="w-28 h-20 object-cover rounded-lg flex-shrink-0 border border-gold-500/20"
                                    />
                                )}
                                <div className="min-w-0">
                                    <p className="text-gold-300 font-medium truncate">{videoInfo.title}</p>
                                    <p className="text-dark-400 text-sm mt-1">⏱️ {videoInfo.duration}</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress */}
            {isProcessing && job && (
                <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {job.title && (
                        <div className="p-4 glass-card">
                            <p className="text-sm text-dark-400">Downloading:</p>
                            <p className="text-gold-300 font-medium truncate">{job.title}</p>
                        </div>
                    )}
                    <ProgressBar
                        progress={job.progress}
                        status={job.status === 'processing' ? 'Processing with yt-dlp...' : 'Starting...'}
                    />
                </motion.div>
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
                        <p className="font-medium flex items-center gap-2">⚠️ Error</p>
                        <p className="text-sm mt-1 text-red-400">{error}</p>
                        {error.includes('yt-dlp') && (
                            <p className="text-xs text-red-500/70 mt-2">
                                Install: <code className="bg-dark-800 px-1 rounded">pip install yt-dlp</code>
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Download Button */}
            {!isProcessing && !showSuccess && (
                <motion.button
                    onClick={handleDownload}
                    disabled={!url}
                    className={`w-full text-lg py-4 ${url ? 'btn-gold' : 'bg-dark-800 text-dark-500 rounded-xl cursor-not-allowed'}`}
                    whileHover={url ? { scale: 1.02 } : {}}
                    whileTap={url ? { scale: 0.98 } : {}}
                >
                    ✨ Download {formatOptions.find(o => o.value === format)?.label}
                </motion.button>
            )}

            {/* Info */}
            <motion.div
                className="p-4 glass-card text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <p className="text-dark-400 text-sm">
                    ⚠️ Only download content you have permission to use
                </p>
                <p className="text-dark-500 text-xs mt-1">
                    Powered by yt-dlp + FFmpeg
                </p>
            </motion.div>
        </div>
    );
}
