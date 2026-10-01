import { cn } from "../../lib/utils/cn";

export function Card({ className, ...props }) {
  return <section className={cn("ui-card relative rounded-2xl border border-[var(--border)] bg-white/[.88] shadow-[var(--shadow-card)] backdrop-blur-xl", className)} {...props} />;
}
