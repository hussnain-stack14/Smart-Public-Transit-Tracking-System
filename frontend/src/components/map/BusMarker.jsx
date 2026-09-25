"use client";

import { memo } from "react";
import { Marker, Popup } from "react-leaflet";
import { busMapIcon } from "./transitMarkerIcons";

function samePosition(left, right) {
  return left === right || (left?.[0] === right?.[0] && left?.[1] === right?.[1]);
}

function BusMarkerView({ position, bus, onSelect }) {
  if (!position) return null;
  const label = bus?.name || bus?.number || bus?.busNumber || "Live bus";
  return <Marker position={position} title={label} icon={busMapIcon} zIndexOffset={300} riseOnHover eventHandlers={{ click: () => onSelect?.(bus) }}><Popup><strong>{label}</strong><p className="mt-1">Live bus location</p></Popup></Marker>;
}

// Socket updates should only reconcile the marker for the bus that moved.
export const BusMarker = memo(BusMarkerView, (previous, next) => (
  samePosition(previous.position, next.position)
  && previous.bus?.name === next.bus?.name
  && previous.bus?.number === next.bus?.number
  && previous.bus?.busNumber === next.bus?.busNumber
));
