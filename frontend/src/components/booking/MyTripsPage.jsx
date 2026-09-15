"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, BusFront, CalendarClock, RefreshCw, Ticket, XCircle } from "lucide-react";
import { Navbar } from "../navigation/Navbar";
import { Footer } from "../navigation/Footer";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { EmptyState } from "../common/EmptyState";
import { ErrorState } from "../common/ErrorState";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { bookingService } from "../../services/bookingService";
import { useAuth } from "../../hooks/useAuth";

const filters = ["all", "confirmed", "completed", "cancelled"];

function formatDate(value) {
  if (!value) return "Not provided";
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function statusTone(status) {
  if (status === "confirmed") return "success";
  if (status === "cancelled") return "danger";
  return "neutral";
}

export default function MyTripsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBookings = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError("");
    try {
      const response = await bookingService.listMine();
      const list = Array.isArray(response) ? response : response.bookings;
      if (!Array.isArray(list)) throw new Error("Unexpected bookings response");
      setBookings(list);
    } catch (requestError) {
      if (requestError.response?.status === 401) setError("auth");
      else {
        console.error("Unable to load booking history", requestError);
        setError("load");
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    Promise.resolve().then(() => loadBookings());
  }, [loadBookings]);

  const visibleBookings = useMemo(() => filter === "all" ? bookings : bookings.filter((booking) => booking.status === filter), [bookings, filter]);
  const activeBookings = bookings.filter((booking) => booking.status === "confirmed");
  const pastBookings = bookings.filter((booking) => booking.status === "completed" || booking.status === "cancelled");

  if (authLoading || loading) return <PageShell><div className="grid min-h-96 place-items-center"><LoadingSpinner label="Loading your trips..." /></div></PageShell>;
  if (!isAuthenticated || error === "auth") return <PageShell><StateCard title="Log in to view your trips" description="Your booking history is available after you log in." actionHref="/login?redirect=/my-trips" actionLabel="Log in" /></PageShell>;
  if (error === "load") return <PageShell><ErrorState title="Unable to load trips" description="We couldn't retrieve your booking history right now." action={<Button type="button" variant="secondary" onClick={loadBookings}><RefreshCw size={16} /> Try again</Button>} /></PageShell>;

  return <PageShell><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">Your travel</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">My Trips</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">View and manage your upcoming and previous trips.</p></header><div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Trip filters">{filters.map((value) => <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => setFilter(value)} className={`min-h-10 rounded-xl px-4 text-sm font-semibold capitalize transition ${filter === value ? "bg-[var(--primary)] text-white" : "border border-[var(--border)] bg-white text-[var(--muted)] hover:text-[var(--primary)]"}`}>{value === "all" ? "All" : value}</button>)}</div>{bookings.length === 0 ? <div className="mt-8"><EmptyState title="No trips yet" description="You haven't booked any trips yet." action={<Link href="/booking" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white">Book a Trip <ArrowRight size={16} /></Link>} /></div> : visibleBookings.length === 0 ? <div className="mt-8"><EmptyState title="No matching trips" description="There are no bookings with this status." action={<Button type="button" variant="secondary" onClick={() => setFilter("all")}>View all trips</Button>} /></div> : <div className="mt-8 grid gap-8">{(filter === "all" || filter === "confirmed") && activeBookings.length > 0 && <TripSection title="Upcoming Trips" icon={CalendarClock} bookings={filter === "all" ? activeBookings : visibleBookings} />}{(filter === "all" || filter === "completed" || filter === "cancelled") && pastBookings.length > 0 && <TripSection title="Past Trips" icon={Ticket} bookings={filter === "all" ? pastBookings : visibleBookings} compact />}{filter !== "all" && visibleBookings.length > 0 && filter !== "confirmed" && filter !== "completed" && filter !== "cancelled" ? <TripSection title="Trips" icon={Ticket} bookings={visibleBookings} /> : null}</div>}</PageShell>;
}

function TripSection({ title, icon: Icon, bookings, compact = false }) {
  return <section><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e4f5ed] text-[var(--primary)]"><Icon size={17} /></span><div><h2 className="text-xl font-bold text-[var(--foreground)]">{title}</h2><p className="text-sm text-[var(--muted)]">{bookings.length} booking{bookings.length === 1 ? "" : "s"}</p></div></div><div className="mt-4 grid gap-4 lg:grid-cols-2">{bookings.map((booking) => <TripCard key={booking._id} booking={booking} compact={compact} />)}</div></section>;
}

function TripCard({ booking, compact }) {
  const bus = booking.bus || {};
  const route = bus.route || {};
  const confirmationHref = `/booking/${bus._id || booking.bus}/confirmation?booking=${booking._id}`;
  return <Card className={`p-5 ${compact ? "opacity-90" : ""}`}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">{route.routeName || "Route unavailable"}</p><h3 className="mt-1 text-lg font-bold text-[var(--foreground)]">{bus.busNumber || "Bus unavailable"}</h3></div><Badge tone={statusTone(booking.status)}>{booking.status || "Status unavailable"}</Badge></div><div className="mt-5 grid gap-3 border-t border-[var(--border)] pt-4 text-sm sm:grid-cols-2"><Detail label="Date" value={formatDate(booking.createdAt)} /><Detail label="Time" value="Not provided" /><Detail label="Seat" value={booking.seatNumber || "Not assigned"} /><Detail label="Reference" value={booking._id} /></div><div className="mt-5 flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs text-[var(--muted)]">{booking.paymentStatus ? `Payment: ${booking.paymentStatus}` : ""}</span><Link href={confirmationHref} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold text-[var(--primary)] hover:border-[var(--primary)]">View Details <ArrowRight size={15} /></Link></div></Card>;
}

function Detail({ label, value }) {
  return <div><p className="text-xs text-[var(--muted)]">{label}</p><p className="mt-1 truncate font-semibold text-[var(--foreground)]">{value}</p></div>;
}

function PageShell({ children }) {
  return <div className="min-h-screen overflow-x-hidden bg-[var(--background)]"><Navbar /><main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">{children}</main><Footer /></div>;
}

function StateCard({ title, description, actionHref, actionLabel }) {
  return <Card className="mx-auto max-w-lg p-8 text-center"><XCircle className="mx-auto text-[var(--muted)]" size={30} /><h1 className="mt-3 text-2xl font-bold text-[var(--foreground)]">{title}</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p><Link href={actionHref} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white">{actionLabel}</Link></Card>;
}
