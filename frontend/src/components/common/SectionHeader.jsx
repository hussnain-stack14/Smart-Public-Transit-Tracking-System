export function SectionHeader({ title, description, action }) {
  return <div className="flex items-end justify-between gap-4"><div><h2 className="text-lg font-bold text-[var(--foreground)]">{title}</h2>{description && <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>}</div>{action}</div>;
}
