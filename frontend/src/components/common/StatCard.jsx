import { Card } from "./Card";

export function StatCard({ label, value, detail, icon: Icon }) {
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-2 text-2xl font-bold text-[var(--foreground)]">{value}</p>{detail && <p className="mt-1 text-xs text-[var(--muted)]">{detail}</p>}</div>{Icon && <span className="rounded-xl bg-[#e5f4ee] p-2.5 text-[var(--primary)]"><Icon size={18} /></span>}</div></Card>;
}
