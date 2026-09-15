"use client";

import { LocateFixed, Plus, Minus, ScanSearch } from "lucide-react";
import { useMap } from "react-leaflet";
import { Button } from "../common/Button";

export function MapControls({ onLocate, onShowAll }) {
  const map = useMap();
  return <div className="absolute right-3 top-3 z-[400] grid gap-2"><Button title="Zoom in" aria-label="Zoom in" className="!h-10 !min-h-10 !w-10 !p-0" onClick={() => map.zoomIn()}><Plus size={18} /></Button><Button title="Zoom out" aria-label="Zoom out" variant="secondary" className="!h-10 !min-h-10 !w-10 !p-0" onClick={() => map.zoomOut()}><Minus size={18} /></Button>{onShowAll && <Button title="Show transit network" aria-label="Show transit network" variant="secondary" className="!h-10 !min-h-10 !w-10 !p-0" onClick={onShowAll}><ScanSearch size={17} /></Button>}{onLocate && <Button title="Use my location" aria-label="Use my location" variant="secondary" className="!h-10 !min-h-10 !w-10 !p-0" onClick={() => onLocate(map)}><LocateFixed size={18} /></Button>}</div>;
}
