"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BusFront, MapPinned, ShieldCheck, Ticket } from "lucide-react";
import { routeService } from "../../services/routeService";
import { busService } from "../../services/busService";
import { bookingService } from "../../services/bookingService";
import { getRouteId } from "../../lib/transit/format";
import { RouteCard } from "../route/RouteCard";

export default function CommuterHome() {
  const [data, setData] = useState({ routes: [], buses: [], bookings: [], loading: true, error: false });
  useEffect(() => {
    let active = true;
    Promise.allSettled([routeService.list(), busService.list(), bookingService.getMyBookings()]).then(([routes, buses, bookings]) => {
      if (!active) return;
      const routeList = routes.status === "fulfilled" ? (Array.isArray(routes.value) ? routes.value : routes.value.routes || []) : [];
      const busList = buses.status === "fulfilled" && Array.isArray(buses.value) ? buses.value : [];
      const bookingList = bookings.status === "fulfilled" ? (Array.isArray(bookings.value) ? bookings.value : bookings.value.bookings || []) : [];
      setData({ routes: routeList, buses: busList, bookings: bookingList, loading: false, error: routes.status === "rejected" || buses.status === "rejected" });
    });
    return () => { active = false; };
  }, []);
  const active = data.buses.filter(bus => bus.status === "active");
  const current = data.bookings.find(booking => booking.status === "confirmed");
  return <main className="commuter-home">
    <div className="commuter-intro"><p>Smart Public Transit for Faisalabad</p><h1>Where to today?</h1><span>Find your route, follow a bus, and travel with confidence.</span></div>
    <Link href="/routes" className="commuter-search"><MapPinned size={20} /><span>Find a route or stop</span><ArrowRight size={18} /></Link>
    <div className="commuter-quick">
      <Link href="/live-map"><BusFront size={21} /><span>Live buses</span><ArrowRight size={16} /></Link>
      <Link href="/booking"><Ticket size={21} /><span>Book a seat</span><ArrowRight size={16} /></Link>
    </div>
    {current && <section className="commuter-panel"><div className="commuter-section-heading"><h2>Your trip</h2><Link href="/my-trips">All bookings</Link></div><Link href={`/booking/${current._id}/confirmation`} className="commuter-trip"><span><strong>{current.route?.routeName || "Booked route"}</strong><small>{current.bus?.busNumber || "Bus unavailable"} · Seat {current.seatNumber || "pending"}</small></span><ArrowRight size={18} /></Link></section>}
    <section className="commuter-panel"><div className="commuter-section-heading"><h2>Buses running now</h2><Link href="/live-map">View map</Link></div>{data.loading ? <p className="commuter-muted">Loading live buses…</p> : data.error ? <p className="commuter-muted">Transit information is unavailable right now.</p> : active.length ? <div className="commuter-bus-list">{active.slice(0, 3).map(bus => <Link key={bus._id} href={`/buses/${bus._id}`}><span className="commuter-bus-icon"><BusFront size={19} /></span><span><strong>{bus.busNumber}</strong><small>{bus.route?.routeName || "Route information unavailable"}</small></span><span className="commuter-live">Live</span></Link>)}</div> : <p className="commuter-muted">No active buses are currently reported.</p>}</section>
    <section className="commuter-panel"><div className="commuter-section-heading"><h2>Explore routes</h2><Link href="/routes">All routes</Link></div>{data.loading ? <p className="commuter-muted">Loading routes…</p> : data.routes.length ? <div className="commuter-routes">{data.routes.slice(0, 2).map(route => <RouteCard key={getRouteId(route)} route={route} />)}</div> : <p className="commuter-muted">No routes are currently available.</p>}</section>
    <Link href="/safety" className="commuter-safety"><ShieldCheck size={21} /><span><strong>Women Safety</strong><small>Share a bus journey with someone you trust</small></span><ArrowRight size={18} /></Link>
  </main>;
}

