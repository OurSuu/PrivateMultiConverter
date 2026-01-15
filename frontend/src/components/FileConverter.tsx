import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import ProgressBar from './ProgressBar';
import SuccessAnimation from './SuccessAnimation';
import { convertFile, pollConversionStatus, getDownloadUrl } from '../services/api';
import type { ConversionType, ConversionJob } from '../types';

const conversionOptions: { value: ConversionType; label: string; description: string; accept: string; icon: string }[] = [
    { value: 'mp4-to-mp3', label: 'MP4 → MP3', description: 'Extract audio', accept: '.mp4', icon: '🎵' },
    { value: 'image-to-webp', label: 'Image → WebP', description: 'Optimize images', accept: '.png,.jpg,.jpeg', icon: '🖼️' },
    { value: 'pdf-to-jpg', label: 'PDF → JPG', description: 'PDF to image', accept: '.pdf', icon: '📄' },
    { value: 'docx-to-pdf', label: 'DOCX → PDF', description: 'Word to PDF', accept: '.docx', icon: '📝' },
];

export default function FileConverter() {
    const [selectedType, setSelectedType] = useState<ConversionType>('mp4-to-mp3');
    const [file, setFile] = useState<File | null>(null);
    const [job, setJob] = useState<ConversionJob | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const currentOption = conversionOptions.find(o => o.value === selectedType)!;

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setError(null);
            setJob(null);
            setShowSuccess(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: currentOption.accept.split(',').reduce((acc, ext) => {
            const mimeTypes: Record<string, string> = {
                '.mp4': 'video/mp4',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.pdf': 'application/pdf',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            };
            acc[mimeTypes[ext]] = [ext];
            return acc;
        }, {} as Record<string, string[]>),
        maxFiles: 1,
        maxSize: 100 * 1024 * 1024,
    });

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        setShowSuccess(false);

        try {
            const initialJob = await convertFile(file, selectedType, (progress) => {
                setJob(prev => prev ? { ...prev, progress } : { id: '', status: 'processing', progress });
            });

            setJob(initialJob);

            let currentJob = initialJob;
            while (currentJob.status === 'pending' || currentJob.status === 'processing') {
                await new Promise(resolve => setTimeout(resolve, 1000));
                currentJob = await pollConversionStatus(currentJob.id);
                setJob(currentJob);
            }

            if (currentJob.status === 'error') {
                setError(currentJob.error || 'Conversion failed');
            } else if (currentJob.status === 'completed') {
                setShowSuccess(true);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (job?.downloadUrl) {
            window.open(getDownloadUrl(job.downloadUrl), '_blank');
        }
    };

    const handleReset = () => {
        setFile(null);
        setJob(null);
        setError(null);
        setShowSuccess(false);
    };

    return (
        <div className="space-y-6">
            {/* Conversion Type Selector */}
            <div>
                <label className="block text-sm font-medium text-dark-300 mb-3">
                    Select Conversion Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {conversionOptions.map((option) => (
                        <motion.button
                            key={option.value}
                            onClick={() => {
                                setSelectedType(option.value);
                                setFile(null);
                                setJob(null);
                                setError(null);
                                setShowSuccess(false);
                            }}
                            className={`format-card ${selectedType === option.value ? 'selected' : ''}`}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isProcessing}
                        >
                            <span className="text-2xl block mb-1">{option.icon}</span>
                            <span className="font-medium text-sm block">{option.label}</span>
                            <span className="text-xs text-dark-400 block mt-1">{option.description}</span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Success Animation */}
            <AnimatePresence>
                {showSuccess && job?.downloadUrl && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <SuccessAnimation message="Conversion Complete!" />
                        <div className="flex justify-center gap-4 mt-4">
                            <motion.button
                                onClick={handleDownload}
                                className="btn-gold"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                ⬇️ Download File
                            </motion.button>
                            <motion.button
                                onClick={handleReset}
                                className="btn-ghost"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Convert Another
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* File Upload Zone */}
            {!showSuccess && (
                <div {...getRootProps()}>
                    <motion.div
                        className={`dropzone-luxury ${isDragActive ? 'active' : ''} ${file ? 'border-gold-500/50 bg-gold-500/5' : ''}`}
                        whileHover={{ borderColor: 'rgba(212, 175, 55, 0.5)' }}
                    >
                        <input {...getInputProps()} />
                        <motion.div
                            className="text-5xl mb-4"
                            animate={isDragActive ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 0.3 }}
                        >
                            {file ? '✅' : isDragActive ? '📥' : '📤'}
                        </motion.div>
                        {file ? (
                            <div>
                                <p className="text-lg font-medium text-gold-300">{file.name}</p>
                                <p className="text-dark-400 mt-1">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-lg font-medium text-dark-200">
                                    {isDragActive ? 'Drop your file here' : 'Drag & drop or click to select'}
                                </p>
                                <p className="text-dark-500 mt-2 text-sm">
                                    Accepted: {currentOption.accept} • Max 100MB
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* Progress Bar */}
            {isProcessing && job && (
                <ProgressBar
                    progress={job.progress}
                    status={job.status === 'processing' ? 'Converting...' : 'Uploading...'}
                />
            )}

            {/* Error Message */}
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

            {/* Convert Button */}
            {file && !isProcessing && !showSuccess && (
                <motion.button
                    onClick={handleConvert}
                    className="w-full btn-gold text-lg py-4"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    ✨ Start Conversion
                </motion.button>
            )}
        </div>
    );
}
