"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { isValidPosition } from "../../lib/transit/coordinates";
import { readLiveMapState, saveLiveMapViewport } from "../../lib/live-map/liveMapStorage";

export function MapViewport({ positions = [], focusKey, focusPosition, followPosition }) {
  const map = useMap();
  const positionsRef = useRef(positions);
  const restoredViewport = useRef(false);

  useEffect(() => {
    let active = true;
    readLiveMapState().then((saved) => {
      const viewport = saved?.data?.mapViewport;
      if (!active || !viewport || restoredViewport.current || !isValidPosition(viewport.center)) return;
      map.setView(viewport.center, Number.isFinite(viewport.zoom) ? viewport.zoom : 13, { animate: false });
      restoredViewport.current = true;
    });
    return () => { active = false; };
  }, [map]);

  useEffect(() => {
    const save = () => {
      const center = map.getCenter();
      saveLiveMapViewport({ center: [center.lat, center.lng], zoom: map.getZoom() });
    };
    map.on("moveend", save);
    map.on("zoomend", save);
    return () => { map.off("moveend", save); map.off("zoomend", save); };
  }, [map]);

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
      if (restoredViewport.current) return;
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

  useEffect(() => {
    if (isValidPosition(focusPosition)) map.setView(focusPosition, Math.max(map.getZoom(), 15), { animate: true, duration: 0.45 });
  // A selection changes focusKey; a live location update must not recenter unless follow is on.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, map]);

  useEffect(() => {
    if (isValidPosition(followPosition)) map.panTo(followPosition, { animate: true, duration: 0.45 });
  }, [followPosition, map]);

  return null;
}
