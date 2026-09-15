"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, BusFront, CalendarDays, Check, Clock3, Route as RouteIcon, UserRound } from "lucide-react";
import { Navbar } from "../navigation/Navbar";
import { Footer } from "../navigation/Footer";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { ErrorState } from "../common/ErrorState";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { busService } from "../../services/busService";
import { routeService } from "../../services/routeService";
import { useAuth } from "../../hooks/useAuth";

const bookingSchema = z.object({
  route: z.string().min(1, "Select a route."),
  bus: z.string().min(1, "Select a bus."),
  travelDate: z.string().min(1, "Select a travel date."),
});

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function busStatusLabel(status) {
  if (status === "active") return "Active";
  if (status === "idle") return "Idle";
  if (status === "maintenance") return "Maintenance";
  return "Status unavailable";
}

function occupancyLabel(bus) {
  return bus.occupancy || null;
}

export default function BookingPage({ initialBusId }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [busesLoading, setBusesLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [submitError, setSubmitError] = useState("");

  const { control, register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: { route: "", bus: initialBusId || "", travelDate: "" },
  });

  const selectedRouteId = useWatch({ control, name: "route" });
  const selectedBusId = useWatch({ control, name: "bus" });
  const travelDate = useWatch({ control, name: "travelDate" });
  const selectedRoute = routes.find((route) => route._id === selectedRouteId);
  const selectedBus = buses.find((bus) => bus._id === selectedBusId);
  const filteredBuses = selectedRouteId ? buses.filter((bus) => (bus.route?._id || bus.route) === selectedRouteId) : [];
  const isFull = selectedBus?.availableSeats === 0;

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      try {
        const [routeResponse, busResponse] = await Promise.all([routeService.list(), busService.list()]);
        const routeList = Array.isArray(routeResponse) ? routeResponse : routeResponse.routes || [];
        const busList = Array.isArray(busResponse) ? busResponse : busResponse.buses || [];
        if (!cancelled) {
          setRoutes(routeList);
          setBuses(busList);
          if (initialBusId) {
            const initialBus = busList.find((bus) => bus._id === initialBusId);
            const initialRouteId = initialBus?.route?._id || initialBus?.route;
            if (initialRouteId) setValue("route", initialRouteId);
          }
        }
      } catch (error) {
        console.error("Unable to load booking options", error);
        if (!cancelled) setLoadError("Unable to load routes");
      } finally {
        if (!cancelled) setRoutesLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [initialBusId, setValue]);

  function handleRouteChange(event) {
    setValue("route", event.target.value, { shouldValidate: true });
    setValue("bus", "", { shouldValidate: true });
    setBusesLoading(Boolean(event.target.value));
    setTimeout(() => setBusesLoading(false), 0);
  }

  function continueToSeatSelection(values) {
    setSubmitError("");
    if (!isAuthenticated) {
      router.push(`/login?redirect=/booking&bus=${values.bus}`);
      return;
    }
    if (isFull) {
      setSubmitError("No seats available on this bus.");
      return;
    }
    router.push(`/booking/${values.bus}/seat?date=${values.travelDate}`);
  }

  const summaryDate = travelDate ? new Date(`${travelDate}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not selected";
  const routeName = selectedRoute?.routeName || "Not selected";
  const busName = selectedBus?.busNumber || "Not selected";
  const availableSeats = selectedBus?.availableSeats;

  return <div className="min-h-screen overflow-x-hidden bg-[var(--background)]"><Navbar /><main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">Plan your journey</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">Reserve your seat.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">Choose your route, bus and travel details to reserve a seat for your journey.</p></header><BookingSteps />

      {loadError ? <div className="mt-8"><ErrorState title="Unable to load routes" description="We couldn't retrieve booking options right now." action={<Button type="button" variant="secondary" onClick={() => window.location.reload()}>Try again</Button>} /></div> : <form onSubmit={handleSubmit(continueToSeatSelection)} className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start"><Card className="p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e4f5ed] text-[var(--primary)]"><RouteIcon size={19} /></span><div><h2 className="text-xl font-bold text-[var(--foreground)]">Trip Details</h2><p className="mt-1 text-sm text-[var(--muted)]">Select the bus you want to reserve.</p></div></div><div className="mt-6 grid gap-5"><Field label="Route" error={errors.route?.message}><select {...register("route", { onChange: handleRouteChange })} className="field-input"><option value="">Select route</option>{routes.map((route) => <option key={route._id} value={route._id}>{route.routeName} · {route.startPoint} to {route.endPoint}</option>)}</select></Field><Field label="Bus" error={errors.bus?.message}>{busesLoading ? <div className="field-input flex items-center"><LoadingSpinner label="Loading buses..." /></div> : <select {...register("bus")} className="field-input" disabled={!selectedRouteId}><option value="">{selectedRouteId ? "Select bus" : "Select a route first"}</option>{filteredBuses.map((bus) => <option key={bus._id} value={bus._id} disabled={bus.availableSeats === 0}>{bus.busNumber} · {busStatusLabel(bus.status)}{bus.availableSeats === 0 ? " · Full" : ""}</option>)}</select>}</Field>{selectedBus && <div className="rounded-xl border border-[var(--border)] bg-[#f5f8f7] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-[var(--foreground)]">{selectedBus.busNumber}</p><p className="mt-1 text-xs text-[var(--muted)]">{selectedRoute?.routeName}</p></div><Badge tone={selectedBus.status === "active" ? "success" : "neutral"}>{busStatusLabel(selectedBus.status)}</Badge></div><div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--muted)]"><span className="inline-flex items-center gap-1.5"><UsersIcon /> {occupancyLabel(selectedBus) || "Availability state unavailable"}</span>{availableSeats != null && <span>{availableSeats} seats available</span>}</div></div>}<Field label="Travel date" error={errors.travelDate?.message}><div className="relative"><CalendarDays size={17} className="pointer-events-none absolute left-3 top-3 text-[var(--primary)]" /><input {...register("travelDate")} type="date" min={todayString()} className="field-input pl-10" /></div></Field><div className="rounded-xl border border-[#dce9e4] bg-[#f5f8f7] p-4 text-sm text-[var(--muted)]"><div className="flex items-start gap-3"><Clock3 size={17} className="mt-0.5 shrink-0 text-[var(--primary)]" /><p>Bus services operate continuously. No fixed trip schedule is available from the backend, so a travel time is not requested here.</p></div></div></div></Card><Card className="p-5 sm:p-6 lg:sticky lg:top-24"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e4f5ed] text-[var(--primary)]"><BusFront size={19} /></span><div><h2 className="text-xl font-bold text-[var(--foreground)]">Booking Summary</h2><p className="mt-1 text-sm text-[var(--muted)]">Review your trip details.</p></div></div><dl className="mt-6 grid gap-4 border-t border-[var(--border)] pt-5 text-sm"><SummaryRow label="Route" value={routeName} /><SummaryRow label="Bus" value={busName} /><SummaryRow label="Date" value={summaryDate} /><SummaryRow label="Time" value="Not selected" /><SummaryRow label="Seat" value="To be selected" /></dl>{selectedBus && isFull && <div className="mt-5 rounded-xl border border-[#f4cccc] bg-[#fff8f8] p-3 text-sm text-[var(--danger)]">No seats available on this bus.</div>}{submitError && <p className="mt-4 text-sm text-[var(--danger)]">{submitError}</p>}{!authLoading && !isAuthenticated && <div className="mt-5 rounded-xl border border-[var(--border)] bg-[#f5f8f7] p-3 text-sm text-[var(--muted)]">You&apos;ll need to log in before continuing to seat selection.</div>}<Button type="submit" className="mt-6 w-full gap-2" disabled={routesLoading || !selectedBusId || !travelDate || isFull}>{isAuthenticated ? "Continue to Seat Selection" : "Log in to continue"}<ArrowRight size={16} /></Button></Card></form>}</main><Footer /></div>;
}

function BookingSteps() {
  return <div className="mt-8 flex max-w-xl items-center gap-2 text-xs sm:gap-4"><Step number="1" label="Trip details" active /><span className="h-px flex-1 bg-[var(--border)]" /><Step number="2" label="Seat" /><span className="h-px flex-1 bg-[var(--border)]" /><Step number="3" label="Confirmation" /></div>;
}

function Step({ number, label, active = false }) {
  return <div className="flex shrink-0 items-center gap-2"><span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${active ? "bg-[var(--primary)] text-white" : "border border-[var(--border)] bg-white text-[var(--muted)]"}`}>{active ? <Check size={14} /> : number}</span><span className={active ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted)]"}>{label}</span></div>;
}

function Field({ label, error, children }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-[var(--foreground)]">{label}{children}{error && <span className="text-xs font-normal text-[var(--danger)]">{error}</span>}</label>;
}

function SummaryRow({ label, value }) {
  return <div className="flex items-start justify-between gap-4"><dt className="text-[var(--muted)]">{label}</dt><dd className="max-w-[60%] text-right font-semibold text-[var(--foreground)]">{value}</dd></div>;
}

function UsersIcon() {
  return <UserRound size={14} />;
}
