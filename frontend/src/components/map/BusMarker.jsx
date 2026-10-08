"use client";

import { memo, useEffect, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import { createBusMapIcon } from "./transitMarkerIcons";

function samePosition(left, right) { return left === right || (left?.[0] === right?.[0] && left?.[1] === right?.[1]); }
function bearing(from, to) {
  if (!from || !to || samePosition(from, to)) return null;
  const radians = (value) => value * Math.PI / 180;
  const degrees = (value) => value * 180 / Math.PI;
  const dLongitude = radians(to[1] - from[1]);
  const y = Math.sin(dLongitude) * Math.cos(radians(to[0]));
  const x = Math.cos(radians(from[0])) * Math.sin(radians(to[0])) - Math.sin(radians(from[0])) * Math.cos(radians(to[0])) * Math.cos(dLongitude);
  return (degrees(Math.atan2(y, x)) + 360) % 360;
}

function BusMarkerView({ position, bus, onSelect, selected = false, stale = false }) {
  const markerRef = useRef(null);
  const previousPosition = useRef(position);
  const heading = useRef(null);
  const label = bus?.name || bus?.number || bus?.busNumber || "Live bus";
  useEffect(() => {
    const marker = markerRef.current;
    const start = previousPosition.current;
    if (!marker || !position) return;
    const nextHeading = bearing(start, position);
    if (nextHeading != null) heading.current = nextHeading;
    if (!samePosition(start, position)) marker.setLatLng(position);
    marker.setIcon(createBusMapIcon({ heading: heading.current, selected, stale }));
    previousPosition.current = position;
  }, [position, selected, stale]);
  useEffect(() => { markerRef.current?.setIcon(createBusMapIcon({ heading: heading.current, selected, stale })); }, [selected, stale]);
  if (!position) return null;
  return <Marker ref={markerRef} position={position} title={label} icon={createBusMapIcon({ selected, stale })} zIndexOffset={selected ? 450 : 300} riseOnHover eventHandlers={{ click: () => onSelect?.(bus) }}><Popup><strong>{label}</strong><p className="mt-1">{stale ? "Location update delayed" : "Live bus location"}</p></Popup></Marker>;
}

export const BusMarker = memo(BusMarkerView, (previous, next) => samePosition(previous.position, next.position) && previous.selected === next.selected && previous.stale === next.stale && previous.bus?.busNumber === next.bus?.busNumber);
