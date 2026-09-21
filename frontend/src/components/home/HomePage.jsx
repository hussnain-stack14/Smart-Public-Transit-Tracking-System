"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BusFront,
  CheckCircle2,
  Clock3,
  Map,
  MapPin,
  Search,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import { Navbar } from "../navigation/Navbar";
import { Footer } from "../navigation/Footer";
import { BusCard } from "../bus/BusCard";
import { RouteCard } from "../route/RouteCard";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { EmptyState } from "../common/EmptyState";
import { ClientTransitMap } from "../map/MapShell";
import { BusMarker } from "../map/BusMarker";
import { StopMarker } from "../map/StopMarker";
import { RoutePolyline } from "../map/RoutePolyline";
import { MapControls } from "../map/MapControls";
import { busService } from "../../services/busService";
import { routeService } from "../../services/routeService";
import { stopService } from "../../services/stopService";
import { normalizeBus, getRouteId } from "../../lib/transit/format";

const benefits = [
  { title: "Live Tracking", text: "See buses moving in real time.", icon: Map },
  { title: "Accurate ETA", text: "Know approximately when your bus will reach your stop.", icon: Clock3 },
  { title: "Seat Availability", text: "Check whether seats are available before boarding.", icon: Users },
  { title: "No App Installation", text: "Access transit information directly from a browser.", icon: Smartphone },
];

