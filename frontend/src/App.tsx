import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GoldParticles from './components/GoldParticles';
import TabNavigation from './components/TabNavigation';
import FileConverter from './components/FileConverter';
import YouTubeDownloader from './components/YouTubeDownloader';
import QRCodeGenerator from './components/QRCodeGenerator';
import NotificationToast, { toast } from './components/NotificationToast';

type Tab = 'converter' | 'youtube' | 'qrcode';

const pageVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.98 },
};

const pageTransition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.3,
};

function App() {
    const [activeTab, setActiveTab] = useState<Tab>('converter');
    const [isOnline, setIsOnline] = useState(true);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + 1/2/3 for tab switching
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        setActiveTab('converter');
                        break;
                    case '2':
                        e.preventDefault();
                        setActiveTab('youtube');
                        break;
                    case '3':
                        e.preventDefault();
                        setActiveTab('qrcode');
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Health check on mount
    useEffect(() => {
        const checkServerHealth = async () => {
            // Import the detailed health check
            const { checkHealthDetailed } = await import('./services/api');
            const status = await checkHealthDetailed();

            setIsOnline(status.online);

            // Show appropriate message based on error type
            if (!status.online) {
                switch (status.error) {
                    case 'cors':
                        toast.error('Cannot connect to server. CORS or network issue.');
                        break;
                    case 'timeout':
                        toast.warning('Server is slow to respond.');
                        break;
                    case 'auth':
                        toast.warning('Server online but authentication failed.');
                        break;
                    default:
                        toast.warning('Backend server is not responding.');
                }
            }
        };

        checkServerHealth();

        // Check every 30 seconds
        const interval = setInterval(checkServerHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen py-8 px-4 relative">
            {/* Notification Toast Container */}
            <NotificationToast />

            {/* Animated gold particle background */}
            <GoldParticles />

            <div className="relative z-10 max-w-4xl mx-auto">
                {/* Header */}
                <motion.header
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                    <motion.h1
                        className="text-4xl md:text-5xl font-bold mb-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <span className="text-gold-gradient text-shadow-gold">Multi-Converter</span>
                    </motion.h1>
                    <motion.p
                        className="text-dark-400 text-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                    >
                        Premium file conversion • YouTube downloads • QR codes
                    </motion.p>

                    {/* Server status indicator */}
                    <motion.div
                        className="mt-2 flex items-center justify-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                    >
                        <span
                            className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ boxShadow: isOnline ? '0 0 8px rgba(34, 197, 94, 0.6)' : '0 0 8px rgba(239, 68, 68, 0.6)' }}
                        />
                        <span className="text-dark-500 text-xs">
                            {isOnline ? 'Server Online' : 'Server Offline'}
                        </span>
                    </motion.div>

                    {/* Gold line accent */}
                    <motion.div
                        className="mt-4 mx-auto w-24 h-0.5"
                        style={{
                            background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
                        }}
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                    />
                </motion.header>

                {/* Main Card */}
                <motion.main
                    className="glass-card overflow-hidden"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                >
                    <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

                    <div className="p-6 md:p-8 min-h-[400px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={pageTransition}
                            >
                                {activeTab === 'converter' && <FileConverter />}
                                {activeTab === 'youtube' && <YouTubeDownloader />}
                                {activeTab === 'qrcode' && <QRCodeGenerator />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.main>

                {/* Footer */}
                <motion.footer
                    className="text-center mt-8 text-dark-500 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                >
                    <p className="flex items-center justify-center gap-2">
                        <span className="text-gold-500">✦</span>
                        Private Multi-Converter
                        <span className="text-gold-500">✦</span>
                    </p>
                    <p className="text-dark-600 text-xs mt-1">
                        Premium Conversion Suite • <kbd className="px-1 py-0.5 bg-dark-800 rounded text-[10px]">Ctrl+1/2/3</kbd> to switch tabs
                    </p>
                </motion.footer>
            </div>
        </div>
    );
}

export default App;
