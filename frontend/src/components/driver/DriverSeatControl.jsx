"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "../common/Button";
import { busService } from "../../services/busService";

export function DriverSeatControl({ bus, onUpdate }) {
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
      <h3 className="font-semibold">Seat availability</h3>
      <label htmlFor="available-seats" className="mt-3 block text-sm text-[var(--muted)]">Available seats</label>
      <div className="mt-2 flex items-center gap-2">
        <Button type="button" variant="secondary" className="min-h-12 min-w-12 shrink-0 px-3" aria-label="Decrease available seats" aria-controls="available-seats" disabled={busy || !valid || count === 0} onClick={() => edit(String(count - 1))}><Minus size={20} aria-hidden="true" /></Button>
        <input id="available-seats" type="number" min="0" max={bus.capacity} step="1" required value={seats} onChange={(event) => edit(event.target.value)} disabled={busy} className="field-input min-h-12 min-w-0 flex-1 text-center" aria-describedby={error ? "seat-help seat-error" : "seat-help"} />
        <Button type="button" variant="secondary" className="min-h-12 min-w-12 shrink-0 px-3" aria-label="Increase available seats" aria-controls="available-seats" disabled={busy || !valid || count === bus.capacity} onClick={() => edit(String(count + 1))}><Plus size={20} aria-hidden="true" /></Button>
      </div>
      <p id="seat-help" className="mt-2 text-xs leading-5 text-[var(--muted)]">Saved count: {bus.availableSeats ?? "Unavailable"} / {bus.capacity}. Adjust the count, then save. Reservations also change this count.</p>
      <p className="mt-2 text-xs text-[var(--muted)]">Passenger count and occupancy status are not provided.</p>
      <Button type="submit" disabled={busy} className="mt-3 min-h-12 w-full">{busy ? "Saving..." : "Save available seats"}</Button>
      {message && <p role="status" className="mt-3 text-sm text-[var(--success)]">{message}</p>}
      {error && <p id="seat-error" role="alert" className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
    </form>
  );
}
