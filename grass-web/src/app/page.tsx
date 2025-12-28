'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AtmosphericOpener from '@/components/AtmosphericOpener';
import RouteCardHorizontal from '@/components/RouteCardHorizontal';
import FilterBar, { FilterType, SortType } from '@/components/FilterBar';
import ThemeToggle from '@/components/ThemeToggle';
import {
  getRecommendations,
  getWeatherForLocation,
  summarizeWeather,
  getUserLocation,
  DEFAULT_LOCATION,
  DEFAULT_PREFERENCES
} from '@/lib/api';
import type { RouteCard as RouteCardType, UserPreferences, UserLocation } from '@/lib/types';
import { getScoreLevel } from '@/lib/types';

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

  // Filter and sort state
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeSort, setActiveSort] = useState<SortType>('score');

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

  // Filter and sort cards
  const filteredAndSortedCards = useMemo(() => {
    let result = [...cards];

    // Apply filter
    if (activeFilter !== 'all') {
      result = result.filter(card => {
        const tags = card.tags || [];
        const title = card.title.toLowerCase();
        const summary = card.summary.toLowerCase();

        switch (activeFilter) {
          case 'coastal':
            return tags.includes('coastal') || tags.includes('clifftop') || title.includes('coast') || title.includes('cliff');
          case 'woodland':
            return tags.includes('woodland') || tags.includes('forest') || title.includes('forest') || title.includes('wood');
          case 'riverside':
            return tags.includes('riverside') || tags.includes('thames-path') || title.includes('thames') || title.includes('river');
          case 'chalk':
            return tags.includes('chalk') || tags.includes('ridgey') || title.includes('downs') || summary.includes('chalk');
          default:
            return true;
        }
      });
    }

    // Apply sort
    switch (activeSort) {
      case 'score':
        result.sort((a, b) => b.today_fit - a.today_fit);
        break;
      case 'distance':
        result.sort((a, b) => (a.stats?.distance_km || 0) - (b.stats?.distance_km || 0));
        break;
      case 'duration':
        result.sort((a, b) => (a.stats?.duration_hours || 0) - (b.stats?.duration_hours || 0));
        break;
    }

    return result;
  }, [cards, activeFilter, activeSort]);

  // Calculate score counts
  const scoreCounts = useMemo(() => {
    return filteredAndSortedCards.reduce(
      (acc, card) => {
        const level = getScoreLevel(card.today_fit);
        acc[level]++;
        return acc;
      },
      { perfect: 0, good: 0, possible: 0 }
    );
  }, [filteredAndSortedCards]);

  const handleOpenerComplete = () => {
    setShowOpener(false);
  };

  return (
    <main className="min-h-screen gradient-atmospheric">
      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Atmospheric Opener */}
      <AnimatePresence>
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
      </AnimatePresence>

      {/* Loading state */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mb-6 mx-auto"
                 style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }} />
            <p className="text-lg" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
              Finding today&apos;s walks...
            </p>
          </motion.div>
        </div>
      )}

      {/* Main content */}
      {!showOpener && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto px-4 py-8 md:px-6 md:py-12"
        >
          {/* Header */}
          <header className="mb-8 md:mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-baseline gap-4 mb-4"
            >
              <h1
                className="editorial-headline"
                style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)' }}
              >
                Grass
              </h1>
              <span
                className="text-lg font-medium"
                style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
              >
                London Walks
              </span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="editorial-subhead max-w-xl"
            >
              {weatherSummary.headline} {weatherSummary.subline}
            </motion.p>
          </header>

          {/* Control Panel / Filter Bar */}
          <FilterBar
            activeFilter={activeFilter}
            activeSort={activeSort}
            onFilterChange={setActiveFilter}
            onSortChange={setActiveSort}
            routeCount={filteredAndSortedCards.length}
            perfectCount={scoreCounts.perfect}
            goodCount={scoreCounts.good}
            possibleCount={scoreCounts.possible}
          />

          {/* Error state */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl mb-8 text-center"
              style={{
                background: 'rgba(184, 115, 51, 0.1)',
                border: '1px solid rgba(184, 115, 51, 0.2)'
              }}
            >
              <p className="mb-4" style={{ color: 'var(--score-possible)' }}>{error}</p>
              <button
                onClick={fetchData}
                className="px-6 py-2.5 rounded-lg font-medium transition-all hover:scale-105"
                style={{
                  background: 'var(--accent-gold)',
                  color: 'var(--bg-primary)'
                }}
              >
                Try Again
              </button>
            </motion.div>
          )}

          {/* Route cards - Horizontal layout */}
          {filteredAndSortedCards.length > 0 && (
            <div className="space-y-6">
              {filteredAndSortedCards.map((card, index) => (
                <RouteCardHorizontal
                  key={card.route_id}
                  card={card}
                  index={index}
                  weatherCondition={weatherSummary.condition}
                  wind={weatherSummary.wind}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!error && filteredAndSortedCards.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div
                className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ background: 'var(--bg-secondary)' }}
              >
                <span className="text-2xl">◈</span>
              </div>
              <p
                className="text-xl mb-3"
                style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}
              >
                {activeFilter !== 'all'
                  ? `No ${activeFilter} walks match today's conditions`
                  : "No walks match today's conditions"
                }
              </p>
              <p style={{ color: 'var(--text-muted)' }}>
                {activeFilter !== 'all'
                  ? 'Try a different filter or check back later'
                  : 'Try adjusting your preferences or check back later'
                }
              </p>
              {activeFilter !== 'all' && (
                <button
                  onClick={() => setActiveFilter('all')}
                  className="mt-6 px-5 py-2 rounded-lg font-medium transition-all"
                  style={{
                    background: 'var(--bg-card)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  Show all walks
                </button>
              )}
            </motion.div>
          )}

          {/* Footer */}
          <footer
            className="mt-20 pt-8 text-center"
            style={{ borderTop: '1px solid var(--border-light)' }}
          >
            <p
              className="text-sm mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Curated walks for Londoners
            </p>
            <p
              className="text-xs"
              style={{ color: 'var(--text-muted)', opacity: 0.7 }}
            >
              Weather-aware recommendations updated in real-time
            </p>
          </footer>
        </motion.div>
      )}
    </main>
  );
}
