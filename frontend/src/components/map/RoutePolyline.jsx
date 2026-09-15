"use client";

import { Polyline } from "react-leaflet";

export function RoutePolyline({ positions, color = "#087f5b" }) {
  if (!positions?.length) return null;
  return <Polyline positions={positions} pathOptions={{ color, weight: 5, opacity: 0.8 }} />;
}
