export type LatLng = { lat: number; lng: number };

export type RouteResult = {
  points: LatLng[];
  distance_km: number;
  duration_min: number;
};

export async function fetchRouteOSRM(start: LatLng, end: LatLng): Promise<RouteResult> {
  const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch route");
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error("No route returned");
  const coords = route.geometry.coordinates as [number, number][];
  return {
    points: coords.map(([lng, lat]) => ({ lat, lng })),
    distance_km: route.distance / 1000,
    duration_min: route.duration / 60,
  };
}

export function suggestStopsByTime(
  polyline: LatLng[],
  durationMin: number,
  segmentMinutes = 240, // 4 hours default per segment
): LatLng[] {
  if (!polyline.length || durationMin <= segmentMinutes) return [];
  const stops: LatLng[] = [];
  const total = polyline.length;
  const segments = Math.floor(durationMin / segmentMinutes);
  for (let i = 1; i <= segments; i++) {
    const idx = Math.floor((i * segmentMinutes / durationMin) * (total - 1));
    stops.push(polyline[idx]);
  }
  return stops;
}
