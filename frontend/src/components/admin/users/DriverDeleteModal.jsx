"use client";

import { useEffect, useRef, useState } from "react";
import { AdminDialog } from "../AdminDialog";
import { Button } from "../../common/Button";
import { adminService } from "../../../services/adminService";
import { getAdminError } from "../../../lib/transit/adminErrors";

export function DriverDeleteModal({ driver, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const mounted = useRef(false);
  const request = useRef(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current?.abort(); }; }, []);
  function close() { if (!inFlight.current) onClose(); }
  async function submit(event) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError("");
    request.current = new AbortController();
    try {
      await adminService.deleteDriver(driver._id, { signal: request.current.signal });
      if (mounted.current) { await onDeleted("Driver permanently deleted. Bus assignment links were cleared."); if (mounted.current) onClose(); }
    } catch (requestError) {
      if (mounted.current) setError(getAdminError(requestError, "Unable to delete the driver. Check your connection and try again."));
    } finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }
  return <AdminDialog id="driver-delete" title="Delete Driver?" descriptionId="driver-delete-help" busy={busy} onClose={close}>
    <p id="driver-delete-help" className="mt-4 break-words text-sm leading-6">This will permanently remove <strong>{driver.name}</strong> ({driver.email}) and clear their bus assignment. The account cannot be recovered.</p>
    <form onSubmit={submit} aria-busy={busy} className="mt-4 grid gap-4">{error && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}<div className="flex flex-wrap justify-end gap-3 border-t border-[var(--border)] pt-4"><Button type="button" variant="secondary" className="min-h-12" disabled={busy} onClick={close}>Cancel</Button><Button type="submit" variant="danger" className="min-h-12" disabled={busy}>{busy ? "Deleting..." : "Delete Driver"}</Button></div></form>
  </AdminDialog>;
}
