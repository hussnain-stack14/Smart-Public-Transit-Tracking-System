"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BusFront,
  Check,
  Circle,
  LocateFixed,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { Navbar } from "../navigation/Navbar";
import { Footer } from "../navigation/Footer";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { ErrorState } from "../common/ErrorState";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ClientTransitMap } from "../map/MapShell";
import { MapViewport } from "../map/MapViewport";
import { StopMarker } from "../map/StopMarker";
import { BookingProgress } from "./BookingProgress";
import { busService } from "../../services/busService";
import { routeService } from "../../services/routeService";
import { bookingService } from "../../services/bookingService";
import { useAuth } from "../../hooks/useAuth";
import { useGeolocation } from "../../hooks/useGeolocation";

function formatDate(value) {
  if (!value) return "Not selected";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildSeats(capacity) {
  return Array.from({ length: capacity }, (_, index) => {
    const row = String.fromCharCode(65 + Math.floor(index / 4));
    return `${row}${(index % 4) + 1}`;
  });
}

function getId(value) {
  return value?._id || value || "";
}

function getLocationMessage(error) {
  if (!error) return "";
  if (error.code === 1) {
    return "Location permission was denied. You can still complete the booking without sharing it.";
  }
  if (error.code === 3) {
    return "Finding your location timed out. Try again, or continue without sharing it.";
  }
  return "Your current location could not be determined. You can still complete the booking.";
}

export default function SeatSelectionPage({
  busId,
  routeId,
  travelDate,
  bookingMode = "route",
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [bus, setBus] = useState(null);
  const [route, setRoute] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState("");
  const [pickupLocation, setPickupLocation] = useState(null);
  const [locationRequest, setLocationRequest] = useState(0);
  const [locationNotice, setLocationNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const geolocationOptions = useMemo(
    () => ({ enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }),
    [],
  );
  const geolocation = useGeolocation(geolocationOptions, {
    enabled: locationRequest > 0,
    oneShot: true,
    refreshKey: locationRequest,
  });

  const loadBus = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const busData = await busService.get(busId);
      const selectedRouteId = routeId || getId(busData.route);
      const routeData = selectedRouteId ? await routeService.get(selectedRouteId) : null;
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
  }, [busId, routeId]);

  useEffect(() => {
    Promise.resolve().then(() => loadBus());
  }, [loadBus]);

  useEffect(() => {
    const position = geolocation.position;
    if (!position || locationRequest === 0) return;
    const nextLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date(position.timestamp || Date.now()).toISOString(),
    };
    queueMicrotask(() => {
      setPickupLocation(nextLocation);
      setLocationNotice("Location ready to share with your assigned driver after booking.");
    });
  }, [geolocation.position, locationRequest]);

  useEffect(() => {
    if (!geolocation.error || locationRequest === 0) return;
    queueMicrotask(() => setLocationNotice(getLocationMessage(geolocation.error)));
  }, [geolocation.error, locationRequest]);

  const seats = useMemo(() => buildSeats(bus?.capacity || 0), [bus?.capacity]);
  const availableSeats = bus?.availableSeats ?? null;
  const isFull = availableSeats === 0;
  const seatAvailability = isFull ? "Full" : availableSeats == null ? "Unavailable" : "Available";
  const actualRouteId = routeId || getId(bus?.route);
  const driver = bus?.driver;
  const locationPosition = pickupLocation
    ? [pickupLocation.latitude, pickupLocation.longitude]
    : null;

  function requestLocation() {
    setLocationNotice("");
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setLocationNotice(
        "Location requires HTTPS (or localhost). You can still complete the booking without it.",
      );
      return;
    }
    setLocationRequest((current) => current + 1);
  }

  async function continueToConfirmation() {
    if (!selectedSeat || isFull) return;
    if (!isAuthenticated) {
      const target =
        `/booking/${busId}/seat?route=${encodeURIComponent(actualRouteId)}` +
        `&date=${encodeURIComponent(travelDate || "")}&mode=${bookingMode}`;
      router.push(`/login?redirect=${encodeURIComponent(target)}`);
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = {
        routeId: actualRouteId,
        seatNumber: selectedSeat,
        paymentMethod: "cash",
        shareLocation: Boolean(pickupLocation),
        ...(pickupLocation ? { pickupLocation } : {}),
      };

      if (bookingMode === "manual") {
        payload.bus = busId;
        payload.driverId = getId(driver);
      }

      const booking = await bookingService.create(payload);
      if (!booking?._id) throw new Error("Booking response did not include an ID");
      router.push(`/booking/${booking._id}/confirmation`);
    } catch (requestError) {
      const message = requestError.response?.data?.message || requestError.message || "";
      const seatConflict =
        requestError.response?.status === 409 && /seat|available|reserved|booking/i.test(message);
      if (seatConflict) {
        setSelectedSeat("");
        setSubmitError(
          message || "This seat was just reserved by another passenger. Please choose another seat.",
        );
        loadBus();
      } else {
        setSubmitError(message || "Unable to reserve this seat. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !bus) {
    return (
      <PageShell>
        <div className="grid min-h-96 place-items-center">
          <LoadingSpinner label="Loading seat availability..." />
        </div>
      </PageShell>
    );
  }
  if (error === "not-found") {
    return (
      <PageShell>
        <StateCard title="Bus not found" description="This bus is no longer available for booking." />
      </PageShell>
    );
  }
  if (error || !bus) {
    return (
      <PageShell>
        <ErrorState
          title="Unable to load seats"
          description="We couldn't retrieve the current seat availability."
          action={
            <Button type="button" variant="secondary" onClick={loadBus}>
              <RefreshCw size={16} /> Try again
            </Button>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Link
          href={actualRouteId ? `/booking?route=${actualRouteId}` : "/booking"}
          className="font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)]"
        >
          <ArrowLeft size={19} aria-hidden="true" /><span className="sr-only">Back to trip details</span>
        </Link>
        <span>/</span>
        <span>Seat and pickup</span>
      </div>

      <header className="mt-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
          Step 2 of 3
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          Select your seat.
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Choose a seat and optionally share a pickup location with the assigned driver.
        </p>
      </header>

      <BookingProgress currentStep={2} />

      <Card className="mt-6 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <SummaryItem label="Route" value={route?.routeName || bus.route?.routeName || "Not available"} />
          <SummaryItem label="Bus preview" value={bus.busNumber} />
          <SummaryItem label="Assigned driver" value={driver?.name || "Not assigned"} />
          <SummaryItem label="Date" value={formatDate(travelDate)} />
        </div>
        {bookingMode === "route" && (
          <p className="mt-4 border-t border-[var(--border)] pt-3 text-xs leading-5 text-[var(--muted)]">
            This is the current route assignment preview. The backend resolves and validates the active
            bus and driver again when you book; the confirmation is authoritative.
          </p>
        )}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)] lg:items-start">
        <div className="grid min-w-0 gap-6">
          <Card className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--foreground)]">Bus Seat Map</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">Front of bus</p>
              </div>
              <Badge tone={seatAvailability === "Full" ? "danger" : "success"}>
                {availableSeats == null ? "Availability unavailable" : `${availableSeats} available`}
              </Badge>
            </div>

            {seats.length ? (
              <div className="mx-auto mt-6 max-w-sm rounded-[2rem] border-2 border-[#cfe5dc] bg-[#f5f8f7] p-4">
                <div className="mb-5 rounded-xl bg-[#e3f3ec] px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                  Driver / front
                </div>
                <div className="grid gap-3">
                  {Array.from({ length: Math.ceil(seats.length / 4) }, (_, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-5 gap-2">
                      {seats.slice(rowIndex * 4, rowIndex * 4 + 4).map((seat, index) => (
                        <SeatButton
                          key={seat}
                          seat={seat}
                          selected={selectedSeat === seat}
                          disabled={isFull}
                          onSelect={setSelectedSeat}
                          className={index === 2 ? "col-start-4" : ""}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-[var(--muted)]">
                No seat layout is available for this bus.
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-4 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted)]">
              <Legend color="bg-white border-[#b9d8cc]" label="Available" />
              <Legend color="bg-[var(--primary)] border-[var(--primary)]" label="Selected" />
              <Legend color="bg-[#e5e9e7] border-[#cbd5d1]" label="Unavailable" />
            </div>
            {availableSeats != null && availableSeats < (bus.capacity || availableSeats) && (
              <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
                The backend provides a total available-seat count, but not individual reserved-seat
                positions. The final seat reservation is validated by the backend.
              </p>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e4f5ed] text-[var(--primary)]">
                <MapPin size={19} />
              </span>
              <div>
                <h2 className="text-xl font-bold text-[var(--foreground)]">Passenger pickup</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Optional. Your location is shared only with the driver assigned to this booking
                  while their shift and your booking are active.
                </p>
              </div>
            </div>

            {locationPosition ? (
              <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-[#eaf3ef] p-1">
                <ClientTransitMap center={locationPosition} zoom={15} className="h-64 rounded-xl">
                  <MapViewport
                    positions={[locationPosition]}
                    focusKey={`${pickupLocation.timestamp}-${locationRequest}`}
                  />
                  <StopMarker
                    position={locationPosition}
                    stop={{ name: "Your pickup location" }}
                  />
                </ClientTransitMap>
              </div>
            ) : (
              <div className="mt-5 grid min-h-32 place-items-center rounded-2xl border border-dashed border-[var(--border)] bg-[#f7faf9] p-5 text-center">
                <div>
                  <LocateFixed className="mx-auto text-[var(--primary)]" size={24} />
                  <p className="mt-2 text-sm font-semibold">No pickup location selected</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Location permission is optional and never blocks booking.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant={pickupLocation ? "secondary" : "primary"}
                className="min-h-11 gap-2"
                onClick={requestLocation}
                disabled={geolocation.loading}
              >
                <LocateFixed size={16} />
                {geolocation.loading
                  ? "Finding location..."
                  : pickupLocation
                    ? "Update Location"
                    : "Use My Current Location"}
              </Button>
              {pickupLocation && (
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11 gap-2"
                  onClick={() => {
                    setPickupLocation(null);
                    setLocationNotice("Location removed. Your booking will not share a pickup point.");
                  }}
                >
                  <X size={16} /> Remove
                </Button>
              )}
            </div>
            {(locationNotice || (geolocation.error && !pickupLocation)) && (
              <p
                role={geolocation.error && !pickupLocation ? "alert" : "status"}
                className={`mt-3 text-sm leading-6 ${
                  geolocation.error && !pickupLocation
                    ? "text-[var(--danger)]"
                    : "text-[var(--muted)]"
                }`}
              >
                {locationNotice || getLocationMessage(geolocation.error)}
              </p>
            )}
            {pickupLocation && (
              <p className="mt-3 text-xs text-[var(--muted)]">
                Accuracy: about {Math.round(pickupLocation.accuracy)} m · Captured {new Date(
                  pickupLocation.timestamp,
                ).toLocaleString()}
              </p>
            )}
          </Card>
        </div>

        <Card className="p-5 sm:p-6 lg:sticky lg:top-24">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e4f5ed] text-[var(--primary)]">
              <BusFront size={19} />
            </span>
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">Trip Summary</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Review before booking.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 border-t border-[var(--border)] pt-5 text-sm">
            <SummaryItem label="Route" value={route?.routeName || bus.route?.routeName || "Not available"} />
            <SummaryItem label="Bus preview" value={bus.busNumber} />
            <SummaryItem label="Driver" value={driver?.name || "Not assigned"} />
            <SummaryItem label="Date" value={formatDate(travelDate)} />
            <SummaryItem label="Selected seat" value={selectedSeat || "Select a seat"} />
            <SummaryItem
              label="Pickup"
              value={pickupLocation ? "Location will be shared" : "Not shared"}
            />
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#f5f8f7] p-3 text-sm text-[var(--muted)]">
            <Users size={16} className="mt-0.5 shrink-0 text-[var(--primary)]" />
            {availableSeats == null
              ? "Seat availability unavailable"
              : `${availableSeats} seats available`}
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--border)] p-3 text-sm text-[var(--muted)]">
            <WalletCards size={16} className="mt-0.5 shrink-0 text-[var(--primary)]" />
            <p>
              Payment will be <strong className="text-[var(--foreground)]">Pending</strong>. No
              customer payment gateway is currently integrated, so this screen never reports a fake
              successful payment.
            </p>
          </div>
          <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-[var(--muted)]">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[var(--success)]" />
            The backend validates the route, bus, driver, active shift, and seat before creating the
            booking.
          </div>

          {submitError && (
            <p role="alert" className="mt-4 text-sm leading-5 text-[var(--danger)]">
              {submitError}
            </p>
          )}
          {!authLoading && !isAuthenticated && (
            <p className="mt-4 text-sm leading-5 text-[var(--muted)]">
              Log in is required before the seat can be reserved.
            </p>
          )}
          <Button
            type="button"
            className="mt-6 w-full gap-2"
            disabled={!selectedSeat || isFull || submitting}
            onClick={continueToConfirmation}
          >
            {submitting
              ? "Creating booking..."
              : isAuthenticated
                ? "Book and View Confirmation"
                : "Log in to continue"}
            <ArrowRight size={16} />
          </Button>
        </Card>
      </div>
    </PageShell>
  );
}

function PageShell({ children }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--background)]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">{children}</main>
      <Footer />
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 break-words font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function SeatButton({ seat, selected, disabled, onSelect, className = "" }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`Seat ${seat}, ${disabled ? "unavailable" : selected ? "selected" : "available"}`}
      aria-pressed={selected}
      className={`grid min-h-11 min-w-0 place-items-center rounded-lg border text-xs font-bold transition ${
        selected
          ? "border-[var(--primary)] bg-[var(--primary)] text-white"
          : disabled
            ? "cursor-not-allowed border-[#cbd5d1] bg-[#e5e9e7] text-[#82928b]"
            : "border-[#b9d8cc] bg-white text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[#e3f3ec]"
      } ${className}`}
      onClick={() => onSelect(seat)}
    >
      {selected ? <Check size={15} /> : seat}
    </button>
  );
}

function Legend({ color, label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Circle size={12} className={color} fill="currentColor" /> {label}
    </span>
  );
}

function StateCard({ title, description }) {
  return (
    <Card className="mx-auto max-w-lg p-8 text-center">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
      <Link
        href="/booking"
        className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white"
      >
        Back to booking
      </Link>
    </Card>
  );
}