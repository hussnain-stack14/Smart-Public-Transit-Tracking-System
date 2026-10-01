export function ErrorState({ title = "Something went wrong", description = "Please try again in a moment.", action }) {
  return <div className="rounded-2xl border border-[#f4cccc] bg-[#fff8f8] p-6 text-center"><h3 className="font-semibold text-[var(--danger)]">{title}</h3><p className="mt-1 text-sm text-[var(--muted)]">{description}</p>{action && <div className="mt-4">{action}</div>}</div>;
}
