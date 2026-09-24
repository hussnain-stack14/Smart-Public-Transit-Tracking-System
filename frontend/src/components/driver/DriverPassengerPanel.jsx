"use client";

import { LocateFixed, MapPin, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Card } from "../common/Card";

function formatTime(value) {
  if (!value) return "Time unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Time unavailable" : date.toLocaleString();
}

export function DriverPassengerPanel({ active, passengers, loading, error, onRetry }) {
  return (
    <Card className="p-5" aria-labelledby="passenger-pickups-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff2d9] text-[#9b6a19]">
            <Users size={18} />
          </span>
          <div>
            <h2 id="passenger-pickups-title" className="font-bold">
              Passenger Pickup / Nearby Passengers
            </h2>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              Private locations for confirmed bookings on your assigned bus.
            </p>
          </div>
        </div>
        {active && <Badge tone="success">Active shift</Badge>}
      </div>

      {!active ? (
        <div className="mt-4 rounded-xl bg-[#f5f8f7] p-4 text-sm leading-6 text-[var(--muted)]">
          Start your assigned shift to access opted-in passenger pickup locations. No passenger
          locations are retained on this dashboard after the shift ends.
        </div>
      ) : loading && !passengers.length ? (
        <LoadingSpinner className="mt-4" label="Loading passenger pickups..." />
      ) : error ? (
        <div className="mt-4">
          <p role="alert" className="text-sm leading-6 text-[var(--danger)]">
            {error}
          </p>
          <Button type="button" variant="secondary" className="mt-3 gap-2" onClick={onRetry}>
            <RefreshCw size={15} /> Try again
          </Button>
        </div>
      ) : passengers.length ? (
        <div className="mt-4 grid gap-3">
          {passengers.map((item) => (
            <article
              key={item.bookingId}
              className="rounded-xl border border-[var(--border)] bg-[#f8fbfa] p-3"
            >
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 shrink-0 text-[#b7791f]" size={17} />
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-[var(--foreground)]">
                    {item.passenger?.name || "Booked passenger"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {Number.isFinite(item.pickupLocation?.accuracy)
                      ? `Accuracy: about ${Math.round(item.pickupLocation.accuracy)} m`
                      : "Accuracy unavailable"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Updated {formatTime(item.pickupLocation?.timestamp)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-[#f5f8f7] p-4 text-center">
          <LocateFixed className="mx-auto text-[var(--primary)]" size={22} />
          <p className="mt-2 text-sm font-semibold">No shared pickups</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            No relevant active booking is currently sharing a passenger location.
          </p>
        </div>
      )}

      <div className="mt-4 flex items-start gap-2 border-t border-[var(--border)] pt-4 text-xs leading-5 text-[var(--muted)]">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[var(--success)]" />
        The backend restricts this list to your authenticated driver account, assigned bus, active
        shift, route, and confirmed opted-in bookings.
      </div>
    </Card>
  );
}