import React from "react";
import TripWrapper from "./trip-wrapper";
import { getCurrentSessionUser } from "@/lib/auth";
import { DriverInfo } from "@/types/next-auth";

export default async function Page({ params }: { params: { tripId: string } }) {
  const { tripId } = await params;
  const { driver } = await getCurrentSessionUser();
  const d = driver as DriverInfo;
  const driverId = Number(d.id);
  return <TripWrapper tripId={tripId} driverId={driverId} />;
}
