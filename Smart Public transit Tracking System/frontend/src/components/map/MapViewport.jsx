"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { isValidPosition } from "../../lib/transit/coordinates";

export function MapViewport({ positions = [], focusKey }) {
  const map = useMap();
  const positionsRef = useRef(positions);

  // Keep the newest coordinates available to the fit effect without making a
  // live location event re-fit the map.
  useLayoutEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  useEffect(() => {
    const validPositions = positionsRef.current.filter(isValidPosition);
    let frame;
    function fit() {
      map.invalidateSize({ pan: false });
      if (!validPositions.length) return;
      if (validPositions.length === 1) map.setView(validPositions[0], 13, { animate: false });
      else map.fitBounds(validPositions, { padding: [32, 32], maxZoom: 14, animate: false });
    }
    function resized() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    }
    resized();
    const observer = new ResizeObserver(resized);
    observer.observe(map.getContainer());
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [focusKey, map]);

  return null;
}
