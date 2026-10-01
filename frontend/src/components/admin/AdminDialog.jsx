"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "../common/Button";
import { cn } from "../../lib/utils/cn";

export function AdminDialog({ id, title, descriptionId, busy, onClose, children, className }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => { element.close(); document.body.style.overflow = overflow; };
  }, []);
  function cancel(event) { event.preventDefault(); if (!busy) onClose(); }
  return <dialog ref={dialog} aria-labelledby={id + "-title"} aria-describedby={descriptionId} onCancel={cancel} onKeyDown={(event) => { if (event.key === "Escape") cancel(event); }} className={cn("m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-2xl border border-[var(--border)] bg-white p-5 text-[var(--foreground)] shadow-2xl backdrop:bg-black/40 sm:p-6", className)}>
    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-4"><h2 id={id + "-title"} className="text-xl font-bold">{title}</h2><Button type="button" variant="ghost" className="min-h-11 min-w-11 shrink-0 px-2" aria-label="Close dialog" disabled={busy} onClick={onClose}><X size={20} aria-hidden="true" /></Button></div>
    {children}
  </dialog>;
}
