'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { decodePolyline, getPolylineCenter, getPolylineBounds, getZoomForBounds } from '@/lib/polyline';
import { getScoreLevel, getScoreLabel, getRouteGlyph, glyphSymbols } from '@/lib/types';
import type { RouteCard } from '@/lib/types';
import clsx from 'clsx';

// For demo, we'll fetch from backend or use static data
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4 mx-auto"
               style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading walk details...</p>
        </div>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p className="text-xl mb-4" style={{ color: 'var(--text-secondary)' }}>{error || 'Route not found'}</p>
          <Link href="/" className="px-6 py-3 rounded-lg font-medium" style={{ background: 'var(--accent-gold)', color: 'var(--bg-primary)' }}>
            Back to walks
          </Link>
        </div>
      </div>
    );
  }

  const scoreLevel = getScoreLevel(route.today_fit);
  const scoreLabel = getScoreLabel(route.today_fit);
  const coordinates = decodePolyline(route.map.polyline);
  const center = getPolylineCenter(coordinates);
  const bounds = getPolylineBounds(coordinates);
  const zoom = bounds ? getZoomForBounds(bounds, 600, 300) : 13;

  // Static map URL (using OpenStreetMap tiles via a simple embedding approach)
  // For production, use Mapbox or Leaflet with proper API keys
  const staticMapUrl = center
    ? `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/pin-s+22c55e(${coordinates[0]?.lng},${coordinates[0]?.lat}),pin-s+ef4444(${coordinates[coordinates.length - 1]?.lng},${coordinates[coordinates.length - 1]?.lat})/${center.lng},${center.lat},${zoom - 1},0/600x300@2x?access_token=pk.placeholder`
    : null;

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Hero Image */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <div className={clsx(
          'absolute inset-0 bg-gradient-to-br from-[#3d3a34] to-[#2d2a24] transition-opacity duration-500',
          imageLoaded ? 'opacity-0' : 'opacity-100'
        )} />

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

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1f1a] via-[#1a1f1a]/50 to-transparent" />

        {/* Back button */}
        <Link
          href="/"
          className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:scale-105"
          style={{ background: 'rgba(26, 31, 26, 0.8)', color: 'var(--text-primary)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </Link>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto px-4 md:px-6 -mt-16 relative z-10"
      >
        {/* Title card */}
        <div className="p-6 md:p-8 rounded-xl mb-6" style={{ background: 'var(--bg-card)' }}>
          {/* Title and score */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl" style={{ color: 'var(--accent-gold)' }}>
                {inferGlyph(route)}
              </span>
              <h1
                className="text-2xl md:text-3xl font-bold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
              >
                {route.title}
              </h1>
            </div>
            <span className={clsx(
              'flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold',
              scoreLevel === 'perfect' && 'score-perfect',
              scoreLevel === 'good' && 'score-good',
              scoreLevel === 'possible' && 'score-possible'
            )}>
              {scoreLabel}
            </span>
          </div>

          {/* Why today section */}
          <div className="mb-6">
            <h2 className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
              Why today
            </h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              {route.summary}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4 py-4 border-y" style={{ borderColor: 'var(--border-subtle)' }}>
            <StatBox value={`${route.distance_km} km`} label="Distance" />
            <StatBox value={`${route.elevation_gain_m} m`} label="Elevation" />
            <StatBox value={formatDuration(route.duration_hours)} label="Duration" />
          </div>
        </div>

        {/* Journey section */}
        <div className="p-6 rounded-xl mb-6" style={{ background: 'var(--bg-card)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            The Journey
          </h2>

          {/* Station diagram */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full" style={{ background: 'var(--accent-gold)' }} />
              <div className="w-px h-8" style={{ background: 'var(--border-subtle)' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Depart from</p>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{route.map.start_station}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full" style={{ background: 'var(--score-perfect)' }} />
              <div className="w-px h-8" style={{ background: 'var(--border-subtle)' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Start walking at</p>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{route.map.trailhead_station}</p>
            </div>
          </div>

          {route.map.bailout_station && (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: 'var(--score-possible)' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Bail-out option</p>
                <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>{route.map.bailout_station}</p>
              </div>
            </div>
          )}

          {/* Get directions button */}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${route.map.trailhead_station}&travelmode=transit`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full mt-6 py-3 rounded-lg font-medium transition-all hover:scale-[1.02]"
            style={{ background: 'var(--accent-gold)', color: 'var(--bg-primary)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Get Directions
          </a>
        </div>

        {/* Map placeholder */}
        <div className="rounded-xl overflow-hidden mb-6" style={{ background: 'var(--bg-card)' }}>
          <div className="h-64 md:h-80 relative">
            {/* Static map or placeholder */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Route map: {route.distance_km}km
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {coordinates.length} waypoints
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Amenities */}
        {route.map.pois.length > 0 && (
          <div className="p-6 rounded-xl mb-6" style={{ background: 'var(--bg-card)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              Stops Along the Way
            </h2>

            <div className="space-y-3">
              {route.map.pois.map((poi, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(201, 162, 39, 0.2)' }}>
                    <svg className="w-5 h-5" style={{ color: 'var(--accent-gold)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{poi.name}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Pub / Café</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Start trip button */}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${route.map.trailhead_station}&travelmode=transit`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-semibold text-lg transition-all hover:scale-[1.02] mb-8"
          style={{ background: 'linear-gradient(135deg, var(--accent-gold) 0%, #8a6914 100%)', color: 'var(--bg-primary)' }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Start This Walk
        </a>
      </motion.div>
    </main>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</p>
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
    return `${h}h`;
  }
  return `${h}h ${m}m`;
}

function inferGlyph(card: RouteCard): string {
  const titleLower = card.title.toLowerCase();
  const summaryLower = card.summary.toLowerCase();

  if (titleLower.includes('coast') || titleLower.includes('cliff') || titleLower.includes('sisters') || titleLower.includes('haven') || titleLower.includes('white cliffs')) {
    return glyphSymbols['cliff'];
  }
  if (titleLower.includes('downs') || titleLower.includes('beacon') || titleLower.includes('hill')) {
    return glyphSymbols['chalk-horse'];
  }
  if (titleLower.includes('thames') || titleLower.includes('river') || titleLower.includes('lea') || titleLower.includes('lee')) {
    return glyphSymbols['river'];
  }
  if (titleLower.includes('forest') || titleLower.includes('wood') || summaryLower.includes('woodland')) {
    return glyphSymbols['oak-leaf'];
  }
  if (summaryLower.includes('easy') || summaryLower.includes('gentle') || summaryLower.includes('flat')) {
    return glyphSymbols['hare'];
  }
  if (titleLower.includes('roman') || titleLower.includes('abbey') || titleLower.includes('castle')) {
    return glyphSymbols['standing-stone'];
  }
  if (summaryLower.includes('exposed') || summaryLower.includes('ridge') || summaryLower.includes('dramatic')) {
    return glyphSymbols['raven'];
  }

  return glyphSymbols['oak-leaf'];
}
