'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import WeatherOverlay from './WeatherOverlay';
import { RouteCard as RouteCardType, getScoreLevel, getScoreLabel, glyphSymbols } from '@/lib/types';

interface RouteCardHorizontalProps {
  card: RouteCardType;
  index: number;
  weatherCondition?: 'dry' | 'light_rain' | 'rain' | 'heavy_rain';
  wind?: 'calm' | 'breezy' | 'windy' | 'very_windy';
}

export default function RouteCardHorizontal({
  card,
  index,
  weatherCondition = 'dry',
  wind = 'calm',
}: RouteCardHorizontalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const scoreLevel = getScoreLevel(card.today_fit);
  const scoreLabel = getScoreLabel(card.today_fit);

  // Extract tags from the route
  const isExposed = card.summary.toLowerCase().includes('ridge') ||
                    card.summary.toLowerCase().includes('exposed') ||
                    card.summary.toLowerCase().includes('windy');

  // Get glyph based on common patterns
  const glyph = inferGlyph(card);

  // Format depart by time
  const departBy = formatDepartBy(card.depart_by_iso);

  // Format distance and duration
  const formattedDistance = `${card.stats?.distance_km?.toFixed(1) || '—'} km`;
  const formattedDuration = formatDuration(card.stats?.duration_hours || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Link href={`/walk/${card.route_id}`}>
        <article className="card card-horizontal group cursor-pointer">
          {/* Image Section */}
          <div className="card-image relative">
            {/* Placeholder */}
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}
              style={{ background: 'linear-gradient(135deg, var(--bg-secondary), var(--accent-sage))' }}
            />

            {/* Image */}
            <Image
              src={card.hero_image_url}
              alt={card.title}
              fill
              className={`object-cover transition-all duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              sizes="(max-width: 768px) 100vw, 280px"
            />

            {/* Weather overlay */}
            <WeatherOverlay
              condition={weatherCondition}
              wind={wind}
              isExposed={isExposed}
            />

            {/* Score badge - overlaid on image */}
            <div className="absolute top-3 left-3">
              <span
                className={`px-3 py-1.5 rounded-md text-sm font-semibold backdrop-blur-sm ${
                  scoreLevel === 'perfect' ? 'score-perfect' :
                  scoreLevel === 'good' ? 'score-good' : 'score-possible'
                }`}
                style={{ background: 'rgba(255, 255, 255, 0.9)' }}
              >
                {scoreLabel}
              </span>
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/20" />
          </div>

          {/* Content Section */}
          <div className="card-content">
            {/* Top row: Title and glyph */}
            <div>
              <div className="flex items-start gap-2 mb-2">
                <span
                  className="text-xl flex-shrink-0"
                  style={{ color: 'var(--accent-gold)' }}
                  aria-hidden="true"
                >
                  {glyph}
                </span>
                <h2
                  className="text-xl md:text-2xl leading-tight"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                  }}
                >
                  {card.title}
                </h2>
              </div>

              {/* Region tag */}
              <span
                className="inline-block text-xs font-medium px-2 py-1 rounded mb-3"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-muted)',
                }}
              >
                {card.region}
              </span>

              {/* Summary */}
              <p
                className="text-sm line-clamp-2 mb-4"
                style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}
              >
                {extractTagline(card.summary)}
              </p>
            </div>

            {/* Bottom row: Stats and journey */}
            <div className="flex items-end justify-between">
              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-sage)' }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {formattedDistance}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-sage)' }}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {formattedDuration}
                  </span>
                </div>

                {card.stats?.elevation_gain_m && (
                  <div className="flex items-center gap-1.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-sage)' }}>
                      <path d="M8 18l4-12 4 12" />
                      <path d="M9 14h6" />
                    </svg>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {card.stats.elevation_gain_m}m
                    </span>
                  </div>
                )}
              </div>

              {/* Journey info */}
              <div className="flex flex-col items-end gap-1">
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {card.map.start_station}
                  </span>
                  <span style={{ color: 'var(--accent-gold)' }}>→</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {card.map.trailhead_station}
                  </span>
                </div>

                {/* Depart by time */}
                {departBy && (
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded"
                    style={{
                      background: 'rgba(184, 115, 51, 0.1)',
                      color: 'var(--score-possible)',
                    }}
                  >
                    Leave by {departBy}
                  </span>
                )}
              </div>
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
  if (titleLower.includes('coast') || titleLower.includes('cliff') || titleLower.includes('sisters') || titleLower.includes('haven') || titleLower.includes('white cliffs')) {
    return glyphSymbols['cliff'];
  }
  // Chalk downs
  if (titleLower.includes('downs') || titleLower.includes('beacon') || titleLower.includes('hill') || titleLower.includes('ditchling')) {
    return glyphSymbols['chalk-horse'];
  }
  // Riverside
  if (titleLower.includes('thames') || titleLower.includes('river') || titleLower.includes('lea') || titleLower.includes('lee') || titleLower.includes('valley')) {
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
  if (titleLower.includes('roman') || titleLower.includes('abbey') || titleLower.includes('castle') || titleLower.includes('saxon')) {
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
  // Take first two sentences or first 120 chars
  const sentences = summary.split('.');
  if (sentences.length >= 2) {
    const combined = sentences[0] + '.' + sentences[1] + '.';
    if (combined.length <= 140) {
      return combined;
    }
  }
  const firstSentence = sentences[0];
  if (firstSentence.length <= 120) {
    return firstSentence + '.';
  }
  return firstSentence.slice(0, 117) + '...';
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

// Format duration
function formatDuration(hours: number): string {
  if (hours === 0) return '—';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
