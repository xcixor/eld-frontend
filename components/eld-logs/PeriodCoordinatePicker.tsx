"use client";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";

type LatLng = { lat: number; lng: number };

export type PeriodCoordinatePickerProps = {
  start?: LatLng;
  end?: LatLng;
  onChangeStart: (p: LatLng | undefined) => void;
  onChangeEnd: (p: LatLng | undefined) => void;
  height?: number | string;
};

const markerIcon: L.Icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickHandler({ setPoint }: { setPoint: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      setPoint({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function PeriodCoordinatePicker({
  start,
  end,
  onChangeStart,
  onChangeEnd,
  height = 260,
}: PeriodCoordinatePickerProps) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<"start" | "end">("start");
  useEffect(() => setMounted(true), []);
  const center = useMemo<LatLng>(
    () => start ?? end ?? { lat: 39.5, lng: -98.35 },
    [start, end],
  );
  if (!mounted) return null;
  const AnyMapContainer = MapContainer as any;
  const AnyTileLayer = TileLayer as any;
  const AnyMarker = Marker as any;

  return (
    <div className="w-full rounded border">
      <div className="flex items-center gap-2 p-2 text-xs">
        <span className="font-medium">Set:</span>
        <button
          type="button"
          className={`rounded border px-2 py-1 ${active === "start" ? "bg-blue-600 text-white" : "bg-white"}`}
          onClick={() => setActive("start")}
        >
          Start
        </button>
        <button
          type="button"
          className={`rounded border px-2 py-1 ${active === "end" ? "bg-blue-600 text-white" : "bg-white"}`}
          onClick={() => setActive("end")}
        >
          End
        </button>
        <span className="text-muted-foreground">
          Click map to set the active point. Drag markers to fine-tune.
        </span>
      </div>
      <AnyMapContainer
        center={[center.lat, center.lng]}
        zoom={6}
        style={{ height, width: "100%" }}
        scrollWheelZoom
      >
        <AnyTileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler
          setPoint={(p) =>
            active === "start" ? onChangeStart(p) : onChangeEnd(p)
          }
        />
        {start && (
          <AnyMarker
            position={[start.lat, start.lng]}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const m = e.target as L.Marker;
                const ll = m.getLatLng();
                onChangeStart({ lat: ll.lat, lng: ll.lng });
              },
            }}
          />
        )}
        {end && (
          <AnyMarker
            position={[end.lat, end.lng]}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const m = e.target as L.Marker;
                const ll = m.getLatLng();
                onChangeEnd({ lat: ll.lat, lng: ll.lng });
              },
            }}
          />
        )}
      </AnyMapContainer>
    </div>
  );
}
