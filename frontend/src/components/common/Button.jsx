import { cn } from "../../lib/utils/cn";

const variants = {
  primary: "bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]",
  secondary: "border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[#f0f7f4]",
  ghost: "text-[var(--primary)] hover:bg-[#e5f4ee]",
  danger: "bg-[var(--danger)] text-white hover:brightness-95",
};

export function Button({ className, variant = "primary", ...props }) {
  return <button className={cn("inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50", variants[variant], className)} {...props} />;
}
