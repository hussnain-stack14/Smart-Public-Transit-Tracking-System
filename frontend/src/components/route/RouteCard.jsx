import Link from "next/link";
import { ArrowUpRight, CircleDot, MapPinned } from "lucide-react";
import { Card } from "../common/Card";

export function RouteCard({ route }) {
  const routeId = route._id || route.id || route.number;
  const routeNumber = route.number || route.routeCode;
  return <Card className="flex h-full flex-col p-5"><div className="flex items-start justify-between gap-3"><span className="grid min-h-10 min-w-10 place-items-center rounded-xl bg-[#e3f3ec] px-2 text-sm font-bold text-[var(--primary)]">{routeNumber || "Route"}</span>{route.isActive !== false && <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--success)]"><span className="h-1.5 w-1.5 rounded-full bg-current" /> Active</span>}</div><h3 className="mt-4 text-lg font-bold text-[var(--foreground)]">{route.routeName || route.name}</h3><div className="mt-4 grid gap-2 text-sm text-[var(--muted)]"><span className="inline-flex items-center gap-2"><CircleDot size={15} className="text-[var(--primary)]" /> {route.startPoint || route.start}</span><span className="ml-[7px] h-3 border-l border-dashed border-[var(--border)]" /><span className="inline-flex items-center gap-2"><MapPinned size={15} className="text-[var(--primary)]" /> {route.endPoint || route.end}</span></div>{route.description && <p className="mt-4 line-clamp-2 text-sm leading-6 text-[var(--muted)]">{route.description}</p>}<div className="mt-auto flex items-center justify-end border-t border-[var(--border)] pt-4"><Link href={`/routes/${routeId}`} className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)]">View route <ArrowUpRight size={15} /></Link></div></Card>;
}
