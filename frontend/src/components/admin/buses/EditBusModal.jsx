"use client";

import { useEffect, useRef, useState } from "react";
import { Edit3, X } from "lucide-react";
import { Button } from "../../common/Button";
import { busService } from "../../../services/busService";

const VALID_STATUSES = ["active", "idle", "maintenance"];

export function EditBusModal({ isOpen, onClose, onUpdated, bus, routes = [] }) {
  const [busNumber, setBusNumber] = useState(bus?.busNumber || "");
  const [routeId, setRouteId] = useState(bus?.route?._id || bus?.route || "");
  const [capacity, setCapacity] = useState(bus?.capacity ?? "");
  const [availableSeats, setAvailableSeats] = useState(bus?.availableSeats ?? "");
  const [status, setStatus] = useState(bus?.status || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const inFlight = useRef(false);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);


  if (!isOpen || !bus) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (inFlight.current) return;
    setError("");

    const trimmedBusNumber = busNumber.trim();
    if (!trimmedBusNumber) {
      setError("Bus number is required.");
      return;
    }
    if (!routeId) {
      setError("Please select a route.");
      return;
    }
    const capNum = Number(capacity);
    const seatsNum = Number(availableSeats);
    if (!Number.isInteger(capNum) || capNum <= 0) {
      setError("Capacity must be a positive integer.");
      return;
    }
    if (!Number.isInteger(seatsNum) || seatsNum < 0) {
      setError("Available seats cannot be negative.");
      return;
    }
    if (seatsNum > capNum) {
      setError(`Available seats (${seatsNum}) cannot exceed total capacity (${capNum}).`);
      return;
    }
    if (!VALID_STATUSES.includes(status)) {
      setError("Invalid status selected.");
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    try {
      const busId = bus._id || bus.id;
      const updatedBus = await busService.update(busId, {
        busNumber: trimmedBusNumber,
        route: routeId,
        capacity: capNum,
        availableSeats: seatsNum,
        status,
      });
      if (mounted.current) { await onUpdated(updatedBus); if (mounted.current) onClose(); }
    } catch (err) {
      if (mounted.current) {
        const status = err.response?.status;
        const duplicate = String(err.response?.data?.error || "").includes("E11000");
        setError(status === 403 ? "Administrator permission is required to manage buses." : status === 404 ? "This bus is no longer available. Refresh the fleet." : duplicate ? "This bus number is already registered. Choose a different number." : "Unable to save the bus. Check your connection and try again.");
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-bus-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e5f4ee] text-[var(--primary)]">
              <Edit3 size={18} />
            </span>
            <div>
              <h2 id="edit-bus-modal-title" className="text-lg font-bold text-[var(--foreground)]">
                Edit Transit Bus
              </h2>
              <p className="text-xs text-[var(--muted)]">Update operational details for {bus.busNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 rounded-lg p-1.5 text-[var(--muted)] hover:bg-[#f0f8f4] hover:text-[var(--foreground)]"
            disabled={submitting}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-[#f4cccc] bg-[#fff8f8] p-3 text-xs text-[var(--danger)]" role="alert">
            {error}
          </div>
        )}

        <form aria-busy={submitting} onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="edit-busNumber" className="block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-1.5">
              Bus Number *
            </label>
            <input
              id="edit-busNumber"
              type="text"
              required
              disabled={submitting}
              value={busNumber}
              onChange={(e) => setBusNumber(e.target.value)}
              className="field-input text-sm"
            />
          </div>

          <div>
            <label htmlFor="edit-route" className="block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-1.5">
              Assigned Route *
            </label>
            <select
              id="edit-route"
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              className="field-input text-sm"
              required
              disabled={submitting}
            >
              <option value="" disabled>Select route</option>
              {routes.map((r) => (
                <option key={r._id || r.id} value={r._id || r.id}>
                  {r.routeName} ({r.startPoint} ↔ {r.endPoint})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-capacity" className="block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-1.5">
                Capacity *
              </label>
              <input
                id="edit-capacity"
                type="number"
                min="1"
                required
                disabled={submitting}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="field-input text-sm"
              />
            </div>
            <div>
              <label htmlFor="edit-availableSeats" className="block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-1.5">
                Available Seats *
              </label>
              <input
                id="edit-availableSeats"
                type="number"
                min="0"
                max={capacity}
                required
                disabled={submitting}
                value={availableSeats}
                onChange={(e) => setAvailableSeats(e.target.value)}
                className="field-input text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-status" className="block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-1.5">
              Operational Status *
            </label>
            <select
              id="edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="field-input text-sm capitalize"
              required
              disabled={submitting}
            >
              {VALID_STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-[var(--border)] pt-4">
            <Button type="button" variant="secondary" className="min-h-12" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="min-h-12" disabled={submitting}>
              {submitting ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
