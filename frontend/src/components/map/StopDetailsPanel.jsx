import Link from "next/link";
import { ArrowRight, BusFront, X } from "lucide-react";
import { Badge } from "../common/Badge";
import { Card } from "../common/Card";

export function StopDetailsPanel({ stop, onClose }) {
  if (!stop) return null;

  return <Card className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">Transit stop</p><h2 className="mt-1 text-lg font-bold text-[var(--foreground)]">{stop.name}</h2></div><button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-[#eef7f3] hover:text-[var(--foreground)]" aria-label="Close stop details"><X size={17} /></button></div><div className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4"><div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-sm text-[var(--muted)]"><BusFront size={15} /> Routes serving this stop</span><Badge tone="success">2 routes</Badge></div><div className="grid gap-2 text-sm"><div className="flex items-center justify-between rounded-xl bg-[#f5f8f7] px-3 py-2"><span className="font-semibold text-[var(--foreground)]">R-04</span><span className="text-[var(--muted)]">Next bus: 4 min</span></div><div className="flex items-center justify-between rounded-xl bg-[#f5f8f7] px-3 py-2"><span className="font-semibold text-[var(--foreground)]">R-07</span><span className="text-[var(--muted)]">Next bus: 9 min</span></div></div></div><Link href="/routes" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)]">View routes <ArrowRight size={15} /></Link></Card>;
}
