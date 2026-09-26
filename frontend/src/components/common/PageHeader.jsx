export function PageHeader({ eyebrow, title, description, action }) {
  return <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow && <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary-ink)]">{eyebrow}</p>}<h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>}</div>{action}</header>;
}
