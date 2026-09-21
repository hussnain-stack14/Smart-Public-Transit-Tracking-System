"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  BusFront,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Route as RouteIcon,
} from "lucide-react";
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
import { BookingProgress } from "./BookingProgress";

const bookingSchema = z.object({
  route: z.string().min(1, "Select a route."),
  bus: z.string().optional(),
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

function getRouteId(bus) {
  return bus?.route?._id || bus?.route || "";
}

function getDriverId(bus) {
  return bus?.driver?._id || bus?.driver || "";
}

function getDriverName(bus) {
  return bus?.driver?.name || (getDriverId(bus) ? "Assigned driver" : "No driver assigned");
}

function sortEligibleBuses(left, right) {
  const leftUpdate = left.lastLocationUpdate ? new Date(left.lastLocationUpdate).getTime() : 0;
  const rightUpdate = right.lastLocationUpdate ? new Date(right.lastLocationUpdate).getTime() : 0;
  if (leftUpdate !== rightUpdate) return rightUpdate - leftUpdate;
  const numberOrder = String(left.busNumber || "").localeCompare(String(right.busNumber || ""));
  return numberOrder || String(left._id).localeCompare(String(right._id));
}

export default function BookingPage({ initialBusId = "", initialRouteId = "" }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [manualSelection, setManualSelection] = useState(Boolean(initialBusId));

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      route: initialRouteId || "",
      bus: initialBusId || "",
      travelDate: todayString(),
    },
  });

  const selectedRouteId = useWatch({ control, name: "route" });
  const selectedBusId = useWatch({ control, name: "bus" });
  const travelDate = useWatch({ control, name: "travelDate" });
  const selectedRoute = routes.find((route) => route._id === selectedRouteId);

  const eligibleBuses = useMemo(
    () =>
      buses
        .filter(
          (bus) =>
            getRouteId(bus) === selectedRouteId &&
            bus.status === "active" &&
            Number(bus.availableSeats) > 0 &&
            Boolean(getDriverId(bus)),
        )
        .sort(sortEligibleBuses),
    [buses, selectedRouteId],
  );

  const automaticBus = eligibleBuses[0] || null;
  const selectedBus = eligibleBuses.find((bus) => bus._id === selectedBusId) || null;
  const bookingBus = manualSelection ? selectedBus : automaticBus;
  const noEligibleBus = Boolean(selectedRouteId) && !bookingBus;

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      try {
        const [routeResponse, busResponse] = await Promise.all([
          routeService.list(),
          busService.list(),
        ]);
        const routeList = Array.isArray(routeResponse) ? routeResponse : routeResponse.routes || [];
        const busList = Array.isArray(busResponse) ? busResponse : busResponse.buses || [];
        if (cancelled) return;

        setRoutes(routeList);
        setBuses(busList);

        if (initialBusId) {
          const initialBus = busList.find((bus) => bus._id === initialBusId);
          const routeId = getRouteId(initialBus);
          if (routeId) setValue("route", routeId);
          setValue("bus", initialBusId);
          setManualSelection(true);
        } else if (initialRouteId && routeList.some((route) => route._id === initialRouteId)) {
          setValue("route", initialRouteId);
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
  }, [initialBusId, initialRouteId, setValue]);

  function handleRouteChange(event) {
    setValue("route", event.target.value, { shouldValidate: true });
    setValue("bus", "", { shouldValidate: true });
    setSubmitError("");
  }

  function toggleManualSelection() {
    setSubmitError("");
    const next = !manualSelection;
    setManualSelection(next);
    setValue("bus", next ? automaticBus?._id || "" : "", { shouldValidate: false });
  }

  function continueToSeatSelection(values) {
    setSubmitError("");
    if (!bookingBus) {
      setSubmitError(
        "No active bus with an assigned driver and available seats is currently shown for this route.",
      );
      return;
    }

    const target =
      "/booking/" +
      bookingBus._id +
      "/seat?route=" +
      encodeURIComponent(values.route) +
      "&date=" +
      encodeURIComponent(values.travelDate) +
      "&mode=" +
      (manualSelection ? "manual" : "route");

    if (!isAuthenticated) {
      router.push("/login?redirect=" + encodeURIComponent(target));
      return;
    }
    router.push(target);
  }

  const summaryDate = travelDate
    ? new Date(travelDate + "T00:00:00").toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Not selected";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--background)]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
            Plan your journey
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Reserve your seat.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Start with a route. Smart Safar selects the current valid bus and assigned driver,
            while manual mode is limited to relationships returned by the backend.
          </p>
        </header>

        <BookingProgress currentStep={1} />

        {loadError ? (
          <div className="mt-8">
            <ErrorState
              title="Unable to load routes"
              description="We couldn't retrieve booking options right now."
              action={
                <Button type="button" variant="secondary" onClick={() => window.location.reload()}>
                  Try again
                </Button>
              }
            />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(continueToSeatSelection)}
            className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start"
          >
            <Card className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e4f5ed] text-[var(--primary)]">
                  <RouteIcon size={19} />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)]">Trip Details</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Select a route, then review the active assignment.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5">
                <Field label="Route" error={errors.route?.message}>
                  <select
                    {...register("route", { onChange: handleRouteChange })}
                    value={selectedRouteId || ""}
                    className="field-input"
                  >
                    <option value="">Select route</option>
                    {routes.map((route) => (
                      <option key={route._id} value={route._id} disabled={route.isActive === false}>
                        {route.routeName} · {route.startPoint} to {route.endPoint}
                      </option>
                    ))}
                  </select>
                </Field>

                {selectedRouteId && (
                  <section className="rounded-2xl border border-[var(--border)] bg-[#f5f8f7] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                          {manualSelection ? "Manual selection" : "Automatic assignment"}
                        </p>
                        <h3 className="mt-1 font-bold text-[var(--foreground)]">
                          {bookingBus?.busNumber || "No eligible bus available"}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {bookingBus
                            ? getDriverName(bookingBus) +
                              " · " +
                              bookingBus.availableSeats +
                              " seats available"
                            : "The backend has not returned an active bus/driver option for this route."}
                        </p>
                      </div>
                      {bookingBus && <Badge tone="success">{busStatusLabel(bookingBus.status)}</Badge>}
                    </div>

                    {manualSelection && (
                      <div className="mt-4">
                        <Field label="Valid bus and driver" error={errors.bus?.message}>
                          <select {...register("bus")} className="field-input">
                            <option value="">Select an active assignment</option>
                            {eligibleBuses.map((bus) => (
                              <option key={bus._id} value={bus._id}>
                                {bus.busNumber} · {getDriverName(bus)} · {bus.availableSeats} seats
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={toggleManualSelection}
                      className="mt-4 min-h-10 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)]"
                    >
                      {manualSelection ? "Use automatic assignment" : "Book manually / Change selection"}
                    </button>

                    {!manualSelection && bookingBus && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl bg-white p-3 text-xs leading-5 text-[var(--muted)]">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--success)]" />
                        The final bus and driver relationship is validated and resolved again by the
                        backend when the booking is created.
                      </div>
                    )}
                  </section>
                )}

                <Field label="Travel date" error={errors.travelDate?.message}>
                  <div className="relative">
                    <CalendarDays
                      size={17}
                      className="pointer-events-none absolute left-3 top-3 text-[var(--primary)]"
                    />
                    <input
                      {...register("travelDate")}
                      type="date"
                      min={todayString()}
                      className="field-input pl-10"
                    />
                  </div>
                </Field>

                <div className="rounded-xl border border-[#dce9e4] bg-[#f5f8f7] p-4 text-sm text-[var(--muted)]">
                  <div className="flex items-start gap-3">
                    <Clock3 size={17} className="mt-0.5 shrink-0 text-[var(--primary)]" />
                    <p>
                      Bus services operate continuously. The backend does not currently store a
                      scheduled travel time, so confirmation uses the booking creation timestamp.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5 sm:p-6 lg:sticky lg:top-24">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e4f5ed] text-[var(--primary)]">
                  <BusFront size={19} />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)]">Booking Summary</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">Review before selecting a seat.</p>
                </div>
              </div>
              <dl className="mt-6 grid gap-4 border-t border-[var(--border)] pt-5 text-sm">
                <SummaryRow label="Route" value={selectedRoute?.routeName || "Not selected"} />
                <SummaryRow label="Bus" value={bookingBus?.busNumber || "Awaiting route"} />
                <SummaryRow label="Driver" value={bookingBus ? getDriverName(bookingBus) : "Awaiting route"} />
                <SummaryRow label="Date" value={summaryDate} />
                <SummaryRow label="Seat" value="To be selected" />
              </dl>

              {noEligibleBus && (
                <div className="mt-5 rounded-xl border border-[#f4cccc] bg-[#fff8f8] p-3 text-sm text-[var(--danger)]">
                  No valid active bus and driver assignment is currently available for this route.
                </div>
              )}
              {submitError && (
                <p className="mt-4 text-sm leading-6 text-[var(--danger)]">{submitError}</p>
              )}
              {!authLoading && !isAuthenticated && (
                <div className="mt-5 rounded-xl border border-[var(--border)] bg-[#f5f8f7] p-3 text-sm text-[var(--muted)]">
                  You will be asked to sign in before seat selection.
                </div>
              )}
              <Button
                type="submit"
                className="mt-6 w-full gap-2"
                disabled={routesLoading || !selectedRouteId || !travelDate || !bookingBus}
              >
                {isAuthenticated ? "Continue to Seat Selection" : "Log in to continue"}
                <ArrowRight size={16} />
              </Button>
            </Card>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-[var(--foreground)]">
      {label}
      {children}
      {error && <span className="text-xs font-normal text-[var(--danger)]">{error}</span>}
    </label>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="max-w-[62%] break-words text-right font-semibold text-[var(--foreground)]">
        {value}
      </dd>
    </div>
  );
}
