"use client";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { isValidPosition } from "../../lib/transit/coordinates";

const stopIcon = L.divIcon({ className: "!border-0 !bg-transparent", html: '<span style="display:block;width:14px;height:14px;border-radius:50%;background:#ffffff;border:4px solid #087f5b;box-shadow:0 2px 6px #17332d44"></span>', iconSize: [14, 14], iconAnchor: [7, 7] });

export function StopMarker({ position, stop, onSelect }) {
  if (!isValidPosition(position)) return null;
  const name = stop?.name || stop?.stopName || "Transit stop";
  return <Marker position={position} title={name} icon={stopIcon} eventHandlers={{ click: () => onSelect?.(stop) }}>
    <Popup><strong>{name}</strong>{Number.isFinite(stop?.stopOrder) && <p className="mt-1">Stop {stop.stopOrder}</p>}</Popup>
  </Marker>;
}
