export function normalizeSegments(segments: any): any[] {
  if (!segments) return [];
  if (Array.isArray(segments)) return segments;
  if (typeof segments === 'object') return [segments];
  return [];
}

export function normalizeFlights(flights: any): any[] {
  if (!flights) return [];
  if (Array.isArray(flights)) return flights;
  if (typeof flights === 'object') return [flights];
  return [];
}
