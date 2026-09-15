"use client";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const stopIcon = L.divIcon({ className: "!border-0 !bg-transparent", html: '<span style="display:block;width:14px;height:14px;border-radius:50%;background:#ffffff;border:4px solid #087f5b;box-shadow:0 2px 6px #17332d44"></span>', iconSize: [14, 14], iconAnchor: [7, 7] });

export function StopMarker({ position, stop, onSelect }) {
  if (!position) return null;
  return <Marker position={position} icon={stopIcon} eventHandlers={{ click: () => onSelect?.(stop) }}><Popup>{stop?.name || "Transit stop"}</Popup></Marker>;
}
