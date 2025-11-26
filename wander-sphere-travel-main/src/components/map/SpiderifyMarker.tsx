/**
 * Spiderify Marker Component
 * Creates a spiral effect when multiple markers overlap
 */

import { useEffect, useRef } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPoint } from '@/utils/mapClustering';

interface SpiderifyMarkerProps {
  cluster: {
    id: string;
    lat: number;
    lng: number;
    count: number;
    points: MapPoint[];
  };
  isSpiderified: boolean;
  onSpiderify: (clusterId: string) => void;
  renderMarker: (point: MapPoint, index: number) => React.ReactNode;
}

export function SpiderifyMarker({ cluster, isSpiderified, onSpiderify, renderMarker }: SpiderifyMarkerProps) {
  const map = useMap();
  const spiderifiedRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!isSpiderified || cluster.count <= 1) return;

    const center = L.latLng(cluster.lat, cluster.lng);
    const angleStep = (2 * Math.PI) / cluster.count;
    const radius = 0.01; // ~1km at equator

    // Create spiral positions
    cluster.points.forEach((point, index) => {
      const angle = index * angleStep;
      const offsetLat = radius * Math.cos(angle);
      const offsetLng = radius * Math.sin(angle);
      
      const position = L.latLng(
        center.lat + offsetLat,
        center.lng + offsetLng / Math.cos(center.lat * Math.PI / 180)
      );

      // Create marker at spiral position
      const marker = L.marker(position, {
        icon: L.divIcon({
          className: 'spiderified-marker',
          html: '',
          iconSize: [0, 0]
        })
      }).addTo(map);

      // Animate from center to spiral position
      marker.setLatLng(center);
      setTimeout(() => {
        marker.setLatLng(position);
      }, 50 * index);

      spiderifiedRef.current.push(marker);
    });

    return () => {
      spiderifiedRef.current.forEach(marker => marker.remove());
      spiderifiedRef.current = [];
    };
  }, [isSpiderified, cluster, map]);

  if (cluster.count === 1) {
    return <>{renderMarker(cluster.points[0], 0)}</>;
  }

  if (isSpiderified) {
    return (
      <>
        {cluster.points.map((point, index) => (
          <div key={point.id}>{renderMarker(point, index)}</div>
        ))}
      </>
    );
  }

  // Render cluster marker that triggers spiderify on click
  return (
    <Marker
      position={[cluster.lat, cluster.lng]}
      eventHandlers={{
        click: () => onSpiderify(cluster.id)
      }}
    >
      {/* Cluster marker will be rendered by parent */}
    </Marker>
  );
}

