"use client";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { isValidPosition } from "../../lib/transit/coordinates";

const passengerIcon = L.divIcon({
  className: "!border-0 !bg-transparent",
  html: '<span style="display:grid;width:30px;height:30px;place-items:center;border-radius:999px;background:#fbbf24;border:3px solid #ffffff;box-shadow:0 3px 10px #17332d55;color:#17332d;font-size:14px;font-weight:800">P</span>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -16],
});

function formatTime(value) {
  if (!value) return "Time unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Time unavailable" : date.toLocaleString();
}

export function PassengerMarker({ passengerLocation }) {
  const pickup = passengerLocation?.pickupLocation;
  const position = [pickup?.latitude, pickup?.longitude];
  if (!isValidPosition(position)) return null;

  const passengerName = passengerLocation.passenger?.name || "Booked passenger";
  return (
    <Marker position={position} title={`${passengerName} pickup`} icon={passengerIcon}>
      <Popup>
        <strong>{passengerName}</strong>
        <p className="mt-1">Passenger pickup</p>
        {Number.isFinite(pickup.accuracy) && <p>Accuracy: about {Math.round(pickup.accuracy)} m</p>}
        <p>Updated: {formatTime(pickup.timestamp)}</p>
      </Popup>
    </Marker>
  );
}