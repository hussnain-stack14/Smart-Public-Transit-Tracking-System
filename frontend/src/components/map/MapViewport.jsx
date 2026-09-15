"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

export function MapViewport({ positions = [], focusKey }) {
  const map = useMap();

  useEffect(() => {
    const validPositions = positions.filter((position) => Array.isArray(position) && position.length >= 2 && position.every((value) => Number.isFinite(Number(value))));
    if (!validPositions.length) return;
    if (validPositions.length === 1) {
      map.setView(validPositions[0], Math.max(map.getZoom(), 13));
      return;
    }
    map.fitBounds(validPositions, { padding: [32, 32], maxZoom: 14 });
  }, [focusKey, map, positions]);

  return null;
}
