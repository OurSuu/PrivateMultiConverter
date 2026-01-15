import { motion } from 'framer-motion';

interface SuccessAnimationProps {
    message?: string;
    onComplete?: () => void;
}

export default function SuccessAnimation({ message = 'Success!', onComplete }: SuccessAnimationProps) {
    return (
        <motion.div
            className="text-center py-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            onAnimationComplete={onComplete}
        >
            {/* Success circle with checkmark */}
            <motion.div
                className="relative inline-block mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            >
                {/* Glow effect */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.4), transparent 70%)',
                    }}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Circle */}
                <motion.div
                    className="w-20 h-20 rounded-full flex items-center justify-center relative"
                    style={{
                        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(255, 209, 102, 0.2))',
                        border: '2px solid rgba(212, 175, 55, 0.5)',
                        boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
                    }}
                >
                    {/* Checkmark */}
                    <motion.svg
                        className="w-10 h-10 text-gold-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <motion.path
                            d="M5 12l5 5L19 7"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.4, ease: 'easeOut' }}
                        />
                    </motion.svg>
                </motion.div>

                {/* Burst particles */}
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-gold-400"
                        style={{
                            top: '50%',
                            left: '50%',
                            boxShadow: '0 0 10px rgba(212, 175, 55, 0.8)',
                        }}
                        initial={{ x: '-50%', y: '-50%', scale: 0 }}
                        animate={{
                            x: `${Math.cos(i * 45 * (Math.PI / 180)) * 60 - 4}px`,
                            y: `${Math.sin(i * 45 * (Math.PI / 180)) * 60 - 4}px`,
                            scale: [0, 1, 0],
                            opacity: [0, 1, 0],
                        }}
                        transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
                    />
                ))}
            </motion.div>

            {/* Message */}
            <motion.p
                className="text-2xl font-semibold text-gold-gradient"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.4 }}
            >
                {message}
            </motion.p>
        </motion.div>
    );
}
