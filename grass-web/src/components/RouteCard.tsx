'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import WeatherOverlay from './WeatherOverlay';
import { RouteCard as RouteCardType, getScoreLevel, getScoreLabel, getRouteGlyph, glyphSymbols } from '@/lib/types';
import clsx from 'clsx';

interface RouteCardProps {
  card: RouteCardType;
  index: number;
  weatherCondition?: 'dry' | 'light_rain' | 'rain' | 'heavy_rain';
  wind?: 'calm' | 'breezy' | 'windy' | 'very_windy';
}

export default function RouteCard({
  card,
  index,
  weatherCondition = 'dry',
  wind = 'calm',
}: RouteCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const scoreLevel = getScoreLevel(card.today_fit);
  const scoreLabel = getScoreLabel(card.today_fit);

  // Extract tags from the route (approximated from summary)
  const isExposed = card.summary.toLowerCase().includes('ridge') ||
                    card.summary.toLowerCase().includes('exposed') ||
                    card.summary.toLowerCase().includes('windy');

  // Get glyph based on common patterns
  const glyph = inferGlyph(card);

  // Format depart by time
  const departBy = formatDepartBy(card.depart_by_iso);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
    >
      <Link href={`/walk/${card.route_id}`}>
        <article className="card group cursor-pointer">
          {/* Hero Image with Weather Overlay */}
          <div className="relative h-48 md:h-56 overflow-hidden">
            {/* Placeholder */}
            <div
              className={clsx(
                'absolute inset-0 bg-gradient-to-br from-[#3d3a34] to-[#2d2a24] transition-opacity duration-500',
                imageLoaded ? 'opacity-0' : 'opacity-100'
              )}
            />

            {/* Image */}
            <Image
              src={card.hero_image_url}
              alt={card.title}
              fill
              className={clsx(
                'object-cover transition-all duration-700',
                'group-hover:scale-105',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

            {/* Weather overlay */}
            <WeatherOverlay
              condition={weatherCondition}
              wind={wind}
              isExposed={isExposed}
            />

            {/* Gradient overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1f1a]/80 via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="p-5 md:p-6">
            {/* Title row with glyph and score */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="text-lg"
                  style={{ color: 'var(--accent-gold)' }}
                  aria-hidden="true"
                >
                  {glyph}
                </span>
                <h2
                  className="text-xl md:text-2xl font-serif font-bold"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {card.title}
                </h2>
              </div>

              {/* Score badge */}
              <span
                className={clsx(
                  'flex-shrink-0 px-3 py-1.5 rounded-md text-sm font-medium',
                  scoreLevel === 'perfect' && 'score-perfect',
                  scoreLevel === 'good' && 'score-good',
                  scoreLevel === 'possible' && 'score-possible'
                )}
              >
                {scoreLabel}
              </span>
            </div>

            {/* Tagline / Summary (truncated) */}
            <p
              className="text-base mb-4 line-clamp-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {extractTagline(card.summary)}
            </p>

            {/* Journey info */}
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {card.map.start_station}
                </span>
                <span>→</span>
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {card.map.trailhead_station}
                </span>
              </div>

              {/* Depart by time */}
              {departBy && (
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--score-possible)' }}
                >
                  Leave by {departBy}
                </span>
              )}
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}

// Helper to infer glyph from card data
function inferGlyph(card: RouteCardType): string {
  const titleLower = card.title.toLowerCase();
  const summaryLower = card.summary.toLowerCase();

  // Coastal
  if (titleLower.includes('coast') || titleLower.includes('cliff') || titleLower.includes('sisters') || titleLower.includes('haven')) {
    return glyphSymbols['cliff'];
  }
  // Chalk downs
  if (titleLower.includes('downs') || titleLower.includes('beacon') || titleLower.includes('hill')) {
    return glyphSymbols['chalk-horse'];
  }
  // Riverside
  if (titleLower.includes('thames') || titleLower.includes('river') || titleLower.includes('lea') || titleLower.includes('lee')) {
    return glyphSymbols['river'];
  }
  // Woodland
  if (titleLower.includes('forest') || titleLower.includes('wood') || summaryLower.includes('woodland')) {
    return glyphSymbols['oak-leaf'];
  }
  // Easy/accessible
  if (summaryLower.includes('easy') || summaryLower.includes('gentle') || summaryLower.includes('flat')) {
    return glyphSymbols['hare'];
  }
  // Historic
  if (titleLower.includes('roman') || titleLower.includes('abbey') || titleLower.includes('castle')) {
    return glyphSymbols['standing-stone'];
  }
  // Exposed/dramatic
  if (summaryLower.includes('exposed') || summaryLower.includes('ridge') || summaryLower.includes('dramatic')) {
    return glyphSymbols['raven'];
  }

  // Default
  return glyphSymbols['oak-leaf'];
}

// Extract a short tagline from the summary
function extractTagline(summary: string): string {
  // Take first sentence or first 80 chars
  const firstSentence = summary.split('.')[0];
  if (firstSentence.length <= 80) {
    return firstSentence + '.';
  }
  return firstSentence.slice(0, 77) + '...';
}

// Format depart by time
function formatDepartBy(isoString: string): string | null {
  try {
    const date = new Date(isoString);
    const now = new Date();

    // If more than 2 hours away, don't show urgency
    if (date.getTime() - now.getTime() > 2 * 60 * 60 * 1000) {
      return null;
    }

    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch {
    return null;
  }
}