export default function HomePage() {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [routeGeometries, setRouteGeometries] = useState([]);
  const [transitLoading, setTransitLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      try {
        const [routeData, busData] = await Promise.all([routeService.list(), busService.list()]);
        const routeList = Array.isArray(routeData) ? routeData : routeData.routes || [];
        const routeMap = Object.fromEntries(routeList.map((route) => [getRouteId(route), route]));
        const etaResults = await Promise.all(busData.map(async (bus) => {
          try {
            return await busService.getEta(bus._id);
          } catch {
            return null;
          }
        }));
        const geometryResults = await Promise.all(routeList.map(async (route) => ({
          route,
          stops: await stopService.listByRoute(getRouteId(route)).catch(() => []),
        })));
        if (!cancelled) {
          setRoutes(routeList);
          setBuses(busData.map((bus, index) => normalizeBus(bus, etaResults[index], routeMap)));
          setRouteGeometries(geometryResults);
        }
      } catch (error) {
        console.error("Unable to load home transit data", error);
      } finally {
        if (!cancelled) setTransitLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const activeBuses = buses.filter((bus) => bus.status === "active");
  const mapStops = routeGeometries.flatMap(({ stops }) => stops.filter((stop) => stop.latitude != null && stop.longitude != null));
  const mapPositions = mapStops.map((stop) => [stop.latitude, stop.longitude]);
  const liveBuses = activeBuses;
  const popularRoutes = routes;
  const routeLine = mapPositions;
  const stops = mapStops.map((stop) => ({ ...stop, id: stop._id, name: stop.stopName, position: [stop.latitude, stop.longitude] }));
  const matchingBuses = normalizedSearch
    ? buses.filter((bus) => `${bus.number} ${bus.route} ${bus.routeName} ${bus.nextStop || ""}`.toLowerCase().includes(normalizedSearch))
    : [];
  const matchingRoutes = normalizedSearch
    ? routes.filter((route) => `${route.routeName} ${route.startPoint} ${route.endPoint} ${route.description || ""}`.toLowerCase().includes(normalizedSearch))
    : [];

  function handleSearch(event) {
    event.preventDefault();
    setHasSearched(Boolean(searchTerm.trim()));
  }

  return <div className="min-h-screen overflow-x-hidden bg-[var(--background)]">
    <Navbar />
    <main>
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[#edf7f2]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div className="relative z-10"><Badge tone="success">Faisalabad transit network</Badge><h1 className="mt-5 max-w-2xl text-4xl font-bold leading-[1.08] tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">Smart Public Transit <span className="text-[var(--primary)]">for Faisalabad</span></h1><p className="mt-6 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">Real-time bus tracking, estimated arrival times, route information and seat availability, accessible directly from your browser.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="#live-transit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)]">View Live Buses <ArrowRight size={17} /></Link><Link href="#routes" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]">Explore Routes <Map size={17} /></Link></div><div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--muted)]"><span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-[var(--primary)]" /> No login required</span><span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-[var(--primary)]" /> Live network updates</span></div></div>
          <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:justify-self-end"><div className="rounded-[2rem] border border-[#cfe5dc] bg-white p-3 shadow-[0_24px_60px_rgba(23,51,45,0.12)]"><div className="relative h-[310px] overflow-hidden rounded-[1.5rem] bg-[#e5f1ec] sm:h-[350px]"><div className="absolute inset-0 opacity-70" style={{ backgroundImage: "linear-gradient(#c9dfd6 1px, transparent 1px), linear-gradient(90deg, #c9dfd6 1px, transparent 1px)", backgroundSize: "42px 42px" }} /><div className="absolute left-[12%] top-[60%] h-1 w-[72%] rotate-[-22deg] rounded-full bg-[var(--primary)] shadow-[0_0_0_5px_#087f5b22]" /><div className="absolute left-[18%] top-[52%] h-4 w-4 rounded-full border-4 border-white bg-[var(--primary)] shadow-md" /><div className="absolute left-[47%] top-[38%] h-4 w-4 rounded-full border-4 border-white bg-[var(--primary)] shadow-md" /><div className="absolute right-[16%] top-[26%] h-4 w-4 rounded-full border-4 border-white bg-[var(--primary)] shadow-md" /><div className="absolute left-[45%] top-[32%] grid h-11 w-11 place-items-center rounded-2xl bg-[var(--primary)] text-white shadow-lg shadow-[#087f5b55]"><BusFront size={23} /></div><div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-white/70 bg-white/90 px-4 py-3 shadow-lg backdrop-blur"><div><p className="text-xs text-[var(--muted)]">Network status</p><p className="mt-1 text-sm font-bold text-[var(--foreground)]">3 buses active now</p></div><Badge tone="success">Live</Badge></div></div></div><div className="absolute -right-3 top-8 hidden rounded-xl border border-[var(--border)] bg-white p-3 shadow-lg sm:block"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e4f5ed] text-[var(--primary)]"><Clock3 size={16} /></span><div><p className="text-[10px] text-[var(--muted)]">Next arrival</p><p className="text-sm font-bold text-[var(--foreground)]">4 minutes</p></div></div></div></div>
        </div>
      </section>

      <section className="relative z-20 mx-auto -mt-7 max-w-5xl px-4 sm:px-6"><Card className="p-3 sm:p-4"><form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row"><div className="flex min-h-12 flex-1 items-center gap-3 rounded-xl border border-[var(--border)] bg-[#fbfdfc] px-4"><Search size={19} className="shrink-0 text-[var(--primary)]" /><input value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setHasSearched(false); }} className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]" placeholder="Search routes, buses or stops..." aria-label="Search routes, buses or stops" /></div><Button type="submit" className="min-h-12 gap-2 px-6"><Search size={17} /> Find transit</Button></form>{hasSearched && <div className="mt-3 border-t border-[var(--border)] px-1 pt-3 text-sm text-[var(--muted)]">{matchingBuses.length + matchingRoutes.length > 0 ? <span>Found {matchingBuses.length + matchingRoutes.length} matching transit result{matchingBuses.length + matchingRoutes.length === 1 ? "" : "s"}. <a href="#live-transit" className="font-semibold text-[var(--primary)]">View results below</a></span> : <span>No matching transit found. Try a route number, bus number or stop name.</span>}</div>}</Card></section>

      <section id="live-transit" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8 lg:py-20"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">Right now</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">Live Transit</h2><p className="mt-2 text-sm text-[var(--muted)]">Track buses currently operating across Faisalabad.</p></div><Link href="/live-map" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)]">Open live map <ArrowRight size={16} /></Link></div>{hasSearched && normalizedSearch && matchingBuses.length === 0 ? <div className="mt-8"><EmptyState title="No active buses found" description="Try searching by bus number, route, or next stop." /></div> : <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{liveBuses.map((bus) => <BusCard key={bus.id} bus={bus} />)}</div>}</section>

      <section className="border-y border-[var(--border)] bg-white"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.55fr] lg:items-center lg:px-8 lg:py-20"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">The network at a glance</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">Your journey, in view.</h2><p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">See active buses, nearby stops and route movement together on one clear map.</p><Card className="mt-6 max-w-sm p-4"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e4f5ed] text-[var(--primary)]"><BusFront size={19} /></span><div><p className="text-sm font-bold text-[var(--foreground)]">3 buses currently active</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">R-01, R-04 and R-07 are operating across the city.</p></div></div><div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-3 text-xs text-[var(--success)]"><span className="h-2 w-2 rounded-full bg-current" /> Network operating normally</div></Card></div><div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[#eaf3ef] p-1 shadow-[0_14px_36px_rgba(23,51,45,0.08)]"><ClientTransitMap center={[31.416, 73.078]} zoom={13} className="h-[390px] rounded-xl sm:h-[450px]"><RoutePolyline positions={routeLine} /><MapControls /><>{liveBuses.map((bus) => <BusMarker key={bus.id} position={bus.position} bus={bus} />)}</>{stops.map((stop) => <StopMarker key={stop.id} position={stop.position} stop={stop} />)}</ClientTransitMap><div className="pointer-events-none absolute bottom-5 left-5 z-[400] flex items-center gap-3 rounded-xl border border-white/70 bg-white/95 px-3 py-2.5 shadow-lg"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e4f5ed] text-[var(--primary)]"><MapPin size={16} /></span><div><p className="text-[10px] text-[var(--muted)]">Showing</p><p className="text-xs font-bold text-[var(--foreground)]">Live buses and stops</p></div></div></div></div></section>

      <section id="routes" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8 lg:py-20"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">Plan ahead</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">Popular Routes</h2><p className="mt-2 text-sm text-[var(--muted)]">Find the route that fits your next journey.</p></div><Link href="/routes" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)]">View all routes <ArrowRight size={16} /></Link></div>{hasSearched && normalizedSearch && matchingRoutes.length === 0 ? <div className="mt-8"><EmptyState title="No routes found" description="Try searching by route number, name, starting point, or destination." /></div> : <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{popularRoutes.map((route) => <RouteCard key={route._id || route.id || route.number || route.routeName} route={route} />)}</div>}</section>

      <section className="border-y border-[var(--border)] bg-[#f0f7f4]"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20"><div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">Why Smart Safar</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">Better information for every trip.</h2></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{benefits.map(({ title, text, icon: Icon }) => <Card key={title} className="p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e0f2e9] text-[var(--primary)]"><Icon size={19} /></span><h3 className="mt-5 font-bold text-[var(--foreground)]">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{text}</p></Card>)}</div></div></section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20"><Card className="grid gap-8 overflow-hidden bg-[#173f36] p-6 text-white sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10"><div><Badge className="bg-white/15 text-[#c8f0dd]">Built for safer journeys</Badge><h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Safer &amp; More Reliable Travel</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#cde1d9]">Travel with better context. Women Safety helps passengers share the live location of their selected bus with trusted contacts while keeping their personal location private. Bus Trust Score reflects punctuality and historical arrival performance, while route change alerts keep you informed.</p><div className="mt-6 flex flex-wrap gap-2"><span className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#d5ebe2]">Women Safety</span><span className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#d5ebe2]">Bus Trust Score</span><span className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#d5ebe2]">Route Change Alerts</span></div></div><span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#2d705e] text-[#d5f5e6] lg:mr-5"><ShieldCheck size={32} /></span></Card></section>

      <section className="border-t border-[var(--border)] bg-white"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center lg:px-8"><div><h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Ready to plan your journey?</h2><p className="mt-2 text-sm text-[var(--muted)]">Find your route, track your bus and travel with better information.</p></div><div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row"><Link href="/live-map" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)]">Track a Bus <BusFront size={16} /></Link><Link href="/routes" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]">Explore Routes <ArrowRight size={16} /></Link></div></div></section>
    </main>
    <Footer />
  </div>;
}
