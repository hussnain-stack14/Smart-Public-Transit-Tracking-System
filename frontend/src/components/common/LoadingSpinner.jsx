export function LoadingSpinner({ label = "Loading" }) {
  return <span className="inline-flex items-center gap-2 text-sm text-[var(--muted)]" role="status"><span className="h-4 w-4 animate-spin rounded-full border-2 border-[#c8ded6] border-t-[var(--primary)]" />{label}</span>;
}
