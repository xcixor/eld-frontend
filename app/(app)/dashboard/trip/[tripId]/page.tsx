import React from 'react'
import TripWrapper from './trip-wrapper';



export default async function Page({ params }: { params: { tripId: string } }) {
  const { tripId } = await params;
  return (
    <TripWrapper tripId={tripId} />
  )
}

