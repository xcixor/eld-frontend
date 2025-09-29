"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/DataTable';
import { useLogSheetsColumns } from '@/components/data-table/columns/log-sheets-columns';
import { getLogSheetsForTrip, LogSheet } from '@/lib/api/logsheets';
import { tripService, Trip } from '@/lib/api/trips';
import TripMap from '@/components/map/TripMap';
import { fetchRouteOSRM, suggestStopsByTime } from '@/lib/map/osrm';


export default function TripWrapper({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [logSheets, setLogSheets] = useState<LogSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const columns = useLogSheetsColumns(tripId);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [routePoints, setRoutePoints] = useState<{ lat: number; lng: number }[] | null>(null);
  const [stops, setStops] = useState<{ position: { lat: number; lng: number }; title: string; note?: string }[] | null>(null);

  useEffect(() => {
    async function fetchLogSheets() {
      setLoading(true);
      const data = await getLogSheetsForTrip(tripId);
      setLogSheets(data);
      setLoading(false);
    }
    fetchLogSheets();
  }, [tripId]);

  useEffect(() => {
    async function loadTripAndRoute() {
      try {
        const t = await tripService.getTripById(Number(tripId));
        setTrip(t);
        const pickup = t.pickup_lat && t.pickup_lng ? { lat: t.pickup_lat, lng: t.pickup_lng } : undefined;
        const dropoff = t.dropoff_lat && t.dropoff_lng ? { lat: t.dropoff_lat, lng: t.dropoff_lng } : undefined;
        if (pickup && dropoff) {
          const route = await fetchRouteOSRM(pickup, dropoff);
          setRoutePoints(route.points);
          const suggested = suggestStopsByTime(route.points, route.duration_min, 480); // suggest every 8h
          setStops(
            suggested.map((p, idx) => ({
              position: p,
              title: idx === 0 ? "8h Break" : `Rest Stop ${idx + 1}`,
              note: idx === 0 ? "Take 30 min break (8h driving)" : undefined,
            }))
          );
        } else {
          setRoutePoints(null);
          setStops(null);
        }
      } catch {
        // ignore map errors in UI; map is optional
      }
    }
    loadTripAndRoute();
  }, [tripId]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Trip Overview</h2>
        <p className="text-sm text-muted-foreground mb-3">Route and suggested rest stops based on driving time.</p>
        <TripMap
          current={trip?.current_lat && trip?.current_lng ? { lat: trip.current_lat, lng: trip.current_lng } : undefined}
          pickup={trip?.pickup_lat && trip?.pickup_lng ? { lat: trip.pickup_lat, lng: trip.pickup_lng } : undefined}
          dropoff={trip?.dropoff_lat && trip?.dropoff_lng ? { lat: trip.dropoff_lat, lng: trip.dropoff_lng } : undefined}
          route={routePoints ?? undefined}
          stops={stops ?? undefined}
          height={400}
        />
      </div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Daily Log Sheets</h2>
        <Button onClick={() => router.push(`/dashboard/trip/${tripId}/add-logsheet`)}>
          Add Log Sheet
        </Button>
      </div>
      {loading ? (
        <div className="p-4 text-sm text-muted-foreground">Loading...</div>
      ) : (
        <DataTable columns={columns} data={logSheets} searchPlaceholder="Filter log sheets..." />
      )}
    </div>
  );
}
