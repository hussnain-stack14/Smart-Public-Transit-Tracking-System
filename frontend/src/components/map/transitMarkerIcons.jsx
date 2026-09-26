"use client";

import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";

/* ─── Top-down bus SVG icon ─────────────────────────────────────────────── */
function BusTopDownSvg({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Body */}
      <rect x="5" y="3" width="18" height="22" rx="4" fill="currentColor" />
      {/* Windshield front */}
      <rect x="7" y="5" width="14" height="5" rx="1.5" fill="white" fillOpacity="0.55" />
      {/* Rear window */}
      <rect x="7" y="18" width="14" height="4" rx="1.5" fill="white" fillOpacity="0.35" />
      {/* Left windows */}
      <rect x="6" y="11.5" width="3" height="4" rx="1" fill="white" fillOpacity="0.45" />
      {/* Right windows */}
      <rect x="19" y="11.5" width="3" height="4" rx="1" fill="white" fillOpacity="0.45" />
      {/* Center stripe */}
      <rect x="12.5" y="5" width="3" height="18" rx="1" fill="white" fillOpacity="0.12" />
      {/* Front bumper */}
      <rect x="8" y="2" width="12" height="2" rx="1" fill="currentColor" opacity="0.7" />
      {/* Rear bumper */}
      <rect x="8" y="24" width="12" height="2" rx="1" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

/* ─── Stop pin SVG ──────────────────────────────────────────────────────── */
function StopPinSvg({ filled = false }) {
  return (
    <svg width="22" height="26" viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M11 0C6.03 0 2 4.03 2 9c0 6.75 9 17 9 17s9-10.25 9-17c0-4.97-4.03-9-9-9z"
        fill={filled ? "currentColor" : "white"}
        stroke="currentColor"
        strokeWidth={filled ? "0" : "2"}
      />
      <circle cx="11" cy="9" r="3.5" fill={filled ? "white" : "currentColor"} />
    </svg>
  );
}

/* ─── User location pulse icon (HTML string, not SVG) ───────────────────── */
function createUserPulseHtml() {
  return `
    <span class="transit-map-marker--user-pulse" aria-hidden="true">
      <span class="transit-map-marker--user-pulse-ring"></span>
      <span class="transit-map-marker--user-core"></span>
    </span>
  `;
}

/* ─── Factory ────────────────────────────────────────────────────────────── */
function createTransitIcon({ type, SvgComponent, iconSize, iconAnchor, popupAnchor }) {
  const html = renderToStaticMarkup(
    <span className={`transit-map-marker transit-map-marker--${type}`} aria-hidden="true">
      <SvgComponent />
    </span>,
  );
  return L.divIcon({ className: "transit-map-icon", html, iconSize, iconAnchor, popupAnchor });
}

export const busMapIcon = createTransitIcon({
  type: "bus",
  SvgComponent: () => <BusTopDownSvg size={26} />,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -24],
});

export const stopMapIcon = createTransitIcon({
  type: "stop",
  SvgComponent: () => <StopPinSvg filled={false} />,
  iconSize: [26, 30],
  iconAnchor: [13, 28],
  popupAnchor: [0, -28],
});

export const selectedStopMapIcon = createTransitIcon({
  type: "selected-stop",
  SvgComponent: () => <StopPinSvg filled={true} />,
  iconSize: [30, 35],
  iconAnchor: [15, 33],
  popupAnchor: [0, -33],
});

export const userMapIcon = L.divIcon({
  className: "transit-map-icon",
  html: createUserPulseHtml(),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -22],
});

export const passengerMapIcon = createTransitIcon({
  type: "passenger",
  SvgComponent: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="10" cy="6" r="4" fill="currentColor" />
      <path d="M2 18c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});
