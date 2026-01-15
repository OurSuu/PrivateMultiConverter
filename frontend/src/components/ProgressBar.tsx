import { motion } from 'framer-motion';

interface ProgressBarProps {
    progress: number;
    status?: string;
}

export default function ProgressBar({ progress, status }: ProgressBarProps) {
    return (
        <div className="w-full">
            <div className="flex justify-between mb-3 text-sm">
                <span className="text-dark-300">{status || 'Processing...'}</span>
                <span className="text-gold-400 font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="progress-bar-gold">
                <motion.div
                    className="fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
}
