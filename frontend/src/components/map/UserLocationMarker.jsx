"use client";

import { Marker, Popup } from "react-leaflet";
import { isValidPosition } from "../../lib/transit/coordinates";
import { userMapIcon } from "./transitMarkerIcons";

export function UserLocationMarker({ location }) {
  const position = location?.position;
  if (!isValidPosition(position)) return null;

  return <Marker position={position} icon={userMapIcon} title="Your current location" zIndexOffset={500} riseOnHover>
    <Popup><strong>Your current location</strong>{Number.isFinite(location.accuracy) && <p className="mt-1">Accuracy: about {Math.round(location.accuracy)} m</p>}</Popup>
  </Marker>;
}
