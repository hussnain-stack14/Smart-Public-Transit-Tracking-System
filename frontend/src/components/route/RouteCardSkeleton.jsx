import { Card } from "../common/Card";

export function RouteCardSkeleton() {
  return <Card className="animate-pulse p-5"><div className="flex items-start justify-between"><span className="h-10 w-12 rounded-xl bg-[var(--skeleton)]" /><span className="h-4 w-16 rounded-full bg-[var(--skeleton)]" /></div><div className="mt-5 h-5 w-3/4 rounded bg-[var(--skeleton)]" /><div className="mt-5 grid gap-3"><span className="h-4 w-2/3 rounded bg-[var(--skeleton)]" /><span className="h-3 w-4 rounded bg-[var(--skeleton)]" /><span className="h-4 w-1/2 rounded bg-[var(--skeleton)]" /></div><div className="mt-6 h-4 w-24 rounded bg-[var(--skeleton)]" /></Card>;
}
