"use client";

import { memo } from "react";
import { Polyline } from "react-leaflet";

function samePositions(left = [], right = []) {
  return left.length === right.length && left.every((position, index) => position?.[0] === right[index]?.[0] && position?.[1] === right[index]?.[1]);
}

function RoutePolylineView({ positions, color = "#087f5b" }) {
  if (!positions?.length) return null;
  return <Polyline positions={positions} pathOptions={{ color, weight: 5, opacity: 0.8 }} />;
}

export const RoutePolyline = memo(RoutePolylineView, (previous, next) => previous.color === next.color && samePositions(previous.positions, next.positions));
