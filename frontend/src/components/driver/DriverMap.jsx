"use client";

import { useMemo } from "react";
import { ClientTransitMap } from "../map/MapShell";
import { BusMarker } from "../map/BusMarker";
import { StopMarker } from "../map/StopMarker";
import { RoutePolyline } from "../map/RoutePolyline";
import { MapControls } from "../map/MapControls";
import { MapViewport } from "../map/MapViewport";
import { getBusPosition } from "../../lib/transit/format";

export function DriverMap({ bus, stops, nextStopId, connection }) {
  const busPosition = useMemo(() => getBusPosition(bus), [bus]);
  const mappedStops = useMemo(() => stops.filter((stop) => Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude)), [stops]);
  const routePositions = useMemo(() => mappedStops.map((stop) => [stop.latitude, stop.longitude]), [mappedStops]);
  const mapPositions = useMemo(() => busPosition ? [...routePositions, busPosition] : routePositions, [routePositions, busPosition]);

  return (
    <section id="driver-map" className="min-w-0 scroll-mt-20 overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-1" aria-label="Assigned bus and route map">
      <div className="px-4 py-3"><h2 className="font-bold">Live route map</h2><p className="mt-1 text-xs text-[var(--muted)]">{busPosition ? "Showing the last saved bus position." : "No bus location received yet."} Route lines connect recorded stops.</p>{connection !== "Connected" && <p role="status" className="mt-2 text-xs text-[var(--warning)]">Live feed: {connection}. Showing saved information while live updates reconnect.</p>}</div>
      <ClientTransitMap center={busPosition || routePositions[0] || [31.4187, 73.0791]} zoom={14} className="h-[min(60vh,560px)] min-h-80 rounded-xl">
        <MapViewport positions={mapPositions} focusKey={bus._id} />
        <RoutePolyline positions={routePositions} />
        {mappedStops.map((stop) => <StopMarker key={stop._id} position={[stop.latitude, stop.longitude]} stop={{ ...stop, name: `${stop.stopName}${stop._id === nextStopId ? " (Next stop)" : ""}` }} />)}
        {busPosition && <BusMarker position={busPosition} bus={bus} />}
        <MapControls onShowAll={(map) => mapPositions.length && map.fitBounds(mapPositions, { padding: [32, 32], maxZoom: 15 })} />
      </ClientTransitMap>
    </section>
  );
}

