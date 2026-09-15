export function EmptyState({ title = "Nothing here yet", description, action }) {
  return <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-[var(--border)] p-6 text-center"><div><h3 className="font-semibold text-[var(--foreground)]">{title}</h3>{description && <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>}{action && <div className="mt-4">{action}</div>}</div></div>;
}
