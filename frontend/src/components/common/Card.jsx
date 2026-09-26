import { cn } from "../../lib/utils/cn";

export function Card({ className, ...props }) {
  return <section className={cn("ui-card rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_8px_28px_rgba(15,23,42,0.06)]", className)} {...props} />;
}
