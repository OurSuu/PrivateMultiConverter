import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
    id: number;
    left: number;
    size: number;
    duration: number;
    delay: number;
    opacity: number;
}

export default function GoldParticles() {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        // Generate particles
        const newParticles: Particle[] = [];
        for (let i = 0; i < 30; i++) {
            newParticles.push({
                id: i,
                left: Math.random() * 100,
                size: Math.random() * 4 + 2,
                duration: Math.random() * 15 + 15,
                delay: Math.random() * 20,
                opacity: Math.random() * 0.5 + 0.2,
            });
        }
        setParticles(newParticles);
    }, []);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {/* Gradient orbs */}
            <motion.div
                className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 70%)',
                }}
                animate={{
                    x: [0, 50, 0],
                    y: [0, 30, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
            <motion.div
                className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(212, 175, 55, 0.06) 0%, transparent 70%)',
                }}
                animate={{
                    x: [0, -40, 0],
                    y: [0, -20, 0],
                    scale: [1, 1.15, 1],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 2,
                }}
            />

            {/* Gold particles */}
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${particle.left}%`,
                        bottom: '-20px',
                        width: particle.size,
                        height: particle.size,
                        background: `radial-gradient(circle, rgba(212, 175, 55, ${particle.opacity}) 0%, transparent 70%)`,
                        boxShadow: `0 0 ${particle.size * 2}px rgba(212, 175, 55, ${particle.opacity * 0.5})`,
                    }}
                    animate={{
                        y: [0, -window.innerHeight - 100],
                        x: [0, Math.sin(particle.id) * 50],
                        opacity: [0, particle.opacity, particle.opacity, 0],
                        rotate: [0, 360],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        delay: particle.delay,
                        ease: 'linear',
                    }}
                />
            ))}

            {/* Subtle grid overlay */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(212, 175, 55, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212, 175, 55, 0.3) 1px, transparent 1px)
          `,
                    backgroundSize: '50px 50px',
                }}
            />
        </div>
    );
}
