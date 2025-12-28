'use client';

import { motion } from 'framer-motion';

interface WeatherOverlayProps {
  condition: 'dry' | 'light_rain' | 'rain' | 'heavy_rain';
  wind?: 'calm' | 'breezy' | 'windy' | 'very_windy';
  isExposed?: boolean;
  className?: string;
}

export default function WeatherOverlay({
  condition,
  wind = 'calm',
  isExposed = false,
  className = '',
}: WeatherOverlayProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Rain effect */}
      {condition !== 'dry' && (
        <RainOverlay
          intensity={
            condition === 'heavy_rain' ? 'heavy' : condition === 'rain' ? 'medium' : 'light'
          }
        />
      )}

      {/* Sun glow for dry conditions */}
      {condition === 'dry' && <SunGlow />}

      {/* Wind streaks for exposed routes */}
      {isExposed && (wind === 'windy' || wind === 'very_windy') && (
        <WindStreaks intensity={wind === 'very_windy' ? 'strong' : 'moderate'} />
      )}

      {/* Mist for calm/misty conditions */}
      {condition === 'dry' && wind === 'calm' && <MistLayer />}
    </div>
  );
}

function RainOverlay({ intensity }: { intensity: 'light' | 'medium' | 'heavy' }) {
  const count = intensity === 'heavy' ? 20 : intensity === 'medium' ? 12 : 6;
  const opacity = intensity === 'heavy' ? 0.4 : intensity === 'medium' ? 0.25 : 0.15;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-px"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10%',
            height: `${15 + Math.random() * 20}px`,
            background: `linear-gradient(180deg, transparent, rgba(180, 200, 220, ${opacity}), transparent)`,
            transform: 'rotate(15deg)',
          }}
          animate={{
            y: ['0%', '120%'],
            opacity: [0, opacity, opacity, 0],
          }}
          transition={{
            duration: 0.8 + Math.random() * 0.4,
            repeat: Infinity,
            delay: Math.random() * 1.5,
            ease: 'linear',
          }}
        />
      ))}
    </>
  );
}

function SunGlow() {
  return (
    <motion.div
      className="absolute -top-10 -right-10 w-32 h-32 rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(201, 162, 39, 0.2) 0%, transparent 70%)',
      }}
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.15, 0.25, 0.15],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

function WindStreaks({ intensity }: { intensity: 'moderate' | 'strong' }) {
  const count = intensity === 'strong' ? 4 : 2;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-px"
          style={{
            top: `${30 + i * 20}%`,
            left: '-20%',
            width: `${30 + Math.random() * 40}px`,
            background: 'linear-gradient(90deg, transparent, rgba(180, 190, 200, 0.25), transparent)',
          }}
          animate={{
            x: ['0%', '500%'],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 1.5 + Math.random() * 0.5,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'linear',
          }}
        />
      ))}
    </>
  );
}

function MistLayer() {
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(180deg, rgba(212, 220, 228, 0.08) 0%, transparent 50%, rgba(212, 220, 228, 0.05) 100%)',
      }}
      animate={{
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
