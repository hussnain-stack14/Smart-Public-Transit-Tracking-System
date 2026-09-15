import { cn } from "../../lib/utils/cn";

const tones = {
  success: "bg-[#e4f5ed] text-[var(--success)]",
  warning: "bg-[#fff2d9] text-[var(--warning)]",
  danger: "bg-[#fde8e8] text-[var(--danger)]",
  neutral: "bg-[#edf3f1] text-[var(--muted)]",
};

export function Badge({ tone = "neutral", className, ...props }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)} {...props} />;
}
