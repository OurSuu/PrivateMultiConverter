import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}


let toastCallback: ((toast: Toast) => void) | null = null;

export const showToast = (message: string, type: ToastType = 'info', duration: number = 4000) => {
    if (toastCallback) {
        toastCallback({
            id: `${Date.now()}-${Math.random()}`,
            message,
            type,
            duration,
        });
    }
};

export const toast = {
    success: (message: string, duration?: number) => showToast(message, 'success', duration),
    error: (message: string, duration?: number) => showToast(message, 'error', duration),
    info: (message: string, duration?: number) => showToast(message, 'info', duration),
    warning: (message: string, duration?: number) => showToast(message, 'warning', duration),
};

const toastStyles: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: {
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
        icon: '✅',
    },
    error: {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        icon: '❌',
    },
    info: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        icon: 'ℹ️',
    },
    warning: {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        icon: '⚠️',
    },
};

export default function NotificationToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Toast) => {
        setToasts(prev => [...prev, toast]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    useEffect(() => {
        toastCallback = addToast;
        return () => {
            toastCallback = null;
        };
    }, [addToast]);

    useEffect(() => {
        const timers = toasts.map(t => {
            return setTimeout(() => {
                removeToast(t.id);
            }, t.duration || 4000);
        });

        return () => timers.forEach(clearTimeout);
    }, [toasts, removeToast]);

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            <AnimatePresence mode="popLayout">
                {toasts.map((t) => {
                    const style = toastStyles[t.type];
                    return (
                        <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, x: 100, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.9 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className={`
                                ${style.bg} ${style.border}
                                border rounded-xl p-4 shadow-lg backdrop-blur-xl
                                flex items-start gap-3 cursor-pointer
                            `}
                            onClick={() => removeToast(t.id)}
                        >
                            <span className="text-xl flex-shrink-0">{style.icon}</span>
                            <p className="text-sm text-white/90 leading-relaxed">{t.message}</p>
                            <button
                                className="text-white/50 hover:text-white/80 transition-colors ml-auto flex-shrink-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeToast(t.id);
                                }}
                            >
                                ✕
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
