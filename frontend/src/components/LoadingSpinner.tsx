import { motion } from 'framer-motion';

export default function LoadingSpinner({ size = 40 }: { size?: number }) {
    return (
        <motion.div
            className="relative"
            style={{ width: size, height: size }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    border: '3px solid rgba(212, 175, 55, 0.1)',
                    borderTopColor: '#D4AF37',
                    boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)',
                }}
            />
            <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(212, 175, 55, 0.2), transparent 70%)',
                }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
        </motion.div>
    );
}
