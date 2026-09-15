"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, BusFront, CheckCircle2, Clock3, MapPin, RefreshCw, Ticket } from "lucide-react";
import { Navbar } from "../navigation/Navbar";
import { Footer } from "../navigation/Footer";
import { BookingProgress } from "./BookingProgress";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { ErrorState } from "../common/ErrorState";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { bookingService } from "../../services/bookingService";
import { busService } from "../../services/busService";
import { routeService } from "../../services/routeService";
import { useAuth } from "../../hooks/useAuth";

function formatDate(value) {
  if (!value) return "Not provided";
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ConfirmationPage({ bookingId }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [booking, setBooking] = useState(null);
  const [bus, setBus] = useState(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadConfirmation = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError("");
    try {
      const bookingsResponse = await bookingService.listMine();
      const bookings = Array.isArray(bookingsResponse) ? bookingsResponse : bookingsResponse.bookings || [];
      const currentBooking = bookings.find((item) => item._id === bookingId);
      if (!currentBooking) {
        setError("not-found");
        return;
      }
      const busId = currentBooking.bus?._id || currentBooking.bus;
      const busData = currentBooking.bus?._id ? currentBooking.bus : await busService.get(busId);
      const routeId = busData.route?._id || busData.route;
      const routeData = routeId ? await routeService.get(routeId) : null;
      setBooking(currentBooking);
      setBus(busData);
      setRoute(routeData);
    } catch (requestError) {
      if (requestError.response?.status === 401) setError("auth");
      else {
        console.error("Unable to load booking confirmation", requestError);
        setError("error");
      }
    } finally {
      setLoading(false);
    }
  }, [bookingId, isAuthenticated]);

  useEffect(() => {
    Promise.resolve().then(() => loadConfirmation());
  }, [loadConfirmation]);

  if (authLoading || loading) return <PageShell><div className="grid min-h-96 place-items-center"><LoadingSpinner label="Loading booking confirmation..." /></div></PageShell>;
  if (!isAuthenticated || error === "auth") return <PageShell><StateCard title="Log in to view this booking" description="Your confirmation is available from your authenticated booking history." actionHref={`/login?redirect=/booking/${bus?._id || ""}/confirmation?booking=${bookingId}`} actionLabel="Log in" /></PageShell>;
  if (error === "not-found") return <PageShell><StateCard title="Booking not found" description="This booking does not exist in your booking history or is no longer available." actionHref="/booking" actionLabel="Back to booking" /></PageShell>;
  if (error || !booking) return <PageShell><ErrorState title="Unable to load confirmation" description="We couldn't retrieve this booking right now." action={<Button type="button" variant="secondary" onClick={loadConfirmation}><RefreshCw size={16} /> Try again</Button>} /></PageShell>;

  const routeName = route?.routeName || bus?.route?.routeName || "Route unavailable";
  const statusTone = booking.status === "confirmed" ? "success" : "neutral";

  return <PageShell><div className="mx-auto max-w-4xl"><BookingProgress currentStep={3} /><section className="mt-8 text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#dff2e8] text-[var(--success)]"><CheckCircle2 size={34} /></span><p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">Booking complete</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">Booking Confirmed</h1><p className="mt-2 text-sm text-[var(--muted)]">Your trip has been successfully booked.</p></section><Card className="mt-8 overflow-hidden"><div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] bg-[#f0f7f4] p-5 sm:flex-row sm:items-center sm:p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[var(--primary)]"><Ticket size={19} /></span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">Booking reference</p><p className="mt-1 break-all font-mono text-sm font-bold text-[var(--foreground)]">{booking._id}</p></div></div><Badge tone={statusTone}>{booking.status || "Confirmed"}</Badge></div><div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2"><div><h2 className="text-lg font-bold text-[var(--foreground)]">Trip Summary</h2><dl className="mt-5 grid gap-4 text-sm"><DetailRow label="Route" value={routeName} /><DetailRow label="Bus" value={bus?.busNumber || "Not provided"} /><DetailRow label="Travel date" value={formatDate(booking.createdAt)} /><DetailRow label="Time" value="Not provided" /><DetailRow label="Selected seat" value={booking.seatNumber || "Not assigned"} /></dl></div><div><h2 className="text-lg font-bold text-[var(--foreground)]">Journey Information</h2><div className="mt-5 grid gap-4 text-sm"><InfoRow icon={BusFront} label="Bus service" value={bus?.busNumber || "Not provided"} /><InfoRow icon={MapPin} label="Route" value={routeName} /><InfoRow icon={Clock3} label="Booking created" value={formatDate(booking.createdAt)} /></div></div></div></Card><div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center"><Link href="/booking" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"><ArrowLeft size={16} /> New booking</Link><Link href="/live-map" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]">Back to Live Map <ArrowRightIcon /></Link></div></div></PageShell>;
}

function PageShell({ children }) {
  return <div className="min-h-screen overflow-x-hidden bg-[var(--background)]"><Navbar /><main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">{children}</main><Footer /></div>;
}

function DetailRow({ label, value }) {
  return <div className="flex items-start justify-between gap-4"><dt className="text-[var(--muted)]">{label}</dt><dd className="max-w-[60%] text-right font-semibold text-[var(--foreground)]">{value}</dd></div>;
}

function InfoRow({ icon: Icon, label, value }) {
  return <div className="flex items-center gap-3 rounded-xl bg-[#f5f8f7] p-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#e4f5ed] text-[var(--primary)]"><Icon size={16} /></span><div><p className="text-xs text-[var(--muted)]">{label}</p><p className="mt-1 font-semibold text-[var(--foreground)]">{value}</p></div></div>;
}

function StateCard({ title, description, actionHref, actionLabel }) {
  return <Card className="mx-auto max-w-lg p-8 text-center"><h1 className="text-2xl font-bold text-[var(--foreground)]">{title}</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p><Link href={actionHref} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white">{actionLabel}</Link></Card>;
}

function ArrowRightIcon() {
  return <span aria-hidden="true">-&gt;</span>;
}
