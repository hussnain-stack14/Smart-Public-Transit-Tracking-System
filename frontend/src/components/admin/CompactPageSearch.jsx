"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

// Each page owns its query, so this filters only data already loaded for that page.
export function CompactPageSearch({ label, placeholder, value, onChange, className = "" }) {
  const [open, setOpen] = useState(Boolean(value));
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function close() {
    onChange("");
    setOpen(false);
  }

  return <div className={`compact-page-search ${className}`}>
    {open ? <label className="compact-page-search__field">
      <Search size={16} aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <input ref={inputRef} type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={label} />
      <button type="button" onClick={close} aria-label={`Close ${label.toLowerCase()}`}><X size={16} /></button>
    </label> : <button type="button" className="compact-page-search__trigger" onClick={() => setOpen(true)} aria-label={label} title={label}><Search size={17} /></button>}
  </div>;
}