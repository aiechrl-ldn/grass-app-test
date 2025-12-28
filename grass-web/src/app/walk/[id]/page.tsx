'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { decodePolyline, getPolylineCenter, getPolylineBounds, getZoomForBounds } from '@/lib/polyline';
import { getScoreLevel, getScoreLabel, glyphSymbols } from '@/lib/types';
import type { RouteCard } from '@/lib/types';
import JourneyDiagram from '@/components/JourneyDiagram';
import ThemeToggle from '@/components/ThemeToggle';
import clsx from 'clsx';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://grass-app-test--aiechrl-ldn.replit.app';

interface RouteDetailProps {
  params: Promise<{ id: string }>;
}

export default function RouteDetail({ params }: RouteDetailProps) {
  const { id } = use(params);
  const [route, setRoute] = useState<RouteCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    async function fetchRoute() {
      try {
        // Fetch recommendations and find the matching route
        const response = await fetch(`${API_BASE_URL}/recommendations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: { lat: 51.5074, lon: -0.1278 },
            prefs: { max_travel_minutes: 150, wind_tolerance: 'high', rain_tolerance_mm_per_hr: 2.0, needs_pub: false }
          })
        });

        if (!response.ok) throw new Error('Failed to fetch routes');

        const data = await response.json();
        const found = data.cards.find((c: RouteCard) => c.route_id === id);

        if (found) {
          setRoute(found);
        } else {
          setError('Route not found');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Unable to load route details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchRoute();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-atmospheric">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mb-6 mx-auto"
               style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }} />
          <p className="text-lg" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            Loading walk details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-atmospheric">
        <div className="text-center">
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <span className="text-3xl">◈</span>
          </div>
          <p
            className="text-xl mb-6"
            style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}
          >
            {error || 'Route not found'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all hover:scale-105"
            style={{ background: 'var(--accent-gold)', color: 'var(--bg-primary)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to walks
          </Link>
        </div>
      </div>
    );
  }

  const scoreLevel = getScoreLevel(route.today_fit);
  const scoreLabel = getScoreLabel(route.today_fit);
  const coordinates = decodePolyline(route.map.polyline);

  return (
    <main className="min-h-screen gradient-atmospheric">
      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Hero Image */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <div className={clsx(
          'absolute inset-0 transition-opacity duration-500',
          imageLoaded ? 'opacity-0' : 'opacity-100'
        )}
        style={{ background: 'linear-gradient(135deg, var(--bg-secondary), var(--accent-sage))' }}
        />

        <Image
          src={route.hero_image_url}
          alt={route.title}
          fill
          className={clsx(
            'object-cover transition-opacity duration-700',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          priority
        />

        {/* Gradient overlay for light theme */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent" />

        {/* Back button */}
        <Link
          href="/"
          className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:scale-105"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </Link>

        {/* Score badge on image */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6">
          <span className={clsx(
            'px-4 py-2 rounded-lg text-sm font-semibold backdrop-blur-sm',
            scoreLevel === 'perfect' && 'score-perfect',
            scoreLevel === 'good' && 'score-good',
            scoreLevel === 'possible' && 'score-possible'
          )} style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
            {scoreLabel}
          </span>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto px-4 md:px-6 -mt-20 relative z-10"
      >
        {/* Title card */}
        <div
          className="p-6 md:p-8 rounded-xl mb-6"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
        >
          {/* Title and glyph */}
          <div className="flex items-start gap-3 mb-4">
            <span className="text-3xl" style={{ color: 'var(--accent-gold)' }}>
              {inferGlyph(route)}
            </span>
            <div>
              <h1
                className="text-2xl md:text-3xl leading-tight mb-2"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontWeight: 700 }}
              >
                {route.title}
              </h1>
              <span
                className="inline-block text-sm font-medium px-2 py-1 rounded"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
              >
                {route.region}
              </span>
            </div>
          </div>

          {/* Why today section */}
          <div className="mb-6">
            <h2 className="editorial-label mb-2">Why today</h2>
            <p
              className="text-lg leading-relaxed"
              style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
            >
              {route.summary}
            </p>
          </div>

          {/* Stats grid */}
          <div
            className="grid grid-cols-3 gap-4 py-5"
            style={{ borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}
          >
            <StatBox
              value={`${route.distance_km}`}
              unit="km"
              label="Distance"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              }
            />
            <StatBox
              value={`${route.elevation_gain_m}`}
              unit="m"
              label="Elevation"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 18l4-12 4 12" />
                  <path d="M9 14h6" />
                </svg>
              }
            />
            <StatBox
              value={formatDurationValue(route.duration_hours)}
              unit={route.duration_hours >= 1 ? 'hrs' : 'min'}
              label="Duration"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Journey section */}
        <div
          className="p-6 md:p-8 rounded-xl mb-6"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
        >
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
          >
            The Journey
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Your complete route from London
          </p>

          {/* Journey Diagram */}
          <JourneyDiagram
            startStation={route.map.start_station}
            trailheadStation={route.map.trailhead_station}
            bailoutStation={route.map.bailout_station}
            travelTime={route.stats?.travel_minutes || 60}
            walkDistance={route.distance_km}
            walkDuration={route.duration_hours}
          />

          {/* Get directions button */}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(route.map.trailhead_station)}&travelmode=transit`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full mt-4 py-3.5 rounded-lg font-medium transition-all hover:scale-[1.02]"
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-light)'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            View in Google Maps
          </a>
        </div>

        {/* Map placeholder */}
        <div
          className="rounded-xl overflow-hidden mb-6"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="h-64 md:h-80 relative">
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <div className="text-center">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--bg-card)' }}
                >
                  <svg className="w-8 h-8" style={{ color: 'var(--accent-sage)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {route.distance_km} km route
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {coordinates.length} waypoints encoded
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Amenities */}
        {route.map.pois.length > 0 && (
          <div
            className="p-6 md:p-8 rounded-xl mb-6"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
          >
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
            >
              Stops Along the Way
            </h2>

            <div className="space-y-3">
              {route.map.pois.map((poi, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center gap-4 p-4 rounded-lg"
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--bg-card)' }}
                  >
                    <svg className="w-6 h-6" style={{ color: 'var(--accent-gold)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{poi.name}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Pub / Cafe</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Start trip button */}
        <motion.a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(route.map.trailhead_station)}&travelmode=transit`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-semibold text-lg transition-all hover:scale-[1.02] mb-12"
          style={{
            background: 'linear-gradient(135deg, var(--accent-gold) 0%, #b8922a 100%)',
            color: 'white',
            boxShadow: '0 4px 20px rgba(201, 162, 39, 0.3)'
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Start This Walk
        </motion.a>
      </motion.div>
    </main>
  );
}

function StatBox({
  value,
  unit,
  label,
  icon
}: {
  value: string;
  unit: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-1" style={{ color: 'var(--accent-sage)' }}>
        {icon}
      </div>
      <p className="flex items-baseline justify-center gap-1">
        <span className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{unit}</span>
      </p>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
}

function formatDurationValue(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) {
    return `${h}`;
  }
  return `${h}.${Math.round(m / 6)}`;
}

function inferGlyph(card: RouteCard): string {
  const titleLower = card.title.toLowerCase();
  const summaryLower = card.summary.toLowerCase();

  if (titleLower.includes('coast') || titleLower.includes('cliff') || titleLower.includes('sisters') || titleLower.includes('haven') || titleLower.includes('white cliffs')) {
    return glyphSymbols['cliff'];
  }
  if (titleLower.includes('downs') || titleLower.includes('beacon') || titleLower.includes('hill') || titleLower.includes('ditchling')) {
    return glyphSymbols['chalk-horse'];
  }
  if (titleLower.includes('thames') || titleLower.includes('river') || titleLower.includes('lea') || titleLower.includes('lee') || titleLower.includes('valley')) {
    return glyphSymbols['river'];
  }
  if (titleLower.includes('forest') || titleLower.includes('wood') || summaryLower.includes('woodland')) {
    return glyphSymbols['oak-leaf'];
  }
  if (summaryLower.includes('easy') || summaryLower.includes('gentle') || summaryLower.includes('flat')) {
    return glyphSymbols['hare'];
  }
  if (titleLower.includes('roman') || titleLower.includes('abbey') || titleLower.includes('castle') || titleLower.includes('saxon')) {
    return glyphSymbols['standing-stone'];
  }
  if (summaryLower.includes('exposed') || summaryLower.includes('ridge') || summaryLower.includes('dramatic')) {
    return glyphSymbols['raven'];
  }

  return glyphSymbols['oak-leaf'];
}
