// API client for Grass backend

import type {
  RecommendationsRequest,
  RecommendationsResponse,
  UserPreferences,
  UserLocation,
  WeatherData
} from './types';

// Backend URL - update for production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://grass-app-test--aiechrl-ldn.replit.app';

// Default London location
export const DEFAULT_LOCATION: UserLocation = {
  lat: 51.5074,
  lon: -0.1278,
};

// Default preferences
export const DEFAULT_PREFERENCES: UserPreferences = {
  max_travel_minutes: 90,
  wind_tolerance: 'moderate',
  rain_tolerance_mm_per_hr: 0.5,
  needs_pub: false,
};

/**
 * Fetch route recommendations from the backend
 */
export async function getRecommendations(
  location: UserLocation = DEFAULT_LOCATION,
  preferences: UserPreferences = DEFAULT_PREFERENCES,
  queryText?: string
): Promise<RecommendationsResponse> {
  const request: RecommendationsRequest = {
    user: {
      ...location,
      leave_after_iso: location.leave_after_iso || new Date().toISOString(),
    },
    prefs: preferences,
    query_text: queryText,
  };

  const response = await fetch(`${API_BASE_URL}/recommendations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<{ status: string; timestamp: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch weather data from Open-Meteo for a location
 * Used for the atmospheric opener
 */
export async function getWeatherForLocation(lat: number, lon: number): Promise<WeatherData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat.toString());
  url.searchParams.set('longitude', lon.toString());
  url.searchParams.set('hourly', 'temperature_2m,precipitation,precipitation_probability,wind_speed_10m');
  url.searchParams.set('forecast_hours', '12');
  url.searchParams.set('timezone', 'Europe/London');

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    hourly: data.hourly,
    latitude: data.latitude,
    longitude: data.longitude,
  };
}

/**
 * Generate a weather summary for the atmospheric opener
 */
export function summarizeWeather(weather: WeatherData): {
  headline: string;
  subline: string;
  condition: 'dry' | 'light_rain' | 'rain' | 'heavy_rain';
  wind: 'calm' | 'breezy' | 'windy' | 'very_windy';
} {
  const { hourly } = weather;

  // Analyze next 6 hours
  const precipProb = hourly.precipitation_probability?.slice(0, 6) || [];
  const precip = hourly.precipitation?.slice(0, 6) || [];
  const winds = hourly.wind_speed_10m?.slice(0, 6) || [];
  const temps = hourly.temperature_2m?.slice(0, 6) || [];

  const maxPrecipProb = Math.max(...precipProb, 0);
  const totalPrecip = precip.reduce((a, b) => a + b, 0);
  const avgWind = winds.length > 0 ? winds.reduce((a, b) => a + b, 0) / winds.length : 0;
  const currentTemp = temps[0] || 10;

  // Determine rain condition
  let condition: 'dry' | 'light_rain' | 'rain' | 'heavy_rain';
  if (maxPrecipProb < 20 && totalPrecip < 0.5) {
    condition = 'dry';
  } else if (maxPrecipProb < 50 || totalPrecip < 2) {
    condition = 'light_rain';
  } else if (totalPrecip < 5) {
    condition = 'rain';
  } else {
    condition = 'heavy_rain';
  }

  // Determine wind
  let wind: 'calm' | 'breezy' | 'windy' | 'very_windy';
  if (avgWind < 15) {
    wind = 'calm';
  } else if (avgWind < 25) {
    wind = 'breezy';
  } else if (avgWind < 40) {
    wind = 'windy';
  } else {
    wind = 'very_windy';
  }

  // Generate headlines
  const headlines: Record<typeof condition, string> = {
    dry: 'Dry paths today.',
    light_rain: 'Light showers possible.',
    rain: 'Rain expected.',
    heavy_rain: 'Heavy rain today.',
  };

  const windLines: Record<typeof wind, string> = {
    calm: 'Calm conditions.',
    breezy: 'Light wind from the south.',
    windy: 'Blustery on the ridges.',
    very_windy: 'Strong winds expected.',
  };

  // Temperature-based additions
  let tempNote = '';
  if (currentTemp < 5) {
    tempNote = 'Wrap up warm.';
  } else if (currentTemp > 20) {
    tempNote = 'Warm afternoon ahead.';
  } else if (currentTemp < 10) {
    tempNote = 'Crisp morning.';
  }

  return {
    headline: headlines[condition],
    subline: tempNote || windLines[wind],
    condition,
    wind,
  };
}

/**
 * Get user's location (with fallback to London)
 */
export function getUserLocation(): Promise<UserLocation> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(DEFAULT_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => {
        // On error, fall back to London
        resolve(DEFAULT_LOCATION);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 600000, // Cache for 10 minutes
      }
    );
  });
}
