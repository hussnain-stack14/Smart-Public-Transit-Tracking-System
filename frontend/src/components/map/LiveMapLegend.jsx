import { BusFront, MapPin } from "lucide-react";

export function LiveMapLegend() {
  return <div className="pointer-events-none absolute bottom-4 left-4 z-[400] flex items-center gap-3 rounded-xl border border-white/70 bg-white/95 px-3 py-2.5 text-xs shadow-lg backdrop-blur"><span className="inline-flex items-center gap-1.5 text-[var(--foreground)]"><BusFront size={14} className="text-[var(--primary)]" /> Buses</span><span className="inline-flex items-center gap-1.5 text-[var(--foreground)]"><MapPin size={14} className="text-[var(--primary)]" /> Stops</span></div>;
}
