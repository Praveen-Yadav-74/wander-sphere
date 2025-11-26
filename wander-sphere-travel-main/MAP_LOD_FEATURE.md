# Level of Detail (LOD) Map Feature

## Overview

This implementation adds a sophisticated **Level of Detail (LOD) Rendering** system to the Travel Map, allowing the map to intelligently display different levels of detail based on zoom level. This prevents visual clutter when viewing the entire world and provides detailed views when zoomed in.

## Features Implemented

### 1. **Dynamic Zoom-Based Clustering**
- **Zoom Level 1-4 (Global View):** Shows 1 pin per country with count (e.g., "India (12 places)")
- **Zoom Level 5-9 (Regional View):** Shows 1 pin per state/region (e.g., "Rajasthan (5)")
- **Zoom Level 10+ (Local View):** Shows individual location markers

### 2. **Dual Mode System**
- **Journey Mapping Mode:** Displays travel journey locations with standard map pins
- **Memories Mode:** Shows photo thumbnails on the map from stories

### 3. **Spiderify Effect**
- When multiple markers overlap at the same location, clicking the cluster expands them in a spiral pattern
- Allows viewing all individual locations without overlap
- Click again to collapse back to cluster view

### 4. **Gallery Modal**
- In Memories mode, clicking a photo thumbnail opens a full-screen gallery
- Navigate through photos with arrow buttons
- Shows photo count and location information

### 5. **Smart Data Handling**
- Automatically extracts location data from journeys and stories
- Falls back to distance-based clustering if country/state data is missing
- Handles various location data formats gracefully

## Technical Implementation

### Files Created/Modified

1. **`src/utils/mapClustering.ts`**
   - Core clustering logic
   - Functions: `clusterData()`, `clusterByCountry()`, `clusterByState()`, `clusterByDistance()`
   - Data extraction: `extractJourneyPoints()`, `extractStoryPoints()`

2. **`src/pages/TravelMap.tsx`**
   - Main map component with full LOD rendering
   - Mode toggle (Journeys/Memories)
   - Zoom tracking and dynamic clustering
   - Gallery modal integration

3. **`src/components/map/SpiderifyMarker.tsx`**
   - Spiderify effect component (for future enhancement)

4. **`src/index.css`**
   - Custom styles for cluster markers and photo thumbnails

5. **`index.html`**
   - Added Leaflet CSS and MarkerCluster CSS

## Data Structure Requirements

### Journey Location Format
```typescript
{
  location: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
    country?: string;
    state?: string;
    city?: string;
    place_name?: string;
  };
  photos?: string[];
}
```

### Story Location Format
```typescript
{
  location: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
    country?: string;
    state?: string;
    city?: string;
    place_name?: string;
  };
  images?: string[];
  featured_image?: string;
}
```

## Usage

### Basic Usage
1. Navigate to `/maps` or the Travel Map page
2. Toggle between "Journey Mapping" and "Memories" modes
3. Zoom in/out to see different levels of detail
4. Click clusters to expand (spiderify) overlapping markers
5. Click photo thumbnails in Memories mode to view gallery

### Zoom Levels
- **1-4:** Country-level clustering
- **5-9:** State/region-level clustering  
- **10+:** Individual markers

## Fallback Behavior

If location data lacks `country` or `state` fields, the system automatically:
- Uses distance-based clustering algorithm
- Adjusts clustering threshold based on zoom level
- Ensures markers are always visible and accessible

## Performance Considerations

- Clustering is calculated on the frontend using `useMemo` for efficiency
- Only recalculates when zoom level or data changes
- Handles large datasets (1000+ points) efficiently
- Uses React Leaflet for optimized rendering

## Future Enhancements

1. **Advanced Spiderify Animation:** Smooth spiral animation when expanding clusters
2. **Custom Cluster Icons:** Different icons for different cluster types
3. **Heatmap Mode:** Show travel density as heatmap overlay
4. **Timeline Filter:** Filter markers by date range
5. **Route Lines:** Draw lines connecting journey points in chronological order

## Dependencies

- `react-leaflet`: ^4.2.1
- `leaflet`: ^1.9.4
- `leaflet.markercluster`: (CSS only, clustering logic is custom)

## Notes

- The spiderify effect uses a simple spiral pattern calculation
- Photo thumbnails are circular (50x50px) with white borders
- Cluster markers show count in a circular badge
- All markers are clickable and show popups with location information

