'use client';

import { motion } from 'framer-motion';

interface JourneyDiagramProps {
  startStation: string;
  trailheadStation: string;
  bailoutStation?: string | null;
  travelTime: number; // in minutes
  walkDistance: number; // in km
  walkDuration: number; // in hours
}

export default function JourneyDiagram({
  startStation,
  trailheadStation,
  bailoutStation,
  travelTime,
  walkDistance,
  walkDuration,
}: JourneyDiagramProps) {
  return (
    <div className="py-6">
      {/* Journey Timeline */}
      <div className="relative">
        {/* Connecting line */}
        <div
          className="absolute left-6 top-6 bottom-6 w-0.5"
          style={{ background: 'var(--border-medium)' }}
        />

        {/* Start Station */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="relative flex items-start gap-4 mb-8"
        >
          <div className="relative z-10">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--accent-gold)',
                boxShadow: '0 0 0 4px var(--bg-card), 0 0 0 6px var(--accent-gold)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8" />
                <path d="M12 8v8" />
              </svg>
            </div>
          </div>

          <div className="flex-1 pt-2">
            <p className="editorial-label mb-1">Depart from</p>
            <p
              className="text-lg font-semibold"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
            >
              {startStation}
            </p>
          </div>
        </motion.div>

        {/* Train Journey */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative flex items-center gap-4 mb-8 pl-6"
        >
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
              <rect x="3" y="4" width="18" height="12" rx="2" />
              <path d="M7 20h10" />
              <path d="M9 16v4" />
              <path d="M15 16v4" />
              <circle cx="7" cy="10" r="1" fill="currentColor" />
              <circle cx="17" cy="10" r="1" fill="currentColor" />
            </svg>
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {travelTime} min by train
            </span>
          </div>
        </motion.div>

        {/* Trailhead Station */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="relative flex items-start gap-4 mb-8"
        >
          <div className="relative z-10">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--score-perfect)',
                boxShadow: '0 0 0 4px var(--bg-card), 0 0 0 6px var(--score-perfect)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9,22 9,12 15,12 15,22" />
              </svg>
            </div>
          </div>

          <div className="flex-1 pt-2">
            <p className="editorial-label mb-1">Start walking at</p>
            <p
              className="text-lg font-semibold"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
            >
              {trailheadStation}
            </p>
          </div>
        </motion.div>

        {/* Walk Journey */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative flex items-center gap-4 mb-8 pl-6"
        >
          <div
            className="flex items-center gap-3 px-4 py-2 rounded-full"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-sage)' }}>
              <path d="M13 4v16" />
              <path d="M17 8l-4-4-4 4" />
              <path d="M7 12h10" />
              <path d="M7 20c4-4 6-4 10 0" />
            </svg>
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {walkDistance} km walk
            </span>
            <span style={{ color: 'var(--border-medium)' }}>·</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {formatDuration(walkDuration)}
            </span>
          </div>
        </motion.div>

        {/* Bailout Station (if exists) */}
        {bailoutStation && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="relative flex items-start gap-4"
          >
            <div className="relative z-10">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center border-2"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--score-possible)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--score-possible)' }}>
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16,17 21,12 16,7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
            </div>

            <div className="flex-1 pt-2">
              <p className="editorial-label mb-1">Bail-out option</p>
              <p
                className="text-lg font-medium"
                style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}
              >
                {bailoutStation}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Exit early if needed
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) {
    return `${h} hours`;
  }
  return `${h}h ${m}m`;
}
