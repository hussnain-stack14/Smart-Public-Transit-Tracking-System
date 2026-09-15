"use client";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const busIcon = L.divIcon({ className: "!border-0 !bg-transparent", html: '<span style="display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:#087f5b;color:white;border:3px solid white;box-shadow:0 3px 10px #17332d55;font-size:15px">&#9650;</span>', iconSize: [32, 32], iconAnchor: [16, 16] });

export function BusMarker({ position, bus, onSelect }) {
  if (!position) return null;
  return <Marker position={position} icon={busIcon} eventHandlers={{ click: () => onSelect?.(bus) }}><Popup>{bus?.name || bus?.busNumber || "Live bus"}</Popup></Marker>;
}
