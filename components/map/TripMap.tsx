"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";

type LatLng = { lat: number; lng: number };

export type TripMapProps = {
  current?: LatLng;
  pickup?: LatLng;
  dropoff?: LatLng;
  route?: LatLng[]; // decoded geometry
  stops?: { position: LatLng; title: string; note?: string }[];
  height?: number | string;
};

const markerIcon: L.Icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function TripMap({ current, pickup, dropoff, route, stops, height = 360 }: TripMapProps) {
  // Relax typings for JSX props due to version skew between react/react-leaflet/leaflet types
  const AnyMapContainer = MapContainer as any;
  const AnyTileLayer = TileLayer as any;
  const AnyMarker = Marker as any;
  const AnyPolyline = Polyline as any;
  const center = useMemo<LatLng>(() => {
    return current ?? pickup ?? dropoff ?? { lat: 39.5, lng: -98.35 }; // US centroid fallback
  }, [current, pickup, dropoff]);

  const bounds = useMemo(() => {
    const points: LatLng[] = [];
    if (current) points.push(current);
    if (pickup) points.push(pickup);
    if (dropoff) points.push(dropoff);
    if (route && route.length) points.push(...route);
    if (!points.length) return undefined;
    return L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
  }, [current, pickup, dropoff, route]);

  // Avoid SSR issues by only rendering after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="w-full overflow-hidden rounded border" style={{ height }}>
      <AnyMapContainer center={[center.lat, center.lng]} zoom={6} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <AnyTileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {bounds && <FitBounds bounds={bounds} />}
        {pickup && (
          <AnyMarker position={[pickup.lat, pickup.lng]} icon={markerIcon}>
            <Popup>Pickup</Popup>
          </AnyMarker>
        )}
        {dropoff && (
          <AnyMarker position={[dropoff.lat, dropoff.lng]} icon={markerIcon}>
            <Popup>Dropoff</Popup>
          </AnyMarker>
        )}
        {current && (
          <AnyMarker position={[current.lat, current.lng]} icon={markerIcon}>
            <Popup>Current</Popup>
          </AnyMarker>
        )}
        {route && route.length > 0 && (
          <AnyPolyline positions={route.map((p) => [p.lat, p.lng])} pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.8 }} />
        )}
        {stops?.map((s, idx) => (
          <AnyMarker key={idx} position={[s.position.lat, s.position.lng]} icon={markerIcon}>
            <Popup>
              <div className="text-sm">
                <div className="font-medium">{s.title}</div>
                {s.note && <div className="text-muted-foreground mt-1">{s.note}</div>}
              </div>
            </Popup>
          </AnyMarker>
        ))}
      </AnyMapContainer>
    </div>
  );
}

// Helper component to imperatively fit bounds
function FitBounds({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [24, 24] });
    }
  }, [map, bounds]);
  return null;
}
