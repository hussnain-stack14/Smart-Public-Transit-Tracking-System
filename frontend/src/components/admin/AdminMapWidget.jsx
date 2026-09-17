"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ExternalLink, Map as MapIcon } from "lucide-react";
import { ClientTransitMap } from "../map/MapShell";
import { BusMarker } from "../map/BusMarker";
import { StopMarker } from "../map/StopMarker";
import { MapControls } from "../map/MapControls";
import { MapViewport } from "../map/MapViewport";
import { getBusPosition } from "../../lib/transit/format";
import { getStopPosition, isValidPosition } from "../../lib/transit/coordinates";

export function AdminMapWidget({ buses = [], stops = [], stopsError = false, stopsLoading = false }) {
  const busPositions = useMemo(() => buses.map((bus) => ({ bus, position: getBusPosition(bus) })).filter((item) => isValidPosition(item.position)), [buses]);
  const mappedStops = useMemo(() => stops.filter((stop) => getStopPosition(stop)), [stops]);
  const allPositions = useMemo(() => [...busPositions.map((item) => item.position), ...mappedStops.map(getStopPosition)], [busPositions, mappedStops]);

  return <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[#eaf3ef] shadow-sm">
    <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-white/95 px-5 py-3.5 backdrop-blur">
      <div className="flex min-w-0 flex-wrap items-center gap-2"><MapIcon size={18} className="text-[var(--primary)]" /><h2 className="text-base font-bold">Transit Grid Overview</h2><span className="text-xs text-[var(--muted)]">({busPositions.length} live units, {mappedStops.length} stops on map)</span></div>
      <Link href="/live-map" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 text-xs font-semibold text-[var(--primary)] shadow-sm hover:bg-[#f0f8f4]">Full Live Map <ExternalLink size={13} /></Link>
    </div>
    {stopsLoading && <p role="status" className="bg-white px-5 py-3 text-sm text-[var(--muted)]">Loading route stops...</p>}
    {!stopsLoading && stopsError && <p role="alert" className="bg-white px-5 py-3 text-sm text-[var(--danger)]">Some route stops could not be loaded. Refresh the dashboard to retry.</p>}
    {mappedStops.length < stops.length && <p role="status" className="bg-white px-5 py-3 text-sm text-[var(--warning)]">Stops without valid coordinates: {stops.length - mappedStops.length}.</p>}
    <div className="h-[420px] w-full">
      <ClientTransitMap center={allPositions[0] || [31.4187, 73.0791]} zoom={13} className="h-full w-full">
        <MapViewport positions={allPositions} />
        {mappedStops.map((stop) => <StopMarker key={stop._id} position={getStopPosition(stop)} stop={stop} />)}
        {busPositions.map(({ bus, position }) => <BusMarker key={bus._id} position={position} bus={bus} />)}
        <MapControls onShowAll={(map) => allPositions.length && map.fitBounds(allPositions, { padding: [36, 36], maxZoom: 15 })} />
      </ClientTransitMap>
    </div>
  </section>;
}
