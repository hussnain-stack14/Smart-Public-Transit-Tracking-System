import { cn } from "../../lib/utils/cn";

const tones = {
  success: "bg-[var(--success-soft)] text-[var(--success)]",
  warning: "bg-[#fff2d9] text-[var(--warning)]",
  danger: "bg-[#fde8e8] text-[var(--danger)]",
  neutral: "bg-[var(--surface-subtle)] text-[var(--muted)]",
};

export function Badge({ tone = "neutral", className, ...props }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)} {...props} />;
}
