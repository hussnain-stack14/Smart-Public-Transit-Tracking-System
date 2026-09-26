"use client";

import { memo, useEffect, useRef } from "react";
import { Polyline, useMap } from "react-leaflet";

/** Draws small arrowheads along a polyline to indicate direction of travel. */
function ArrowDecorators({ positions, color = "var(--primary)" }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map || !positions || positions.length < 2) return;

    // Resolve CSS var to hex if needed (Leaflet canvas renderer can't use CSS vars).
    const resolvedColor = color.startsWith("var(")
      ? getComputedStyle(document.documentElement).getPropertyValue(
          color.replace("var(", "").replace(")", "").trim(),
        ).trim() || "#FFA500"
      : color;

    const L = window.L || require("leaflet");
    const arrows = [];

    // Place an arrowhead every N segments (skip if too few points)
    const step = Math.max(1, Math.floor(positions.length / 4));
    for (let i = step; i < positions.length - 1; i += step) {
      const from = positions[i];
      const to = positions[i + 1] || positions[i];
      if (!from || !to) continue;

      const fromPt = map.latLngToLayerPoint(from);
      const toPt = map.latLngToLayerPoint(to);
      const dx = toPt.x - fromPt.x;
      const dy = toPt.y - fromPt.y;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      // Mid-point of this segment in latlng
      const midLat = (Number(from[0]) + Number(to[0])) / 2;
      const midLng = (Number(from[1]) + Number(to[1])) / 2;

      const icon = L.divIcon({
        className: "",
        html: `<svg width="14" height="14" viewBox="0 0 14 14" style="transform:rotate(${angle}deg);display:block;" aria-hidden="true">
          <polygon points="14,7 0,0 3,7 0,14" fill="${resolvedColor}" opacity="0.85"/>
        </svg>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([midLat, midLng], { icon, interactive: false, zIndexOffset: -1 });
      marker.addTo(map);
      arrows.push(marker);
    }

    layerRef.current = arrows;

    return () => {
      arrows.forEach((m) => m.remove());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, JSON.stringify(positions), color]);

  return null;
}

function samePositions(left = [], right = []) {
  return (
    left.length === right.length &&
    left.every(
      (position, index) =>
        position?.[0] === right[index]?.[0] && position?.[1] === right[index]?.[1],
    )
  );
}

function RoutePolylineView({ positions, color = "var(--primary)", showArrows = true }) {
  if (!positions?.length) return null;
  return (
    <>
      <Polyline positions={positions} pathOptions={{ color, weight: 5, opacity: 0.82, lineCap: "round", lineJoin: "round" }} />
      {showArrows && positions.length >= 3 && <ArrowDecorators positions={positions} color={color} />}
    </>
  );
}

export const RoutePolyline = memo(
  RoutePolylineView,
  (previous, next) =>
    previous.color === next.color &&
    previous.showArrows === next.showArrows &&
    samePositions(previous.positions, next.positions),
);
