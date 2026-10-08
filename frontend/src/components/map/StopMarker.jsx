"use client";

import { memo } from "react";
import { Marker, Popup } from "react-leaflet";
import { isValidPosition } from "../../lib/transit/coordinates";
import { nextStopMapIcon, selectedStopMapIcon, stopMapIcon } from "./transitMarkerIcons";

function StopMarkerView({ position, stop, onSelect, next = false, selected = false }) {
  if (!isValidPosition(position)) return null;
  const name = stop?.name || stop?.stopName || "Transit stop";
  return <Marker position={position} title={name} icon={selected ? selectedStopMapIcon : next ? nextStopMapIcon : stopMapIcon} zIndexOffset={selected ? 280 : next ? 240 : 100} riseOnHover eventHandlers={{ click: () => onSelect?.(stop) }}><Popup><strong>{name}</strong><p className="mt-1">{selected ? "Selected stop" : next ? "Next stop" : Number.isFinite(stop?.stopOrder) ? `Stop ${stop.stopOrder}` : "Transit stop"}</p></Popup></Marker>;
}

export const StopMarker = memo(StopMarkerView, (previous, next) => previous.position?.[0] === next.position?.[0] && previous.position?.[1] === next.position?.[1] && previous.next === next.next && previous.selected === next.selected && (previous.stop?.name || previous.stop?.stopName) === (next.stop?.name || next.stop?.stopName) && previous.stop?.stopOrder === next.stop?.stopOrder);
