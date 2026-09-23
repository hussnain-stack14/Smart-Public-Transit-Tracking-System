"use client";

import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { BusFront, MapPin, UserRound } from "lucide-react";

function createTransitIcon({ type, Icon, size, iconSize, iconAnchor, popupAnchor }) {
  const html = renderToStaticMarkup(
    <span className={`transit-map-marker transit-map-marker--${type}`} aria-hidden="true">
      <Icon size={size} strokeWidth={2.35} />
    </span>,
  );

  return L.divIcon({
    className: "transit-map-icon",
    html,
    iconSize,
    iconAnchor,
    popupAnchor,
  });
}

export const busMapIcon = createTransitIcon({
  type: "bus",
  Icon: BusFront,
  size: 20,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -21],
});

export const stopMapIcon = createTransitIcon({
  type: "stop",
  Icon: MapPin,
  size: 17,
  iconSize: [32, 38],
  iconAnchor: [16, 36],
  popupAnchor: [0, -35],
});

export const selectedStopMapIcon = createTransitIcon({
  type: "selected-stop",
  Icon: MapPin,
  size: 20,
  iconSize: [38, 44],
  iconAnchor: [19, 42],
  popupAnchor: [0, -41],
});

export const userMapIcon = createTransitIcon({
  type: "user",
  Icon: UserRound,
  size: 18,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

export const passengerMapIcon = createTransitIcon({
  type: "passenger",
  Icon: UserRound,
  size: 18,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});
