"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, BusFront, Clock3, History, Route as RouteIcon, Search, Ticket } from "lucide-react";
import { routeService } from "../../services/routeService";
import { busService } from "../../services/busService";
import { bookingService } from "../../services/bookingService";
import { alertService } from "../../services/alertService";
import { useLiveBuses } from "../../hooks/useLiveBuses";
import { getRouteId } from "../../lib/transit/format";

const actions = [
  { href: "/live-map", label: "Live Buses", icon: BusFront },
  { href: "/routes", label: "Routes", icon: RouteIcon },
  { href: "/booking", label: "Book Ticket", icon: Ticket },
  { href: "/my-trips", label: "My Trips", icon: History },
];
function etaLabel(value) {
  if (value?.etaMinutes == null) return null;
  return value.etaMinutes <= 1 ? "Arriving" : `${Math.round(value.etaMinutes)} min`;
}

export default function CommuterHome() {
  const liveUpdates = useLiveBuses([]);
  const [data, setData] = useState({ routes: [], buses: [], bookings: [], etas: {}, alerts: [], loading: true, error: false });

  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      const [routesResult, busesResult, bookingsResult] = await Promise.allSettled([routeService.list(), busService.list(), bookingService.getMyBookings()]);
      const routes = routesResult.status === "fulfilled" ? (Array.isArray(routesResult.value) ? routesResult.value : routesResult.value.routes || []) : [];
      const buses = busesResult.status === "fulfilled" && Array.isArray(busesResult.value) ? busesResult.value : [];
      const bookings = bookingsResult.status === "fulfilled" ? (Array.isArray(bookingsResult.value) ? bookingsResult.value : bookingsResult.value.bookings || []) : [];
      const operating = buses.filter((bus) => bus.status === "active");
      const [etaResults, alertResults] = await Promise.all([
        Promise.allSettled(operating.map((bus) => busService.getEta(bus._id))),
        Promise.allSettled(routes.map((route) => alertService.listByRoute(getRouteId(route)))),
      ]);
      if (!active) return;
      const etas = Object.fromEntries(operating.map((bus, index) => [bus._id, etaResults[index].status === "fulfilled" ? etaResults[index].value : null]));
      const alerts = alertResults.flatMap((result, index) => result.status === "fulfilled" && Array.isArray(result.value)
        ? result.value.map((alert) => ({ ...alert, routeName: routes[index].routeName }))
        : []);
      setData({ routes, buses, bookings, etas, alerts, loading: false, error: routesResult.status === "rejected" || busesResult.status === "rejected" });
    });
    return () => { active = false; };
  }, []);

  const buses = useMemo(() => data.buses.map((bus) => {
    const update = liveUpdates.find((item) => String(item.id || item._id || item.busId) === String(bus._id));
    return update ? { ...bus, ...update, status: update.status || bus.status } : bus;
  }), [data.buses, liveUpdates]);
  const operatingBuses = buses.filter((bus) => bus.status === "active");
  const current = data.bookings.find((booking) => booking.status === "confirmed");
  const routeMap = Object.fromEntries(data.routes.map((route) => [getRouteId(route), route]));

  return <main className="commuter-home">
    <section className="commuter-intro"><p>Your Faisalabad journey</p><h1>Where are you going?</h1><span>Find a route, follow an active bus, or manage your next trip.</span></section>
    <Link href="/routes" className="commuter-search"><Search size={20} /><span>Search routes and destinations</span><ArrowRight size={18} /></Link>

    <section className="commuter-panel commuter-actions"><div className="commuter-section-heading"><h2>Quick actions</h2></div><div className="commuter-quick">{actions.map(({ href, label, icon: Icon }) => <Link key={href} href={href}><span className="commuter-action-icon"><Icon size={21} /></span><span>{label}</span><ArrowRight size={15} /></Link>)}</div></section>

    <div className="commuter-dashboard-grid">
      <section className="commuter-panel"><div className="commuter-section-heading"><h2>Live buses</h2><Link href="/live-map">View all <ArrowRight size={14} /></Link></div>{data.loading ? <p className="commuter-muted">Loading active buses…</p> : data.error ? <p className="commuter-muted">Transit information is unavailable right now.</p> : operatingBuses.length ? <div className="commuter-bus-list">{operatingBuses.slice(0, 3).map((bus) => { const route = typeof bus.route === "object" ? bus.route : routeMap[bus.route]; const eta = data.etas[bus._id]; const direction = route?.startPoint && route?.endPoint ? `${route.startPoint} → ${route.endPoint}` : route?.routeName || "Route information unavailable"; return <Link key={bus._id} href={`/buses/${bus._id}`}><span className="commuter-bus-icon"><BusFront size={19} /></span><span><strong>{bus.busNumber}</strong><small>{direction}</small></span>{etaLabel(eta) && <span className="commuter-bus-eta"><Clock3 size={13} /> {etaLabel(eta)}</span>}</Link>; })}</div> : <p className="commuter-muted">No buses are currently operating.</p>}</section>

      <section className="commuter-panel"><div className="commuter-section-heading"><h2>Available routes</h2><Link href="/routes">View all <ArrowRight size={14} /></Link></div>{data.loading ? <p className="commuter-muted">Loading routes…</p> : data.routes.length ? <div className="commuter-route-list">{data.routes.slice(0, 3).map((route) => <Link key={getRouteId(route)} href={`/routes/${getRouteId(route)}`}><span className="commuter-route-icon"><RouteIcon size={18} /></span><span><strong>{route.routeName}</strong><small>{route.startPoint} → {route.endPoint}</small></span><ArrowRight size={16} /></Link>)}</div> : <p className="commuter-muted">No routes are currently available.</p>}</section>

      <section className="commuter-panel"><div className="commuter-section-heading"><h2>Active trip</h2><Link href="/my-trips">My trips</Link></div>{current ? <Link href={`/booking/${current._id}/confirmation`} className="commuter-trip"><span className="commuter-trip-icon"><Ticket size={19} /></span><span><strong>{current.route?.routeName || "Booked route"}</strong><small>{current.bus?.busNumber || "Bus assignment pending"}{current.seatNumber ? ` · Seat ${current.seatNumber}` : ""}</small></span><ArrowRight size={18} /></Link> : <div className="commuter-empty-action"><div><strong>No active trip</strong><p>Book a seat when you are ready to travel.</p></div><Link href="/booking">Book a Ticket</Link></div>}</section>

      <section className="commuter-panel"><div className="commuter-section-heading"><h2>Alerts</h2></div>{data.loading ? <p className="commuter-muted">Loading alerts…</p> : data.alerts.length ? <div className="commuter-alert-list">{data.alerts.slice(0, 3).map((alert) => <article key={alert._id}><AlertTriangle size={17} /><div><strong>{alert.routeName || "Route alert"}</strong><p>{alert.message}</p></div></article>)}</div> : <p className="commuter-muted">No new alerts</p>}</section>
    </div>
  </main>;
}
