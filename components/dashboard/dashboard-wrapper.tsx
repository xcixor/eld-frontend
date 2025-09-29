"use client";
import React, { useEffect, useState } from "react";

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { tripService, Trip } from "@/lib/api/trips";
import { vehiclesService, Vehicle } from "@/lib/api/vehicles";
import CreateTripForm from "@/components/trips/CreateTripForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DriverInfo, LoginUser } from "@/types/next-auth";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  user: LoginUser | undefined;
  driver: DriverInfo | undefined;
};

export default function DashboardWrapper({ user, driver }: Props) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetchedTrips, setHasFetchedTrips] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);

  const handleSetSelectedTripId = () => {};

  const handleShowCreateTrip = () => {
    setShowCreateTrip((prev) => !prev);
  };

  const updateTrips = (newTrip: Trip) => {
    setTrips((prevTrips) => {
      const currentTrips = Array.isArray(prevTrips) ? prevTrips : [];
      return [newTrip, ...currentTrips];
    });
  };

  useEffect(() => {
    if (!user?.id) return;
    setVehiclesLoading(true);
    vehiclesService
      .getVehicles()
      .then((data) => {
        setVehicles(data.results || []);
        setVehiclesError(null);
      })
      .catch(() => setVehiclesError("Failed to load vehicles."))
      .finally(() => setVehiclesLoading(false));
  }, [user?.id]);

  const vehicleOptions = vehicles?.map((vehicle) => ({
    label: `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vehicle_number})`,
    value: vehicle.id.toString(),
  }));

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    tripService
      .fetchTripsForDriver(Number(user.id))
      .then((data) => {
        setTrips(data.results || []);
        setError(null);
      })
      .catch(() => setError("Failed to load trips."))
      .finally(() => {
        setLoading(false);
        setHasFetchedTrips(true);
      });
  }, [user?.id]);

  return (
    <div className="container py-8">
      <div className="space-y-4">
        <Dialog open={showCreateTrip} onOpenChange={setShowCreateTrip}>
          <DialogTrigger asChild>
            <Button
              className="shad-primary-btn cursor-pointer"
              type="button"
              variant="default"
            >
              + Create Trip
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Trip</DialogTitle>
            </DialogHeader>
            {vehiclesLoading ? (
              <p className="text-gray-500">Loading vehicles...</p>
            ) : vehiclesError ? (
              <p className="text-red-500">{vehiclesError}</p>
            ) : (
              <CreateTripForm
                vehicleOptions={vehicleOptions}
                driver={driver?.id}
                defaultValues={{
                  pickup_location: "",
                  dropoff_location: "",
                  current_location: "",
                  current_cycle_used_hours: 0,
                  driver: driver?.id || "",
                  truck_id: "",
                }}
                setSelectedTripId={handleSetSelectedTripId}
                setTrips={updateTrips}
                toggleShowCreateTrip={handleShowCreateTrip}
              />
            )}
          </DialogContent>
        </Dialog>
        {loading || !hasFetchedTrips ? (
          <div className="w-full overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <TableHead key={`head-${i}`}>
                      <Skeleton className="h-4 w-24" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, rowIdx) => (
                  <TableRow key={`row-${rowIdx}`}>
                    {Array.from({ length: 7 }).map((_, cellIdx) => (
                      <TableCell key={`cell-${rowIdx}-${cellIdx}`}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : trips.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Dropoff</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>{trip.trip_number || `#${trip.id}`}</TableCell>
                  <TableCell>
                    {(trip as unknown as { pickup_location?: string })
                      .pickup_location ?? ""}
                  </TableCell>
                  <TableCell>
                    {(trip as unknown as { dropoff_location?: string })
                      .dropoff_location ?? ""}
                  </TableCell>
                  <TableCell>{trip.status}</TableCell>
                  <TableCell>
                    {(trip as unknown as { start_time?: string }).start_time
                      ? new Date(
                          (trip as unknown as { start_time?: string })
                            .start_time as string,
                        ).toLocaleDateString()
                      : ""}
                  </TableCell>
                  <TableCell>
                    {trip.estimated_end_time
                      ? new Date(trip.estimated_end_time).toLocaleDateString()
                      : ""}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/trip/${trip.id}`} >
                    <Button
                      variant="outline"
                      className="cursor-pointer"
                    >
                      Manage Log Sheets
                    </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-gray-500">No trips found.</p>
        )}
      </div>
    </div>
  );
}
