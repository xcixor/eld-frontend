"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

type Props = {
  user: LoginUser | undefined;
  driver: DriverInfo | undefined;
};

export default function DashboardWrapper({ user, driver }: Props) {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
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
    vehiclesService.getVehicles()
      .then((data) => {
        setVehicles(data.results || []);
        setVehiclesError(null);
      })
      .catch(() => setVehiclesError("Failed to load vehicles."))
      .finally(() => setVehiclesLoading(false));
  }, [user?.id]);

  const vehicleOptions = vehicles?.map((vehicle) => ({
    label: `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vehicle_number})`,
    value: vehicle.id.toString()
  }));

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    tripService.fetchTripsForDriver(Number(user.id))
      .then((data) => {
  setTrips(data.results || []);
        setError(null);
      })
      .catch(() => setError("Failed to load trips."))
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>
      <div className="mb-8 rounded-lg bg-white p-6 shadow">
        <p className="text-gray-600">Welcome to your dashboard!</p>
        <p className="mt-2 text-sm text-gray-500">
          You have successfully logged in.
        </p>
      </div>
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
        {loading ? (
          <p className="text-gray-500">Loading trips...</p>
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
                  <TableCell>{(trip as unknown as { pickup_location?: string }).pickup_location ?? ""}</TableCell>
                  <TableCell>{(trip as unknown as { dropoff_location?: string }).dropoff_location ?? ""}</TableCell>
                  <TableCell>{trip.status}</TableCell>
                  <TableCell>{(trip as unknown as { start_time?: string }).start_time ? new Date((trip as unknown as { start_time?: string }).start_time as string).toLocaleDateString() : ""}</TableCell>
                  <TableCell>{trip.estimated_end_time ? new Date(trip.estimated_end_time).toLocaleDateString() : ""}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/dashboard/trip/${trip.id}`)}
                    >
                      Manage Log Sheets
                    </Button>
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

