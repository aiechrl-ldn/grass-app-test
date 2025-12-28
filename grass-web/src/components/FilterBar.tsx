'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type FilterType = 'all' | 'coastal' | 'woodland' | 'riverside' | 'chalk';
export type SortType = 'score' | 'distance' | 'duration';

interface FilterBarProps {
  activeFilter: FilterType;
  activeSort: SortType;
  onFilterChange: (filter: FilterType) => void;
  onSortChange: (sort: SortType) => void;
  routeCount: number;
  perfectCount: number;
  goodCount: number;
  possibleCount: number;
}

const filterOptions: { value: FilterType; label: string; icon: string }[] = [
  { value: 'all', label: 'All walks', icon: '◈' },
  { value: 'coastal', label: 'Coastal', icon: '◊' },
  { value: 'woodland', label: 'Woodland', icon: '⬡' },
  { value: 'riverside', label: 'Riverside', icon: '∿' },
  { value: 'chalk', label: 'Chalk Downs', icon: '△' },
];

const sortOptions: { value: SortType; label: string }[] = [
  { value: 'score', label: 'Today-fit score' },
  { value: 'distance', label: 'Distance' },
  { value: 'duration', label: 'Duration' },
];

export default function FilterBar({
  activeFilter,
  activeSort,
  onFilterChange,
  onSortChange,
  routeCount,
  perfectCount,
  goodCount,
  possibleCount,
}: FilterBarProps) {
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="control-panel mb-8"
    >
      {/* Score Summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="score-dot score-dot-perfect" />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {perfectCount} perfect
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="score-dot score-dot-good" />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {goodCount} good
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="score-dot score-dot-possible" />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {possibleCount} possible
            </span>
          </div>
        </div>

        <span className="editorial-label">
          {routeCount} walks for today
        </span>
      </div>

      {/* Filters and Sort */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              className={`filter-chip ${activeFilter === option.value ? 'active' : ''}`}
            >
              <span className="opacity-70">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-secondary)',
            }}
          >
            <span className="text-sm font-medium">Sort by:</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--accent-gold)' }}>
              {sortOptions.find((s) => s.value === activeSort)?.label}
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={`transition-transform ${showSortDropdown ? 'rotate-180' : ''}`}
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <AnimatePresence>
            {showSortDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute right-0 top-full mt-2 py-2 rounded-lg z-50"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-elevated)',
                  minWidth: '180px',
                }}
              >
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSortChange(option.value);
                      setShowSortDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm transition-colors"
                    style={{
                      color: activeSort === option.value ? 'var(--accent-gold)' : 'var(--text-secondary)',
                      background: activeSort === option.value ? 'var(--bg-overlay)' : 'transparent',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Sorting Visualization */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 pt-4"
        style={{ borderTop: '1px solid var(--border-light)' }}
      >
        <SortingVisualization
          sort={activeSort}
          perfectCount={perfectCount}
          goodCount={goodCount}
          possibleCount={possibleCount}
        />
      </motion.div>
    </motion.div>
  );
}

// Sorting visualization component
function SortingVisualization({
  sort,
  perfectCount,
  goodCount,
  possibleCount,
}: {
  sort: SortType;
  perfectCount: number;
  goodCount: number;
  possibleCount: number;
}) {
  const total = perfectCount + goodCount + possibleCount;

  if (sort === 'score') {
    const perfectWidth = total > 0 ? (perfectCount / total) * 100 : 0;
    const goodWidth = total > 0 ? (goodCount / total) * 100 : 0;
    const possibleWidth = total > 0 ? (possibleCount / total) * 100 : 0;

    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Sorted by fit
        </span>
        <div className="flex-1 flex h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-overlay)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${perfectWidth}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ background: 'var(--score-perfect)' }}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goodWidth}%` }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            style={{ background: 'var(--score-good)' }}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${possibleWidth}%` }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
            style={{ background: 'var(--score-possible)' }}
          />
        </div>
      </div>
    );
  }

  if (sort === 'distance') {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Shortest to longest
        </span>
        <div className="flex-1 flex items-end gap-1 h-4">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${20 + i * 7}%` }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              className="flex-1 rounded-sm"
              style={{ background: 'var(--accent-sage)', opacity: 0.6 + i * 0.03 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (sort === 'duration') {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Quick to leisurely
        </span>
        <div className="flex-1 flex items-center gap-2">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="flex-1 h-2 rounded-full"
              style={{
                background: `linear-gradient(90deg, var(--accent-gold), var(--accent-earth))`,
                opacity: 0.4 + i * 0.15
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}
