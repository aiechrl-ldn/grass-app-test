'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

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
    <div className={`weather-overlay ${className}`}>
      {/* Base weather gradient */}
      <WeatherGradient condition={condition} />

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

      {/* Mist layer */}
      {(condition === 'light_rain' || (condition === 'dry' && wind === 'calm')) && (
        <MistLayer intensity={condition === 'light_rain' ? 'moderate' : 'light'} />
      )}
    </div>
  );
}

function WeatherGradient({ condition }: { condition: 'dry' | 'light_rain' | 'rain' | 'heavy_rain' }) {
  const gradient = useMemo(() => {
    switch (condition) {
      case 'dry':
        return 'linear-gradient(135deg, rgba(201, 162, 39, 0.15) 0%, transparent 50%, rgba(201, 162, 39, 0.08) 100%)';
      case 'light_rain':
        return 'linear-gradient(180deg, rgba(140, 160, 180, 0.2) 0%, transparent 50%, rgba(140, 160, 180, 0.1) 100%)';
      case 'rain':
        return 'linear-gradient(180deg, rgba(100, 130, 160, 0.3) 0%, rgba(100, 130, 160, 0.1) 50%, transparent 100%)';
      case 'heavy_rain':
        return 'linear-gradient(180deg, rgba(80, 100, 130, 0.4) 0%, rgba(80, 100, 130, 0.2) 50%, rgba(80, 100, 130, 0.1) 100%)';
    }
  }, [condition]);

  return (
    <motion.div
      className="absolute inset-0"
      style={{ background: gradient }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    />
  );
}

function RainOverlay({ intensity }: { intensity: 'light' | 'medium' | 'heavy' }) {
  // More rain drops for visibility
  const count = intensity === 'heavy' ? 30 : intensity === 'medium' ? 18 : 10;
  const baseOpacity = intensity === 'heavy' ? 0.8 : intensity === 'medium' ? 0.6 : 0.4;

  // Generate consistent positions with useMemo
  const raindrops = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${(i * 7 + Math.sin(i) * 10) % 100}%`,
      height: intensity === 'heavy' ? `${25 + (i % 10)}px` : `${18 + (i % 8)}px`,
      delay: (i * 0.1) % 2,
      duration: intensity === 'heavy' ? 0.6 : intensity === 'medium' ? 0.8 : 1,
    }));
  }, [count, intensity]);

  return (
    <>
      {raindrops.map((drop) => (
        <motion.div
          key={drop.id}
          className={`rain-drop ${intensity === 'heavy' ? 'rain-drop-heavy' : ''}`}
          style={{
            left: drop.left,
            top: '-30px',
            height: drop.height,
          }}
          animate={{
            y: [0, 400],
            opacity: [0, baseOpacity, baseOpacity, 0],
          }}
          transition={{
            duration: drop.duration,
            repeat: Infinity,
            delay: drop.delay,
            ease: 'linear',
          }}
        />
      ))}

      {/* Rain splash effect at bottom */}
      {intensity !== 'light' && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-4"
          style={{
            background: `linear-gradient(to top, rgba(140, 160, 180, ${intensity === 'heavy' ? 0.3 : 0.15}), transparent)`,
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </>
  );
}

function SunGlow() {
  return (
    <>
      {/* Main sun glow */}
      <motion.div
        className="sun-overlay animate-sun"
      />

      {/* Light rays effect */}
      <motion.div
        className="absolute -top-20 -right-20 w-64 h-64"
        style={{
          background: `conic-gradient(
            from 0deg at 50% 50%,
            transparent 0deg,
            rgba(201, 162, 39, 0.15) 30deg,
            transparent 60deg,
            rgba(201, 162, 39, 0.1) 90deg,
            transparent 120deg,
            rgba(201, 162, 39, 0.12) 150deg,
            transparent 180deg,
            rgba(201, 162, 39, 0.08) 210deg,
            transparent 240deg,
            rgba(201, 162, 39, 0.15) 270deg,
            transparent 300deg,
            rgba(201, 162, 39, 0.1) 330deg,
            transparent 360deg
          )`,
          borderRadius: '50%',
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Warm corner glow */}
      <motion.div
        className="absolute top-0 right-0 w-40 h-40"
        style={{
          background: 'radial-gradient(circle at top right, rgba(201, 162, 39, 0.3) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </>
  );
}

function WindStreaks({ intensity }: { intensity: 'moderate' | 'strong' }) {
  const count = intensity === 'strong' ? 6 : 3;

  const streaks = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      top: `${15 + i * 15}%`,
      width: `${40 + (i % 3) * 20}px`,
      delay: i * 0.3,
      duration: intensity === 'strong' ? 1 : 1.5,
    }));
  }, [count, intensity]);

  return (
    <>
      {streaks.map((streak) => (
        <motion.div
          key={streak.id}
          className="wind-line"
          style={{
            top: streak.top,
            left: '-60px',
            width: streak.width,
          }}
          animate={{
            x: [0, 500],
            opacity: [0, 0.6, 0.6, 0],
            scaleX: [0.8, 1.2, 0.9],
          }}
          transition={{
            duration: streak.duration,
            repeat: Infinity,
            delay: streak.delay,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Wind gust indicator */}
      {intensity === 'strong' && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(160, 170, 180, 0.1) 50%, transparent 100%)',
          }}
          animate={{
            x: [-200, 200],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1,
            ease: 'easeInOut',
          }}
        />
      )}
    </>
  );
}

function MistLayer({ intensity }: { intensity: 'light' | 'moderate' }) {
  const opacity = intensity === 'moderate' ? 0.5 : 0.3;

  return (
    <>
      {/* Primary mist */}
      <motion.div
        className="mist-layer animate-mist"
        style={{ opacity }}
      />

      {/* Secondary drifting mist */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(
            ellipse 80% 50% at 30% 70%,
            rgba(180, 196, 204, ${opacity * 0.8}) 0%,
            transparent 70%
          )`,
        }}
        animate={{
          x: [-20, 20, -20],
          opacity: [opacity * 0.5, opacity, opacity * 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Third mist layer for depth */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(
            ellipse 60% 40% at 70% 50%,
            rgba(180, 196, 204, ${opacity * 0.6}) 0%,
            transparent 60%
          )`,
        }}
        animate={{
          x: [15, -15, 15],
          opacity: [opacity * 0.4, opacity * 0.8, opacity * 0.4],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />
    </>
  );
}
