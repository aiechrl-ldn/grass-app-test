'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AtmosphericOpenerProps {
  headline: string;
  subline: string;
  routeCount: number;
  condition: 'dry' | 'light_rain' | 'rain' | 'heavy_rain';
  wind: 'calm' | 'breezy' | 'windy' | 'very_windy';
  onComplete: () => void;
  duration?: number;
}

export default function AtmosphericOpener({
  headline,
  subline,
  routeCount,
  condition,
  wind,
  onComplete,
  duration = 2500,
}: AtmosphericOpenerProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  // Click to dismiss
  const handleClick = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onClick={handleClick}
          className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
          style={{ background: 'var(--bg-primary)' }}
        >
          {/* Weather overlay effects */}
          <WeatherOverlayBackground condition={condition} wind={wind} />

          {/* Content */}
          <div className="relative z-10 text-center px-8 max-w-md">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-2xl md:text-3xl font-serif mb-4"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
            >
              {headline}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-lg md:text-xl mb-8"
              style={{ color: 'var(--text-secondary)' }}
            >
              {subline}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="text-base"
              style={{ color: 'var(--text-muted)' }}
            >
              {routeCount === 1 ? 'One walk.' : `${routeCount} walks.`}
            </motion.p>

            {/* Subtle tap hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="absolute bottom-8 left-0 right-0 text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              tap anywhere
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Weather background effects
function WeatherOverlayBackground({
  condition,
  wind,
}: {
  condition: 'dry' | 'light_rain' | 'rain' | 'heavy_rain';
  wind: 'calm' | 'breezy' | 'windy' | 'very_windy';
}) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Rain effect */}
      {(condition === 'light_rain' || condition === 'rain' || condition === 'heavy_rain') && (
        <RainEffect intensity={condition === 'heavy_rain' ? 'heavy' : condition === 'rain' ? 'medium' : 'light'} />
      )}

      {/* Mist effect for calm/dry conditions */}
      {condition === 'dry' && wind === 'calm' && <MistEffect />}

      {/* Sun effect for dry conditions */}
      {condition === 'dry' && <SunEffect />}

      {/* Wind streaks for windy conditions */}
      {(wind === 'windy' || wind === 'very_windy') && <WindEffect intensity={wind === 'very_windy' ? 'strong' : 'moderate'} />}
    </div>
  );
}

function RainEffect({ intensity }: { intensity: 'light' | 'medium' | 'heavy' }) {
  const dropCount = intensity === 'heavy' ? 50 : intensity === 'medium' ? 30 : 15;

  return (
    <>
      {Array.from({ length: dropCount }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-px bg-gradient-to-b from-transparent via-blue-300/30 to-transparent"
          style={{
            left: `${Math.random() * 100}%`,
            height: `${20 + Math.random() * 30}px`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${1 + Math.random() * 0.5}s`,
          }}
          initial={{ y: '-100%', opacity: 0 }}
          animate={{
            y: '100vh',
            opacity: [0, 0.6, 0.6, 0],
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

function MistEffect() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at ${30 + i * 25}% ${40 + i * 15}%, rgba(212, 220, 228, 0.15) 0%, transparent 60%)`,
          }}
          animate={{
            x: [-20, 20, -20],
            scale: [1, 1.05, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  );
}

function SunEffect() {
  return (
    <motion.div
      className="absolute -top-20 -right-20 w-80 h-80 rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(201, 162, 39, 0.15) 0%, transparent 70%)',
      }}
      animate={{
        scale: [1, 1.05, 1],
        opacity: [0.1, 0.2, 0.1],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

function WindEffect({ intensity }: { intensity: 'moderate' | 'strong' }) {
  const streakCount = intensity === 'strong' ? 8 : 4;

  return (
    <>
      {Array.from({ length: streakCount }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-px"
          style={{
            top: `${20 + Math.random() * 60}%`,
            width: `${50 + Math.random() * 100}px`,
            background: 'linear-gradient(90deg, transparent, rgba(180, 190, 200, 0.3), transparent)',
          }}
          initial={{ x: '-100%', opacity: 0 }}
          animate={{
            x: '200vw',
            opacity: [0, 0.4, 0.4, 0],
          }}
          transition={{
            duration: 2 + Math.random(),
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'linear',
          }}
        />
      ))}
    </>
  );
}
