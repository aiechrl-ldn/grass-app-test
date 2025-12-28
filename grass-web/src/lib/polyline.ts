/**
 * Google Polyline Decoder
 * Decodes encoded polyline strings into coordinate arrays
 */

export interface Coordinate {
  lat: number;
  lng: number;
}

/**
 * Decode a Google-encoded polyline string into an array of coordinates
 */
export function decodePolyline(encoded: string): Coordinate[] {
  const coordinates: Coordinate[] = [];

  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    // Decode latitude
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    // Decode longitude
    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return coordinates;
}

/**
 * Get the center point of a polyline
 */
export function getPolylineCenter(coordinates: Coordinate[]): Coordinate | null {
  if (coordinates.length === 0) return null;

  const sumLat = coordinates.reduce((sum, c) => sum + c.lat, 0);
  const sumLng = coordinates.reduce((sum, c) => sum + c.lng, 0);

  return {
    lat: sumLat / coordinates.length,
    lng: sumLng / coordinates.length,
  };
}

/**
 * Get the bounding box for a polyline
 */
export function getPolylineBounds(coordinates: Coordinate[]): {
  north: number;
  south: number;
  east: number;
  west: number;
} | null {
  if (coordinates.length === 0) return null;

  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;

  for (const coord of coordinates) {
    if (coord.lat > north) north = coord.lat;
    if (coord.lat < south) south = coord.lat;
    if (coord.lng > east) east = coord.lng;
    if (coord.lng < west) west = coord.lng;
  }

  return { north, south, east, west };
}

/**
 * Calculate the zoom level to fit bounds
 */
export function getZoomForBounds(
  bounds: { north: number; south: number; east: number; west: number },
  mapWidth: number = 400,
  mapHeight: number = 300
): number {
  const WORLD_DIM = { height: 256, width: 256 };
  const ZOOM_MAX = 15;

  function latRad(lat: number) {
    const sin = Math.sin((lat * Math.PI) / 180);
    const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  }

  function zoom(mapPx: number, worldPx: number, fraction: number) {
    return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
  }

  const latFraction = (latRad(bounds.north) - latRad(bounds.south)) / Math.PI;
  const lngDiff = bounds.east - bounds.west;
  const lngFraction = (lngDiff < 0 ? lngDiff + 360 : lngDiff) / 360;

  const latZoom = zoom(mapHeight, WORLD_DIM.height, latFraction);
  const lngZoom = zoom(mapWidth, WORLD_DIM.width, lngFraction);

  return Math.min(latZoom, lngZoom, ZOOM_MAX);
}
