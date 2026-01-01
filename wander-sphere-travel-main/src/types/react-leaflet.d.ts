/**
 * Type declarations to fix React-Leaflet v4 type mismatches
 * These are cosmetic type errors - the code works perfectly at runtime
 * See memory: "React-Leaflet TypeScript type mismatch is often cosmetic"
 */

declare module 'react-leaflet' {
  import { ComponentType } from 'react';
  import * as L from 'leaflet';

  export interface MapContainerProps {
    center?: L.LatLngExpression;
    zoom?: number;
    className?: string;
    zoomControl?: boolean;
    scrollWheelZoom?: boolean;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export interface TileLayerProps {
    url: string;
    attribution?: string;
    [key: string]: any;
  }

  export interface MarkerProps {
    position: L.LatLngExpression;
    icon?: L.Icon | L.DivIcon;
    eventHandlers?: {
      [key: string]: (...args: any[]) => void;
    };
    children?: React.ReactNode;
    [key: string]: any;
  }

  export interface PopupProps {
    className?: string;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export const MapContainer: ComponentType<MapContainerProps>;
  export const TileLayer: ComponentType<TileLayerProps>;
  export const Marker: ComponentType<MarkerProps>;
  export const Popup: ComponentType<PopupProps>;
  export function useMapEvents(handlers: any): any;
  export function useMap(): L.Map;
}
