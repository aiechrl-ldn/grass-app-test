// Route and API types for Grass web app

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface Amenity {
  name: string;
  type: 'pub' | 'cafe';
  lat: number;
  lon: number;
  url?: string | null;
  hours?: Record<string, string>;
  notes?: string | null;
}

export interface Route {
  id: string;
  name: string;
  region: string;
  description: string;
  tagline?: string;
  trailhead: Coordinates;
  polyline: string;
  distance_km: number;
  elevation_gain_m: number;
  estimated_duration_hours: number;
  start_station: string;
  trailhead_station: string;
  approx_travel_minutes: number;
  bailout_stations: string[];
  tags: string[];
  amenities: Amenity[];
  hero_image_url: string;
  hero_image_attribution?: string;
  difficulty?: number;
  seasonal_notes?: string;
  crowd_level?: 'quiet' | 'moderate' | 'busy_weekends' | 'always_busy';
  mobile_signal?: 'good' | 'patchy' | 'poor';
}

export interface POI {
  name: string;
  lat: number;
  lon: number;
}

export interface RouteMap {
  polyline: string;
  start_station: string;
  trailhead_station: string;
  bailout_station?: string | null;
  pois: POI[];
}

export interface RouteCard {
  route_id: string;
  title: string;
  hero_image_url: string;
  summary: string;
  depart_by_iso: string;
  today_fit: number;
  duration_hours: number;
  elevation_gain_m: number;
  distance_km: number;
  map: RouteMap;
}

export interface RecommendationsResponse {
  cards: RouteCard[];
}

export interface UserPreferences {
  max_travel_minutes: number;
  wind_tolerance: 'low' | 'moderate' | 'high';
  rain_tolerance_mm_per_hr: number;
  needs_pub: boolean;
}

export interface UserLocation {
  lat: number;
  lon: number;
  leave_after_iso?: string;
}

export interface RecommendationsRequest {
  user: UserLocation;
  prefs: UserPreferences;
  query_text?: string;
}

// Weather types
export interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  precipitation: number[];
  precipitation_probability: number[];
  wind_speed_10m: number[];
}

export interface WeatherData {
  hourly: HourlyWeather;
  latitude?: number;
  longitude?: number;
}

export interface WeatherSummary {
  condition: 'dry' | 'light_rain' | 'rain' | 'heavy_rain';
  wind: 'calm' | 'breezy' | 'windy' | 'very_windy';
  temperature: number;
  description: string;
}

// Score types
export type ScoreLevel = 'perfect' | 'good' | 'possible';

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 0.7) return 'perfect';
  if (score >= 0.5) return 'good';
  return 'possible';
}

export function getScoreLabel(score: number): string {
  if (score >= 0.7) return 'Perfect for today';
  if (score >= 0.5) return 'Good conditions';
  return 'Possible today';
}

// Route type glyphs
export type RouteGlyph =
  | 'chalk-horse'   // South Downs chalk routes
  | 'oak-leaf'      // Woodland walks
  | 'standing-stone'// Ancient/historic
  | 'hare'          // Quick/easy walks
  | 'raven'         // Exposed/dramatic
  | 'river'         // Riverside/Thames
  | 'cliff'         // Coastal routes
  | 'acorn';        // Family-friendly

export function getRouteGlyph(tags: string[]): RouteGlyph {
  if (tags.includes('coastal') || tags.includes('clifftop')) return 'cliff';
  if (tags.includes('chalk') && !tags.includes('woodland')) return 'chalk-horse';
  if (tags.includes('riverside') || tags.includes('thames-path')) return 'river';
  if (tags.includes('woodland') || tags.includes('ancient')) return 'oak-leaf';
  if (tags.includes('exposed') || tags.includes('ridgey')) return 'raven';
  if (tags.includes('roman') || tags.includes('historic')) return 'standing-stone';
  if (tags.includes('family-friendly') || tags.includes('accessible')) return 'acorn';
  if (tags.includes('flat') || tags.includes('easy')) return 'hare';
  return 'oak-leaf'; // default
}

export const glyphSymbols: Record<RouteGlyph, string> = {
  'chalk-horse': '◆',
  'oak-leaf': '❧',
  'standing-stone': '⧫',
  'hare': '◇',
  'raven': '✧',
  'river': '≈',
  'cliff': '▲',
  'acorn': '●',
};
