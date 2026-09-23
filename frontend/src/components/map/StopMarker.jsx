"use client";

import { Marker, Popup } from "react-leaflet";
import { isValidPosition } from "../../lib/transit/coordinates";
import { stopMapIcon } from "./transitMarkerIcons";

export function StopMarker({ position, stop, onSelect }) {
  if (!isValidPosition(position)) return null;
  const name = stop?.name || stop?.stopName || "Transit stop";
  return <Marker position={position} title={name} icon={stopMapIcon} zIndexOffset={100} riseOnHover eventHandlers={{ click: () => onSelect?.(stop) }}>
    <Popup><strong>{name}</strong>{Number.isFinite(stop?.stopOrder) && <p className="mt-1">Stop {stop.stopOrder}</p>}</Popup>
  </Marker>;
}
