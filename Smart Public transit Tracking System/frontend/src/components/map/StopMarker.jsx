"use client";

import { memo } from "react";
import { Marker, Popup } from "react-leaflet";
import { isValidPosition } from "../../lib/transit/coordinates";
import { stopMapIcon } from "./transitMarkerIcons";

function StopMarkerView({ position, stop, onSelect }) {
  if (!isValidPosition(position)) return null;
  const name = stop?.name || stop?.stopName || "Transit stop";
  return <Marker position={position} title={name} icon={stopMapIcon} zIndexOffset={100} riseOnHover eventHandlers={{ click: () => onSelect?.(stop) }}>
    <Popup><strong>{name}</strong>{Number.isFinite(stop?.stopOrder) && <p className="mt-1">Stop {stop.stopOrder}</p>}</Popup>
  </Marker>;
}

export const StopMarker = memo(StopMarkerView, (previous, next) => (
  previous.position?.[0] === next.position?.[0]
  && previous.position?.[1] === next.position?.[1]
  && (previous.stop?.name || previous.stop?.stopName) === (next.stop?.name || next.stop?.stopName)
  && previous.stop?.stopOrder === next.stop?.stopOrder
));
