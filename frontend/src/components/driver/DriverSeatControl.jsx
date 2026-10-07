"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "../common/Button";
import { busService } from "../../services/busService";

export function DriverSeatControl({ bus, onUpdate, shiftActive }) {
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const inFlight = useRef(false);
  const mounted = useRef(false);
  const savedSeats = String(bus.availableSeats ?? "");
  const seats = draft?.savedSeats === savedSeats ? draft.value : savedSeats;
  const count = Number(seats);
  const valid = seats.trim() !== "" && Number.isInteger(count) && count >= 0 && count <= bus.capacity;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  if (bus.seatMap?.length) return <ConfiguredSeatControl bus={bus} onUpdate={onUpdate} shiftActive={shiftActive} />;

  function edit(value) {
    setDraft({ savedSeats, value });
    setError("");
    setMessage("");
  }

  async function submit(event) {
    event.preventDefault();
    if (inFlight.current) return;
    setError("");
    setMessage("");
    if (!valid) {
      setError("Enter a whole number between 0 and " + bus.capacity + ".");
      return;
    }
    inFlight.current = true;
    setBusy(true);
    try {
      const updated = await busService.updateSeats(bus._id, count);
      if (mounted.current) {
        onUpdate(updated);
        setDraft(null);
        setMessage("Seat availability updated.");
      }
    } catch (requestError) {
      if (mounted.current) setError(requestError.response?.status === 404 ? "This bus is no longer available. Refresh your dashboard." : requestError.response?.status === 403 ? "You do not have permission to update seats. Refresh your dashboard." : "Unable to update seat availability. Please try again.");
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} aria-busy={busy} className="mt-5 border-t border-[var(--border)] pt-4">
      <h3 className="font-semibold">Legacy seat count</h3>
      <p className="mt-2 text-sm leading-5 text-[var(--muted)]">This bus has no physical seat layout yet. Ask an administrator to configure it before managing individual seats.</p>
      <label htmlFor="available-seats" className="mt-3 block text-sm text-[var(--muted)]">Available seats</label>
      <div className="mt-2 flex items-center gap-2">
        <Button type="button" variant="secondary" className="min-h-12 min-w-12 shrink-0 px-3" aria-label="Decrease available seats" aria-controls="available-seats" disabled={busy || !valid || count === 0} onClick={() => edit(String(count - 1))}><Minus size={20} aria-hidden="true" /></Button>
        <input id="available-seats" type="number" min="0" max={bus.capacity} step="1" required value={seats} onChange={(event) => edit(event.target.value)} disabled={busy} className="field-input min-h-12 min-w-0 flex-1 text-center" aria-describedby={error ? "seat-help seat-error" : "seat-help"} />
        <Button type="button" variant="secondary" className="min-h-12 min-w-12 shrink-0 px-3" aria-label="Increase available seats" aria-controls="available-seats" disabled={busy || !valid || count === bus.capacity} onClick={() => edit(String(count + 1))}><Plus size={20} aria-hidden="true" /></Button>
      </div>
      <p id="seat-help" className="mt-2 text-xs leading-5 text-[var(--muted)]">Saved count: {bus.availableSeats ?? "Unavailable"} / {bus.capacity}. Adjust the count, then save. Reservations also change this count.</p>
      <p className="mt-2 text-xs text-[var(--muted)]">Passenger count and occupancy status are not provided.</p>
      <Button type="submit" disabled={busy || !shiftActive} className="mt-3 min-h-12 w-full">{busy ? "Saving..." : "Save available seats"}</Button>
      {message && <p role="status" className="mt-3 text-sm text-[var(--success)]">{message}</p>}
      {error && <p id="seat-error" role="alert" className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
    </form>
  );
}

function ConfiguredSeatControl({ bus, onUpdate, shiftActive }) {
  const [selected, setSelected] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const inFlight = useRef(false);
  const seat = bus.seatMap.find((item) => item.label === selected);
  const rows = Array.from(new Set(bus.seatMap.map((item) => item.row))).sort((a, b) => a - b);
  const columns = Math.max(1, ...bus.seatMap.map((item) => item.column + 1));
  const occupied = bus.seatMap.filter((item) => item.status === "occupied").length;
  const booked = bus.seatMap.filter((item) => item.status === "booked").length;
  const action = seat?.status === "available" ? "occupy" : seat?.status === "occupied" ? "release" : null;

  const confirmationValid = Boolean(confirmation && seat?.label === confirmation.label && seat.status === confirmation.expectedStatus);

  async function submit() {
    if (!confirmationValid || !shiftActive || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const updated = await busService.updateIndividualSeat(bus._id, confirmation.label, confirmation.action);
      onUpdate(updated);
      setMessage(`Seat ${seat.label} ${action === "occupy" ? "marked occupied" : "released"}.`);
      setConfirmation(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update this seat. Refresh and try again.");
      setConfirmation(null);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return <section className="mt-4 border-t border-[var(--border)] pt-4" aria-label="Individual seats">
    <div className="flex flex-wrap items-end justify-between gap-2"><div><h3 className="text-lg font-bold text-[var(--foreground)]">{bus.busNumber} seat map</h3><p className="mt-1 text-sm text-[var(--muted)]">Select a seat to manage a walk-in passenger.</p></div><strong className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-sm text-[var(--primary-ink)]">{bus.availableSeats} / {bus.capacity} available</strong></div>
    <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4"><Summary label="Total" value={bus.capacity} /><Summary label="Available" value={bus.availableSeats} /><Summary label="Booked" value={booked} /><Summary label="Occupied" value={occupied} /></div>
    <label className="mt-4 grid gap-2 text-sm font-semibold text-[var(--foreground)] sm:hidden" htmlFor={`driver-seat-choice-${bus._id}`}>Select a seat
      <select id={`driver-seat-choice-${bus._id}`} className="field-input min-h-12 w-full min-w-0" value={selected} disabled={busy} onChange={(event) => { setSelected(event.target.value); setConfirmation(null); setMessage(""); setError(""); }}>
        <option value="">Choose a seat</option>
        {bus.seatMap.map((item) => <option key={item.label} value={item.label}>Seat {item.label} - {item.status === "booked" ? "booked online" : item.status === "occupied" ? "walk-in occupied" : "available"}</option>)}
      </select>
    </label>
    <div className="seat-bus-shell mx-auto mt-5 max-w-sm rounded-[1.75rem] border-2 border-[var(--primary-border)] bg-[var(--background)] p-3 sm:p-5">
      <div className="mb-4 rounded-xl bg-[var(--primary-soft)] px-3 py-2 text-center text-xs font-bold uppercase tracking-widest text-[var(--primary-ink)]">Front / driver</div>
      <div className="grid gap-2">{rows.map((row, index) => {
        const rowSeats = bus.seatMap.filter((item) => item.row === row);
        const section = sectionLabel(rowSeats[0]);
        const previousSection = index ? sectionLabel(bus.seatMap.find((item) => item.row === rows[index - 1])) : null;
        return <Fragment key={row}>{section && section !== previousSection && <p className="seat-section-label">{section}</p>}<div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }, (_, column) => {
            const item = rowSeats.find((candidate) => candidate.column === column);
            if (!item) return <span key={column} aria-hidden="true" />;
            return <button key={item.label} type="button" disabled={busy} title={`Seat ${item.label}`} className={`seat-position overflow-hidden seat-position--${item.status}`} aria-pressed={selected === item.label} onClick={() => { setSelected(item.label); setConfirmation(null); setMessage(""); setError(""); }} aria-label={`Seat ${item.label}, ${item.status === "occupied" ? "occupied by walk-in passenger" : item.status === "booked" ? "booked online" : "available"}`}><span className="block max-w-full truncate px-1">{item.label}</span></button>;
          })}
        </div></Fragment>;
      })}</div>
    </div>
    <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--muted)]"><span className="seat-legend seat-legend--available">Available</span><span className="seat-legend seat-legend--booked">Booked online</span><span className="seat-legend seat-legend--occupied">Walk-in occupied</span></div>
    {!shiftActive && <p className="mt-4 text-sm text-[var(--muted)]">Start your assigned shift to manage seats.</p>}
    {seat && <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="break-words font-bold text-[var(--foreground)]">Seat {seat.label}</p><p className="mt-1 text-sm text-[var(--muted)]">{seat.status === "booked" ? "Booked through the app. This reservation cannot be changed here." : seat.status === "occupied" ? "Manually occupied by a walk-in passenger." : "Available for a walk-in passenger or online booking."}</p>
      {confirmation && !confirmationValid && <p role="status" className="mt-3 text-sm text-[var(--warning)]">This seat changed. Review its current status before confirming a new action.</p>}
      {action && shiftActive && (confirmationValid ? <div className="mt-4 flex flex-wrap gap-2"><Button type="button" disabled={busy} onClick={submit}>{busy ? "Saving..." : `Confirm ${confirmation.action === "occupy" ? "occupation" : "release"}`}</Button><Button type="button" variant="secondary" disabled={busy} onClick={() => setConfirmation(null)}>Cancel</Button></div> : <Button type="button" disabled={busy} className="mt-4 min-h-11" onClick={() => setConfirmation({ label: seat.label, action, expectedStatus: seat.status })}>{action === "occupy" ? "Mark as Occupied" : "Release Seat"}</Button>)}
    </div>}
    {message && <p role="status" className="mt-3 text-sm text-[var(--success)]">{message}</p>}
    {error && <p role="alert" className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
  </section>;
}

function Summary({ label, value }) {
  return <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-2 py-2"><strong className="block text-sm text-[var(--foreground)]">{value}</strong><span className="text-[var(--muted)]">{label}</span></div>;
}

function sectionLabel(seat) {
  if (seat?.section === "gents") return "Gents section";
  if (seat?.section === "ladies") return "Ladies section";
  return null;
}
