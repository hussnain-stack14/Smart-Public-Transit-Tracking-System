import { Card } from "../common/Card";

export function BusDetailsSkeleton() {
  return <div className="animate-pulse"><div className="h-4 w-28 rounded bg-[var(--skeleton)]" /><div className="mt-5 h-9 w-48 rounded bg-[var(--skeleton)]" /><div className="mt-3 h-5 w-72 rounded bg-[var(--skeleton)]" /><div className="mt-8 h-72 rounded-2xl bg-[var(--skeleton)]" /><div className="mt-6 grid gap-4 lg:grid-cols-2"><Card className="h-56 bg-[var(--skeleton)] shadow-none" /><Card className="h-56 bg-[var(--skeleton)] shadow-none" /></div></div>;
}
