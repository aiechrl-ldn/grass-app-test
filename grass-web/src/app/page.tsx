'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import AtmosphericOpener from '@/components/AtmosphericOpener';
import RouteCard from '@/components/RouteCard';
import {
  getRecommendations,
  getWeatherForLocation,
  summarizeWeather,
  getUserLocation,
  DEFAULT_LOCATION,
  DEFAULT_PREFERENCES
} from '@/lib/api';
import type { RouteCard as RouteCardType, UserPreferences, UserLocation } from '@/lib/types';

export default function Home() {
  const [showOpener, setShowOpener] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cards, setCards] = useState<RouteCardType[]>([]);
  const [weatherSummary, setWeatherSummary] = useState<{
    headline: string;
    subline: string;
    condition: 'dry' | 'light_rain' | 'rain' | 'heavy_rain';
    wind: 'calm' | 'breezy' | 'windy' | 'very_windy';
  }>({
    headline: 'Checking conditions...',
    subline: '',
    condition: 'dry',
    wind: 'calm',
  });

  const [, setUserLocation] = useState<UserLocation>(DEFAULT_LOCATION);
  const [preferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  // Fetch weather and recommendations
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get user location
      const location = await getUserLocation();
      setUserLocation(location);

      // Fetch weather for opener
      const weather = await getWeatherForLocation(location.lat, location.lon);
      const summary = summarizeWeather(weather);
      setWeatherSummary(summary);

      // Fetch route recommendations
      const response = await getRecommendations(location, preferences);
      setCards(response.cards);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Unable to load recommendations. Please try again.');

      // Set default weather for opener even on error
      setWeatherSummary({
        headline: 'Good walking weather.',
        subline: 'Three walks available.',
        condition: 'dry',
        wind: 'calm',
      });
    } finally {
      setIsLoading(false);
    }
  }, [preferences]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenerComplete = () => {
    setShowOpener(false);
  };

  return (
    <main className="min-h-screen gradient-atmospheric">
      {/* Atmospheric Opener */}
      {showOpener && !isLoading && (
        <AtmosphericOpener
          headline={weatherSummary.headline}
          subline={weatherSummary.subline}
          routeCount={cards.length || 3}
          condition={weatherSummary.condition}
          wind={weatherSummary.wind}
          onComplete={handleOpenerComplete}
          duration={2500}
        />
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4 mx-auto"
                 style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }} />
            <p style={{ color: 'var(--text-muted)' }}>Finding today&apos;s walks...</p>
          </motion.div>
        </div>
      )}

      {/* Main content */}
      {!showOpener && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto px-4 py-8 md:px-6 md:py-12"
        >
          {/* Header */}
          <header className="mb-8 md:mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold mb-3"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              Grass
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              {weatherSummary.headline} {weatherSummary.subline}
            </motion.p>
          </header>

          {/* Error state */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-lg mb-8 text-center"
              style={{ background: 'rgba(212, 118, 61, 0.15)', border: '1px solid rgba(212, 118, 61, 0.3)' }}
            >
              <p style={{ color: 'var(--score-possible)' }}>{error}</p>
              <button
                onClick={fetchData}
                className="mt-4 px-6 py-2 rounded-lg font-medium transition-colors"
                style={{
                  background: 'var(--accent-gold)',
                  color: 'var(--bg-primary)'
                }}
              >
                Try Again
              </button>
            </motion.div>
          )}

          {/* Route cards */}
          {cards.length > 0 && (
            <div className="space-y-6 md:space-y-8">
              {cards.slice(0, 3).map((card, index) => (
                <RouteCard
                  key={card.route_id}
                  card={card}
                  index={index}
                  weatherCondition={weatherSummary.condition}
                  wind={weatherSummary.wind}
                />
              ))}

              {/* Show more button */}
              {cards.length > 3 && (
                <ShowMoreSection
                  cards={cards.slice(3)}
                  weatherCondition={weatherSummary.condition}
                  wind={weatherSummary.wind}
                />
              )}
            </div>
          )}

          {/* Empty state */}
          {!error && cards.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-xl mb-2" style={{ color: 'var(--text-secondary)' }}>
                No walks match today&apos;s conditions
              </p>
              <p style={{ color: 'var(--text-muted)' }}>
                Try adjusting your preferences or check back later
              </p>
            </motion.div>
          )}

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t text-center" style={{ borderColor: 'var(--border-subtle)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Curated walks for Londoners · Weather-aware recommendations
            </p>
          </footer>
        </motion.div>
      )}
    </main>
  );
}

// Show more section component
function ShowMoreSection({
  cards,
  weatherCondition,
  wind
}: {
  cards: RouteCardType[];
  weatherCondition: 'dry' | 'light_rain' | 'rain' | 'heavy_rain';
  wind: 'calm' | 'breezy' | 'windy' | 'very_windy';
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {!expanded && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setExpanded(true)}
          className="w-full py-4 rounded-lg text-center font-medium transition-all hover:scale-[1.02]"
          style={{
            background: 'var(--bg-card)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          Show {cards.length} more {cards.length === 1 ? 'walk' : 'walks'}
        </motion.button>
      )}

      {expanded && cards.map((card, index) => (
        <RouteCard
          key={card.route_id}
          card={card}
          index={index + 3}
          weatherCondition={weatherCondition}
          wind={wind}
        />
      ))}
    </>
  );
}
