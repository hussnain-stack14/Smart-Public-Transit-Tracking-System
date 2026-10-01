import { cn } from "../../lib/utils/cn";

export function Card({ className, ...props }) {
  return <section className={cn("ui-card relative rounded-2xl border border-[var(--border)] bg-white/[.92] shadow-[0_10px_30px_rgba(15,23,42,0.07)] backdrop-blur-sm", className)} {...props} />;
}
