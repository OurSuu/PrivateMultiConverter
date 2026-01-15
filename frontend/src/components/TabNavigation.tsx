import { motion } from 'framer-motion';

interface TabNavigationProps {
    activeTab: 'converter' | 'youtube' | 'qrcode';
    onTabChange: (tab: 'converter' | 'youtube' | 'qrcode') => void;
}

const tabs = [
    { id: 'converter' as const, label: 'File Converter', icon: '📁' },
    { id: 'youtube' as const, label: 'YouTube', icon: '🎬' },
    { id: 'qrcode' as const, label: 'QR Code', icon: '📱' },
];

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
    return (
        <nav className="flex border-b border-dark-800">
            {tabs.map((tab) => (
                <motion.button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`tab-luxury ${activeTab === tab.id ? 'active' : ''}`}
                    whileHover={{ backgroundColor: 'rgba(212, 175, 55, 0.05)' }}
                    whileTap={{ scale: 0.98 }}
                >
                    <motion.span
                        className="text-2xl mb-1 block"
                        animate={activeTab === tab.id ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.3 }}
                    >
                        {tab.icon}
                    </motion.span>
                    <span className="text-sm md:text-base">{tab.label}</span>

                    {/* Active indicator */}
                    {activeTab === tab.id && (
                        <motion.div
                            className="absolute bottom-0 left-0 right-0 h-0.5"
                            layoutId="activeTab"
                            style={{
                                background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
                            }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    )}
                </motion.button>
            ))}
        </nav>
    );
}
