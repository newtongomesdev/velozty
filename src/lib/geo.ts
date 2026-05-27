/**
 * Utility functions for geolocation, distance, speed, and time calculations.
 */

/**
 * Calculates the geodetic distance between two coordinates using the Haversine formula.
 * Returns the distance in meters.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Converts meters per second to kilometers per hour.
 */
export function kmhFromMetersPerSecond(mps: number | null | undefined): number {
  if (mps === null || mps === undefined || isNaN(mps) || mps < 0) return 0;
  return mps * 3.6;
}

/**
 * Calculates total distance of a route defined by coordinates.
 * Returns distance in meters.
 */
export function calculatePathDistance(
  points: { lat: number; lng: number }[]
): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += haversineDistance(
      points[i].lat,
      points[i].lng,
      points[i + 1].lat,
      points[i + 1].lng
    );
  }
  return total;
}

/**
 * Formats speed in km/h for the UI.
 */
export function formatSpeed(kmh: number | null | undefined): string {
  if (kmh === null || kmh === undefined) return "0.0 km/h";
  return `${kmh.toFixed(1)} km/h`;
}

/**
 * Formats distance in meters or kilometers for the UI.
 */
export function formatDistance(meters: number | null | undefined): string {
  if (meters === null || meters === undefined || isNaN(meters)) return "0m";
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Formats a duration in milliseconds to MM:SS or HH:MM:SS format.
 */
export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || isNaN(ms) || ms < 0) return "00:00";
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const pad = (num: number) => num.toString().padStart(2, '0');
  
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Calculates the elapsed time in milliseconds.
 */
export function calculateElapsedTime(
  startTimeStr: string | Date | null | undefined,
  finishTimeStr?: string | Date | null | undefined
): number {
  if (!startTimeStr) return 0;
  const start = new Date(startTimeStr).getTime();
  const end = finishTimeStr ? new Date(finishTimeStr).getTime() : Date.now();
  return Math.max(0, end - start);
}
