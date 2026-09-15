import { Card } from "../common/Card";

export function RouteDetailsSkeleton() {
  return <div className="animate-pulse"><div className="h-4 w-24 rounded bg-[#e6f0ec]" /><div className="mt-5 h-9 w-2/3 rounded bg-[#e6f0ec]" /><div className="mt-3 h-5 w-1/2 rounded bg-[#e6f0ec]" /><div className="mt-8 h-72 rounded-2xl bg-[#e6f0ec]" /><div className="mt-6 grid gap-4 lg:grid-cols-2"><Card className="h-72 bg-[#e6f0ec] shadow-none" /><Card className="h-72 bg-[#e6f0ec] shadow-none" /></div></div>;
}
