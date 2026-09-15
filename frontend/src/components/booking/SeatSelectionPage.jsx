"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BusFront, Check, Circle, RefreshCw, Users } from "lucide-react";
import { Navbar } from "../navigation/Navbar";
import { Footer } from "../navigation/Footer";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { ErrorState } from "../common/ErrorState";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { BookingProgress } from "./BookingProgress";
import { busService } from "../../services/busService";
import { routeService } from "../../services/routeService";
import { bookingService } from "../../services/bookingService";
import { useAuth } from "../../hooks/useAuth";

function formatDate(value) {
  if (!value) return "Not selected";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function buildSeats(capacity) {
  return Array.from({ length: capacity }, (_, index) => {
    const row = String.fromCharCode(65 + Math.floor(index / 4));
    return `${row}${(index % 4) + 1}`;
  });
}

export default function SeatSelectionPage({ busId, travelDate }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [bus, setBus] = useState(null);
  const [route, setRoute] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const loadBus = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const busData = await busService.get(busId);
      const routeId = busData.route?._id || busData.route;
      const routeData = routeId ? await routeService.get(routeId) : null;
      setBus(busData);
      setRoute(routeData);
    } catch (requestError) {
      if (requestError.response?.status === 404) setError("not-found");
      else {
        console.error("Unable to load seat selection data", requestError);
        setError("load-error");
      }
    } finally {
      setLoading(false);
    }
  }, [busId]);

  useEffect(() => {
    Promise.resolve().then(() => loadBus());
  }, [loadBus]);

  const seats = useMemo(() => buildSeats(bus?.capacity || 0), [bus?.capacity]);
  const availableSeats = bus?.availableSeats ?? null;
  const isFull = availableSeats === 0;
  const seatAvailability = isFull ? "Full" : availableSeats == null ? "Unavailable" : "Available";

  async function continueToConfirmation() {
    if (!selectedSeat || isFull) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=/booking/${busId}/seat&date=${travelDate || ""}`);
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const booking = await bookingService.create({ bus: busId, seatNumber: selectedSeat });
      router.push(`/booking/${busId}/confirmation?booking=${booking._id || ""}`);
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to reserve this seat";
      const seatConflict = requestError.response?.status === 400 || /seat|available|reserved/i.test(message);
      setSelectedSeat(seatConflict ? "" : selectedSeat);
      setSubmitError(seatConflict ? "This seat was just reserved by another passenger. Please choose another seat." : "Unable to reserve this seat. Please try again.");
      if (seatConflict) loadBus();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageShell><div className="grid min-h-96 place-items-center"><LoadingSpinner label="Loading seat availability..." /></div></PageShell>;
  if (error === "not-found") return <PageShell><StateCard title="Bus not found" description="This bus is no longer available for booking." /></PageShell>;
  if (error || !bus) return <PageShell><ErrorState title="Unable to load seats" description="We couldn't retrieve the current seat availability." action={<Button type="button" variant="secondary" onClick={loadBus}><RefreshCw size={16} /> Try again</Button>} /></PageShell>;

  return <PageShell><div className="flex items-center gap-2 text-sm text-[var(--muted)]"><Link href="/booking" className="font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)]"><ArrowLeft size={15} className="mr-1 inline" /> Trip Details</Link><span>/</span><span>Seat Selection</span></div><header className="mt-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">Step 2 of 3</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">Select your seat.</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Choose an available seat for your journey.</p></header><BookingProgress currentStep={2}>
    </BookingProgress><Card className="mt-6 p-4 sm:p-5"><div className="grid gap-3 sm:grid-cols-3"><SummaryItem label="Route" value={route?.routeName || bus.route?.routeName || "Not available"} /><SummaryItem label="Bus" value={bus.busNumber} /><SummaryItem label="Date" value={formatDate(travelDate)} /></div></Card><div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start"><Card className="p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-[var(--foreground)]">Bus Seat Map</h2><p className="mt-1 text-sm text-[var(--muted)]">Front of bus</p></div><Badge tone={seatAvailability === "Full" ? "danger" : "success"}>{availableSeats == null ? "Availability unavailable" : `${availableSeats} available`}</Badge></div>{seats.length ? <div className="mx-auto mt-6 max-w-sm rounded-[2rem] border-2 border-[#cfe5dc] bg-[#f5f8f7] p-4"><div className="mb-5 rounded-xl bg-[#e3f3ec] px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">Driver / front</div><div className="grid gap-3">{Array.from({ length: Math.ceil(seats.length / 4) }, (_, rowIndex) => <div key={rowIndex} className="grid grid-cols-5 gap-2">{seats.slice(rowIndex * 4, rowIndex * 4 + 4).map((seat, index) => <SeatButton key={seat} seat={seat} selected={selectedSeat === seat} disabled={isFull} onSelect={setSelectedSeat} className={index === 2 ? "col-start-4" : ""} />)}</div>)}</div></div> : <p className="mt-6 text-sm text-[var(--muted)]">No seat layout is available for this bus.</p>}<div className="mt-6 flex flex-wrap gap-4 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted)]"><Legend color="bg-white border-[#b9d8cc]" label="Available" /><Legend color="bg-[var(--primary)] border-[var(--primary)]" label="Selected" /><Legend color="bg-[#e5e9e7] border-[#cbd5d1]" label="Unavailable" /></div>{availableSeats != null && availableSeats < (bus.capacity || availableSeats) && <p className="mt-4 text-xs leading-5 text-[var(--muted)]">The backend provides a total available-seat count, but not individual reserved-seat positions. The final reservation is validated by the backend.</p>}</Card><Card className="p-5 sm:p-6 lg:sticky lg:top-24"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e4f5ed] text-[var(--primary)]"><BusFront size={19} /></span><div><h2 className="text-xl font-bold text-[var(--foreground)]">Trip Summary</h2><p className="mt-1 text-sm text-[var(--muted)]">Review before continuing.</p></div></div><dl className="mt-6 grid gap-4 border-t border-[var(--border)] pt-5 text-sm"><SummaryItem label="Route" value={route?.routeName || bus.route?.routeName || "Not available"} /><SummaryItem label="Bus" value={bus.busNumber} /><SummaryItem label="Date" value={formatDate(travelDate)} /><SummaryItem label="Time" value="Not selected" /><SummaryItem label="Selected seat" value={selectedSeat || "Select a seat"} /></dl><div className="mt-5 flex items-center gap-2 rounded-xl bg-[#f5f8f7] p-3 text-sm text-[var(--muted)]"><Users size={16} className="text-[var(--primary)]" /> {availableSeats == null ? "Seat availability unavailable" : `${availableSeats} seats available`}</div>{submitError && <p className="mt-4 text-sm leading-5 text-[var(--danger)]">{submitError}</p>}{!authLoading && !isAuthenticated && <p className="mt-4 text-sm leading-5 text-[var(--muted)]">Log in is required before the seat can be reserved.</p>}<Button type="button" className="mt-6 w-full gap-2" disabled={!selectedSeat || isFull || submitting} onClick={continueToConfirmation}>{submitting ? "Processing..." : isAuthenticated ? "Continue to Confirmation" : "Log in to continue"}<ArrowRight size={16} /></Button></Card></div></PageShell>;
}

function PageShell({ children }) {
  return <div className="min-h-screen overflow-x-hidden bg-[var(--background)]"><Navbar /><main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">{children}</main><Footer /></div>;
}

function SummaryItem({ label, value }) {
  return <div><p className="text-xs text-[var(--muted)]">{label}</p><p className="mt-1 truncate font-semibold text-[var(--foreground)]">{value}</p></div>;
}

function SeatButton({ seat, selected, disabled, onSelect, className = "" }) {
  return <button type="button" disabled={disabled} aria-label={`Seat ${seat}, ${disabled ? "unavailable" : selected ? "selected" : "available"}`} aria-pressed={selected} className={`grid min-h-11 min-w-0 place-items-center rounded-lg border text-xs font-bold transition ${selected ? "border-[var(--primary)] bg-[var(--primary)] text-white" : disabled ? "cursor-not-allowed border-[#cbd5d1] bg-[#e5e9e7] text-[#82928b]" : "border-[#b9d8cc] bg-white text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[#e3f3ec]"} ${className}`} onClick={() => onSelect(seat)}>{selected ? <Check size={15} /> : seat}</button>;
}

function Legend({ color, label }) {
  return <span className="inline-flex items-center gap-2"><Circle size={12} className={color} fill="currentColor" /> {label}</span>;
}

function StateCard({ title, description }) {
  return <Card className="mx-auto max-w-lg p-8 text-center"><h1 className="text-2xl font-bold text-[var(--foreground)]">{title}</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p><Link href="/booking" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white">Back to booking</Link></Card>;
}
