/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Dark luxury backgrounds
                dark: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#121826',
                    950: '#0B0E14',
                },
                // Gold accent colors
                gold: {
                    50: '#FFFBEB',
                    100: '#FEF3C7',
                    200: '#FDE68A',
                    300: '#FFD166',
                    400: '#F59E0B',
                    500: '#D4AF37',
                    600: '#B8860B',
                    700: '#92400E',
                    800: '#78350F',
                    900: '#451A03',
                },
            },
            animation: {
                'gradient': 'gradient 8s linear infinite',
                'float': 'float 6s ease-in-out infinite',
                'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'glow': 'glow 2s ease-in-out infinite',
                'particle': 'particle 20s linear infinite',
            },
            keyframes: {
                gradient: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'pulse-gold': {
                    '0%, 100%': { opacity: 1, boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' },
                    '50%': { opacity: 0.8, boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                glow: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)' },
                    '50%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.4)' },
                },
                particle: {
                    '0%': { transform: 'translateY(100vh) rotate(0deg)', opacity: 0 },
                    '10%': { opacity: 1 },
                    '90%': { opacity: 1 },
                    '100%': { transform: 'translateY(-100vh) rotate(720deg)', opacity: 0 },
                },
            },
            backgroundImage: {
                'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #FFD166 50%, #D4AF37 100%)',
                'dark-gradient': 'linear-gradient(135deg, #0B0E14 0%, #121826 50%, #0B0E14 100%)',
                'shimmer-gradient': 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent)',
            },
            boxShadow: {
                'gold': '0 4px 30px rgba(212, 175, 55, 0.15)',
                'gold-lg': '0 10px 50px rgba(212, 175, 55, 0.25)',
                'gold-glow': '0 0 30px rgba(212, 175, 55, 0.4)',
                'inner-gold': 'inset 0 1px 0 rgba(212, 175, 55, 0.2)',
            },
        },
    },
    plugins: [],
}
