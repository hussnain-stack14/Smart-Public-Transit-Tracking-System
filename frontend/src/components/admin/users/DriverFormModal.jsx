"use client";

import { useEffect, useRef, useState } from "react";
import { AdminDialog } from "../AdminDialog";
import { Button } from "../../common/Button";
import { Input } from "../../common/Input";
import { adminService } from "../../../services/adminService";
import { getAdminError } from "../../../lib/transit/adminErrors";

export function DriverFormModal({ driver, onClose, onSaved }) {
  const editing = Boolean(driver);
  const [name, setName] = useState(driver?.name || "");
  const [email, setEmail] = useState(driver?.email || "");
  const [phone, setPhone] = useState(driver?.phone || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const password = useRef(null);
  const confirmation = useRef(null);
  const inFlight = useRef(false);
  const mounted = useRef(false);
  const request = useRef(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current?.abort(); }; }, []);
  function close() { if (!inFlight.current) onClose(); }
  async function submit(event) {
    event.preventDefault();
    if (inFlight.current) return;
    setError("");
    const fields = { name: name.trim(), email: email.trim().toLowerCase() };
    if (!fields.name) { setError("Driver name is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) { setError("Enter a valid email address."); return; }
    if (editing || phone.trim()) fields.phone = phone.trim();
    if (!editing) {
      const value = password.current.value;
      if (value.length < 6) { setError("Password must contain at least 6 characters."); return; }
      if (value !== confirmation.current.value) { setError("Passwords do not match."); return; }
      fields.password = value;
    }
    inFlight.current = true;
    setBusy(true);
    request.current = new AbortController();
    try {
      if (editing) await adminService.updateDriver(driver._id, fields, { signal: request.current.signal });
      else await adminService.createDriver(fields, { signal: request.current.signal });
      if (!mounted.current) return;
      if (!editing) { password.current.value = ""; confirmation.current.value = ""; }
      if (mounted.current) { await onSaved(editing ? "Driver updated." : "Driver created. They can sign in with their email and password."); if (mounted.current) onClose(); }
    } catch (requestError) {
      if (mounted.current) setError(getAdminError(requestError, "Unable to save the driver. Check your connection and try again."));
    } finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }
  return <AdminDialog id="driver-editor" title={editing ? "Edit Driver" : "Add Driver"} descriptionId="driver-editor-help" busy={busy} onClose={close}>
    <p id="driver-editor-help" className="mt-4 text-sm leading-6 text-[var(--muted)]">{editing ? "Update the driver's name, login email and optional phone." : "Create a driver account. The driver will sign in using their email and password."}</p>
    <form onSubmit={submit} noValidate aria-busy={busy} className="mt-4 grid gap-4">
      <Input id="driver-name" label="Name" required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} disabled={busy} className="min-h-12 w-full" />
      <Input id="driver-email" label="Email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} className="min-h-12 w-full" />
      <Input id="driver-phone" label="Phone (optional)" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} disabled={busy} className="min-h-12 w-full" />
      {!editing && <><label htmlFor="driver-password" className="grid gap-2 text-sm font-medium">Password<input ref={password} id="driver-password" type="password" required minLength={6} autoComplete="new-password" disabled={busy} className="field-input min-h-12" aria-describedby="driver-password-help" /></label><p id="driver-password-help" className="-mt-2 text-xs text-[var(--muted)]">At least 6 characters. The password will not be displayed after creation.</p><label htmlFor="driver-confirm-password" className="grid gap-2 text-sm font-medium">Confirm password<input ref={confirmation} id="driver-confirm-password" type="password" required autoComplete="new-password" disabled={busy} className="field-input min-h-12" /></label></>}
      {error && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}
      <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--border)] pt-4"><Button type="button" variant="secondary" className="min-h-12" disabled={busy} onClick={close}>Cancel</Button><Button type="submit" className="min-h-12" disabled={busy}>{busy ? "Saving..." : editing ? "Save Changes" : "Create Driver"}</Button></div>
    </form>
  </AdminDialog>;
}
