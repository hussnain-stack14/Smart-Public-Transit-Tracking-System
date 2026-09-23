"use client";

import { Marker, Popup } from "react-leaflet";
import { busMapIcon } from "./transitMarkerIcons";

export function BusMarker({ position, bus, onSelect }) {
  if (!position) return null;
  const label = bus?.name || bus?.number || bus?.busNumber || "Live bus";
  return <Marker position={position} title={label} icon={busMapIcon} zIndexOffset={300} riseOnHover eventHandlers={{ click: () => onSelect?.(bus) }}><Popup><strong>{label}</strong><p className="mt-1">Live bus location</p></Popup></Marker>;
}
