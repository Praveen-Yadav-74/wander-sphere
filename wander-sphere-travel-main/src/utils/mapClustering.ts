/**
 * Map Clustering Utilities
 * Implements Level of Detail (LOD) rendering based on zoom level
 */

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  country?: string;
  state?: string;
  city?: string;
  placeName?: string;
  photo?: string;
  photos?: string[];
  data?: any; // Original data for reference
}

export interface Cluster {
  id: string;
  lat: number;
  lng: number;
  count: number;
  label: string;
  points: MapPoint[];
  type: 'country' | 'state' | 'local';
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get center point of multiple coordinates
 */
function getCenterPoint(points: MapPoint[]): { lat: number; lng: number } {
  if (points.length === 0) return { lat: 0, lng: 0 };
  if (points.length === 1) return { lat: points[0].lat, lng: points[0].lng };
  
  let sumLat = 0;
  let sumLng = 0;
  points.forEach(point => {
    sumLat += point.lat;
    sumLng += point.lng;
  });
  
  return {
    lat: sumLat / points.length,
    lng: sumLng / points.length
  };
}

/**
 * Cluster data by country (Zoom Level 1-4: Global View)
 */
function clusterByCountry(points: MapPoint[]): Cluster[] {
  const countryMap = new Map<string, MapPoint[]>();
  
  points.forEach(point => {
    const country = point.country || 'Unknown';
    if (!countryMap.has(country)) {
      countryMap.set(country, []);
    }
    countryMap.get(country)!.push(point);
  });
  
  return Array.from(countryMap.entries()).map(([country, countryPoints]) => {
    const center = getCenterPoint(countryPoints);
    return {
      id: `country-${country}`,
      lat: center.lat,
      lng: center.lng,
      count: countryPoints.length,
      label: `${country} (${countryPoints.length} ${countryPoints.length === 1 ? 'place' : 'places'})`,
      points: countryPoints,
      type: 'country' as const
    };
  });
}

/**
 * Cluster data by state/region (Zoom Level 5-9: Regional View)
 */
function clusterByState(points: MapPoint[]): Cluster[] {
  const stateMap = new Map<string, MapPoint[]>();
  
  points.forEach(point => {
    // Use state if available, otherwise fall back to city
    const state = point.state || point.city || 'Unknown';
    const key = `${point.country || 'Unknown'}-${state}`;
    
    if (!stateMap.has(key)) {
      stateMap.set(key, []);
    }
    stateMap.get(key)!.push(point);
  });
  
  return Array.from(stateMap.entries()).map(([key, statePoints]) => {
    const center = getCenterPoint(statePoints);
    const firstPoint = statePoints[0];
    const stateName = firstPoint.state || firstPoint.city || 'Unknown';
    
    return {
      id: `state-${key}`,
      lat: center.lat,
      lng: center.lng,
      count: statePoints.length,
      label: `${stateName} (${statePoints.length})`,
      points: statePoints,
      type: 'state' as const
    };
  });
}

/**
 * Distance-based clustering for points without country/state data
 * Uses a simple distance threshold algorithm
 */
function clusterByDistance(points: MapPoint[], thresholdKm: number = 50): Cluster[] {
  const clusters: Cluster[] = [];
  const processed = new Set<string>();
  
  points.forEach(point => {
    if (processed.has(point.id)) return;
    
    const cluster: MapPoint[] = [point];
    processed.add(point.id);
    
    // Find all nearby points
    points.forEach(otherPoint => {
      if (processed.has(otherPoint.id)) return;
      
      const distance = getDistance(point.lat, point.lng, otherPoint.lat, otherPoint.lng);
      if (distance <= thresholdKm) {
        cluster.push(otherPoint);
        processed.add(otherPoint.id);
      }
    });
    
    const center = getCenterPoint(cluster);
    const label = cluster.length === 1 
      ? (cluster[0].placeName || cluster[0].title || 'Location')
      : `${cluster.length} locations`;
    
    clusters.push({
      id: `cluster-${point.id}`,
      lat: center.lat,
      lng: center.lng,
      count: cluster.length,
      label,
      points: cluster,
      type: 'local' as const
    });
  });
  
  return clusters;
}

/**
 * Main clustering function - implements LOD rendering
 * @param points Array of map points
 * @param zoomLevel Current map zoom level
 * @returns Clustered data based on zoom level
 */
export function clusterData(points: MapPoint[], zoomLevel: number): Cluster[] {
  if (points.length === 0) return [];
  
  // Check if points have country/state data
  const hasLocationData = points.some(p => p.country || p.state);
  
  if (hasLocationData) {
    // Zoom Level 1-4: Global View - Cluster by Country
    if (zoomLevel < 5) {
      return clusterByCountry(points);
    }
    
    // Zoom Level 5-9: Regional View - Cluster by State
    if (zoomLevel >= 5 && zoomLevel < 10) {
      return clusterByState(points);
    }
    
    // Zoom Level 10+: Local View - Show individual points
    return points.map(point => ({
      id: point.id,
      lat: point.lat,
      lng: point.lng,
      count: 1,
      label: point.placeName || point.title || 'Location',
      points: [point],
      type: 'local' as const
    }));
  } else {
    // Fallback: Use distance-based clustering
    // Adjust threshold based on zoom level
    const threshold = zoomLevel < 5 ? 500 : zoomLevel < 10 ? 100 : 10;
    return clusterByDistance(points, threshold);
  }
}

/**
 * Extract map points from journey data
 */
export function extractJourneyPoints(journeys: any[]): MapPoint[] {
  return journeys
    .filter(journey => journey.location?.coordinates?.latitude && journey.location?.coordinates?.longitude)
    .map(journey => ({
      id: journey.id,
      lat: journey.location.coordinates.latitude,
      lng: journey.location.coordinates.longitude,
      title: journey.title,
      country: journey.location.country,
      state: journey.location.state,
      city: journey.location.city,
      placeName: journey.location.place_name || journey.location.city,
      photos: journey.photos || journey.images || [],
      data: journey
    }));
}

/**
 * Extract map points from story data
 */
export function extractStoryPoints(stories: any[]): MapPoint[] {
  return stories
    .filter(story => story.location?.coordinates?.latitude && story.location?.coordinates?.longitude)
    .map(story => ({
      id: story.id,
      lat: story.location.coordinates.latitude,
      lng: story.location.coordinates.longitude,
      title: story.title,
      country: story.location.country,
      state: story.location.state,
      city: story.location.city,
      placeName: story.location.place_name || story.location.city,
      photo: story.featured_image || story.images?.[0],
      photos: story.images || [],
      data: story
    }));
}

