"use client";

import { Marker, Popup } from "react-leaflet";
import { isValidPosition } from "../../lib/transit/coordinates";
import { passengerMapIcon } from "./transitMarkerIcons";

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
    <Marker position={position} title={`${passengerName} pickup`} icon={passengerMapIcon} zIndexOffset={400} riseOnHover>
      <Popup>
        <strong>{passengerName}</strong>
        <p className="mt-1">Passenger pickup</p>
        {Number.isFinite(pickup.accuracy) && <p>Accuracy: about {Math.round(pickup.accuracy)} m</p>}
        <p>Updated: {formatTime(pickup.timestamp)}</p>
      </Popup>
    </Marker>
  );
}
