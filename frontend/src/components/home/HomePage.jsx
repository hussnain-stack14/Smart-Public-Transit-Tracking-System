"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BusFront,
  CheckCircle2,
  Clock3,
  Map,
  MapPin,
  Route as RouteIcon,
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
import { Card } from "../common/Card";
import { LoadingSpinner } from "../common/LoadingSpinner";
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
  { title: "Live Tracking", text: "See active buses across the city.", icon: Map },
  { title: "Useful ETAs", text: "Know when an operating bus is due.", icon: Clock3 },
  { title: "Seat Updates", text: "Check availability before you board.", icon: Users },
  { title: "Browser Access", text: "No app installation is required.", icon: Smartphone },
];

const isOperating = (bus) => String(bus.status).toLowerCase() === "active";

function MobileBusCard({ bus }) {
  return <Link href={`/buses/${bus.id}`} className="flex min-w-0 items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-3.5 shadow-[0_5px_18px_rgba(15,23,42,0.05)]">
    <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary-ink)]"><BusFront size={20} /></span>
    <span className="grid min-w-0 flex-1 gap-1"><strong className="truncate text-sm text-[var(--foreground)]">{bus.number}</strong><small className="truncate text-xs text-[var(--muted)]">{bus.directionLabel || bus.routeName}</small></span>
    <span className="flex-none text-right"><small className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--success)]">Live</small>{bus.eta && <strong className="mt-1 block text-xs text-[var(--foreground)]">{bus.eta}</strong>}</span>
  </Link>;
}

function MobileRouteCard({ route }) {
  const routeId = route._id || route.id || route.number;
  const routeLabel = route.number || route.routeCode || "Route";
  return <article className="flex w-[82vw] max-w-[310px] flex-none flex-col rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_5px_18px_rgba(15,23,42,0.05)]">
    <div className="flex items-center justify-between gap-3"><span className="rounded-lg bg-[var(--primary-soft)] px-2.5 py-1.5 text-xs font-extrabold text-[var(--primary-ink)]">{routeLabel}</span>{route.isActive !== false && <span className="text-[10px] font-bold text-[var(--success)]">● Active</span>}</div>
    <h3 className="mt-3 truncate text-base font-bold text-[var(--foreground)]">{route.routeName || route.name}</h3>
    <p className="mt-1 line-clamp-2 min-h-9 text-xs leading-[1.45] text-[var(--muted)]">{route.startPoint || route.start} <ArrowRight className="inline" size={12} /> {route.endPoint || route.end}</p>
    <Link href={`/routes/${routeId}`} className="mt-3 inline-flex min-h-10 items-center gap-1 border-t border-[var(--border)] pt-3 text-xs font-bold text-[var(--primary-ink)]">View route <ArrowRight size={14} /></Link>
  </article>;
}

export default function HomePage() {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [routeGeometries, setRouteGeometries] = useState([]);
  const [transitLoading, setTransitLoading] = useState(true);
  const [transitError, setTransitError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      try {
        const [routeData, busData] = await Promise.all([routeService.list(), busService.list()]);
        const routeList = Array.isArray(routeData) ? routeData : routeData.routes || [];
        const busList = Array.isArray(busData) ? busData : busData.buses || [];
        const routeMap = Object.fromEntries(routeList.map((route) => [getRouteId(route), route]));
        const etaResults = await Promise.all(busList.map(async (bus) => isOperating(bus) ? busService.getEta(bus._id).catch(() => null) : null));
        const geometryResults = await Promise.all(routeList.map(async (route) => ({ route, stops: await stopService.listByRoute(getRouteId(route)).catch(() => []) })));
        if (!cancelled) {
          setRoutes(routeList);
          setBuses(busList.map((bus, index) => normalizeBus(bus, etaResults[index], routeMap)));
          setRouteGeometries(geometryResults);
        }
      } catch (error) {
        console.error("Unable to load home transit data", error);
        if (!cancelled) setTransitError(true);
      } finally {
        if (!cancelled) setTransitLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (window.location.hash === "#transit-search") searchRef.current?.focus();
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const activeBuses = buses.filter(isOperating);
  const matchingBuses = normalizedSearch ? activeBuses.filter((bus) => `${bus.number} ${bus.route} ${bus.routeName} ${bus.nextStop || ""}`.toLowerCase().includes(normalizedSearch)) : [];
  const matchingRoutes = normalizedSearch ? routes.filter((route) => `${route.routeName} ${route.startPoint} ${route.endPoint} ${route.description || ""}`.toLowerCase().includes(normalizedSearch)) : [];
  const displayedBuses = hasSearched && normalizedSearch ? matchingBuses : activeBuses;
  const displayedRoutes = hasSearched && normalizedSearch ? matchingRoutes : routes;
  const mapStops = routeGeometries.flatMap(({ stops }) => stops.filter((stop) => stop.latitude != null && stop.longitude != null));
  const stops = mapStops.map((stop) => ({ ...stop, id: stop._id, name: stop.stopName, position: [stop.latitude, stop.longitude] }));

  function handleSearch(event) {
    event.preventDefault();
    const validSearch = Boolean(searchTerm.trim());
    setHasSearched(validSearch);
    if (validSearch) document.getElementById("live-transit")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function focusSearch() {
    window.history.replaceState(null, "", "#transit-search");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    searchRef.current?.focus();
  }

  return <div className="public-shell min-h-screen overflow-x-hidden bg-[var(--background)]">
    <Navbar />
    <main>
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--primary-soft)]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-6 pt-7 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="relative z-10">
            <Badge tone="success" className="hidden md:inline-flex">Faisalabad transit network</Badge>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--primary-ink)] md:hidden">Plan your next journey</p>
            <h1 className="mt-2 max-w-2xl text-[2rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[var(--foreground)] sm:text-5xl lg:mt-5 lg:text-6xl"><span className="md:hidden">Where are you going?</span><span className="hidden md:inline">Smart Public Transit <span className="text-[var(--primary-ink)]">for Faisalabad</span></span></h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-lg md:mt-6 md:leading-7">Search routes and buses, check live arrivals, and move around Faisalabad with confidence.</p>
            <div className="mt-8 hidden flex-col gap-3 sm:flex-row md:flex"><Link href="#live-transit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-contrast)] transition hover:bg-[var(--primary-dark)]">View Live Buses <ArrowRight size={17} /></Link><Link href="#routes" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary-ink)]">Explore Routes <Map size={17} /></Link></div>
            <div className="mt-8 hidden flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--muted)] md:flex"><span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-[var(--primary-ink)]" /> No login required</span><span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-[var(--primary-ink)]" /> Live network updates</span></div>
          </div>
          <div className="relative mx-auto hidden w-full max-w-lg md:block lg:mx-0 lg:justify-self-end">
            <div className="overflow-hidden rounded-[2rem] border border-[var(--primary-border)] shadow-[0_24px_60px_rgba(15,23,42,0.15)]">
              <div className="relative h-[310px] sm:h-[360px]">
                <img
                  src="/faisalabad-clocktower.jpg"
                  alt="Ghanta Ghar clock tower at the heart of Faisalabad city"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
                {/* Orange gradient overlay keeps the design system cohesive */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-white/30 bg-black/50 px-4 py-3 shadow-lg backdrop-blur-md">
                  <div>
                    <p className="text-xs text-white/70">Network status</p>
                    <p className="mt-1 text-sm font-bold text-white">
                      {transitLoading ? "Checking live service…" : `${activeBuses.length} ${activeBuses.length === 1 ? "bus" : "buses"} active now`}
                    </p>
                  </div>
                  <Badge tone={activeBuses.length ? "success" : "neutral"}>{activeBuses.length ? "Live" : "Quiet"}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="transit-search" className="relative z-20 mx-auto max-w-5xl scroll-mt-24 px-4 pt-4 sm:px-6 md:-mt-7 md:pt-0"><Card className="p-3 sm:p-4"><form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row"><label className="flex min-h-13 flex-1 items-center gap-3 rounded-xl border border-[var(--primary-border)] bg-white px-4 focus-within:border-[var(--primary)] focus-within:ring-4 focus-within:ring-[var(--primary-soft-strong)]"><Search size={19} className="shrink-0 text-[var(--primary-ink)]" /><input ref={searchRef} value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setHasSearched(false); }} className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]" placeholder="Route, bus or stop" aria-label="Search routes, buses or stops" /></label><button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 text-sm font-bold text-[var(--primary-contrast)] hover:bg-[var(--primary-dark)]"><Search size={17} /> Find transit</button></form>{hasSearched && <p className="mt-3 border-t border-[var(--border)] px-1 pt-3 text-sm text-[var(--muted)]">{matchingBuses.length + matchingRoutes.length > 0 ? `${matchingBuses.length + matchingRoutes.length} matching transit result${matchingBuses.length + matchingRoutes.length === 1 ? "" : "s"}.` : "No matching transit found. Try a route, bus number or stop."}</p>}</Card></section>

      <section className="mx-auto max-w-5xl px-4 pt-4 sm:px-6 md:hidden" aria-label="Quick actions"><div className="grid grid-cols-3 gap-2"><Link href="/live-map" className="public-quick-action"><span><BusFront size={19} /></span>Live Buses</Link><Link href="/routes" className="public-quick-action"><span><RouteIcon size={19} /></span>Routes</Link><button type="button" onClick={focusSearch} className="public-quick-action"><span><Search size={19} /></span>Find a Bus</button></div></section>

      <section id="live-transit" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-8 sm:px-6 md:py-16 lg:px-8 lg:py-20"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary-ink)]">Right now</p><h2 className="mt-1 text-xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-3xl md:mt-2">Live Transit</h2><p className="mt-1 text-xs text-[var(--muted)] sm:text-sm md:mt-2">Buses currently operating across Faisalabad.</p></div><Link href="/live-map" className="inline-flex min-h-10 flex-none items-center gap-1 text-xs font-bold text-[var(--primary-ink)] sm:text-sm">View all <ArrowRight size={15} /></Link></div>
        {transitLoading ? <div className="mt-4 py-4"><LoadingSpinner label="Loading live buses..." /></div> : transitError ? <div className="mt-4"><EmptyState title="Live transit is unavailable" description="We couldn't retrieve current bus information right now." /></div> : displayedBuses.length ? <><div className="mt-4 grid gap-2.5 md:hidden">{displayedBuses.slice(0, 3).map((bus) => <MobileBusCard key={bus.id} bus={bus} />)}</div><div className="mt-8 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">{displayedBuses.slice(0, 6).map((bus) => <BusCard key={bus.id} bus={bus} />)}</div></> : <div className="mt-4"><EmptyState title={hasSearched ? "No active buses found" : "No buses operating right now"} description={hasSearched ? "Try another bus number, route, or stop." : "Live details will appear when service is active."} /></div>}
      </section>

      <section className="border-y border-[var(--border)] bg-white"><div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:gap-8 md:py-16 lg:grid-cols-[1fr_1.55fr] lg:items-center lg:px-8 lg:py-20"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary-ink)]">Live network map</p><h2 className="mt-1 text-xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-3xl md:mt-2">Your journey, in view.</h2><p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">See active buses, stops and route movement together.</p><div className="mt-4 hidden max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 md:block"><p className="text-sm font-bold text-[var(--foreground)]">{transitLoading ? "Checking service…" : `${activeBuses.length} active ${activeBuses.length === 1 ? "bus" : "buses"}`}</p><p className="mt-1 text-xs text-[var(--muted)]">Map data comes from the current transit network.</p></div></div><div><div className="public-home-map relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-1 shadow-[0_14px_36px_rgba(15,23,42,0.08)]"><ClientTransitMap center={[31.416, 73.078]} zoom={13} className="h-[270px] rounded-xl sm:h-[340px] lg:h-[450px]">{routeGeometries.map(({ route, stops: routeStops }) => { const positions = routeStops.filter((stop) => stop.latitude != null && stop.longitude != null).map((stop) => [stop.latitude, stop.longitude]); return positions.length > 1 ? <RoutePolyline key={getRouteId(route)} positions={positions} /> : null; })}<MapControls />{activeBuses.filter((bus) => bus.position).map((bus) => <BusMarker key={bus.id} position={bus.position} bus={bus} />)}{stops.map((stop) => <StopMarker key={stop.id} position={stop.position} stop={stop} />)}</ClientTransitMap></div><Link href="/live-map" className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--primary-border)] bg-white text-sm font-bold text-[var(--primary-ink)] md:hidden"><MapPin size={17} /> View live map</Link></div></div></section>

      <section id="routes" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-8 sm:px-6 md:py-16 lg:px-8 lg:py-20"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary-ink)]">Plan ahead</p><h2 className="mt-1 text-xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-3xl md:mt-2">Popular Routes</h2><p className="mt-1 text-xs text-[var(--muted)] sm:text-sm md:mt-2">Find a route for your next journey.</p></div><Link href="/routes" className="inline-flex min-h-10 flex-none items-center gap-1 text-xs font-bold text-[var(--primary-ink)] sm:text-sm">View all <ArrowRight size={15} /></Link></div>
        {transitLoading ? <div className="mt-4 py-4"><LoadingSpinner label="Loading routes..." /></div> : displayedRoutes.length ? <><div className="public-route-scroll -mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-2 md:hidden">{displayedRoutes.slice(0, 5).map((route) => <MobileRouteCard key={getRouteId(route)} route={route} />)}</div><div className="mt-8 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">{displayedRoutes.slice(0, 6).map((route) => <RouteCard key={getRouteId(route)} route={route} />)}</div></> : <div className="mt-4"><EmptyState title="No routes found" description="Try another route name, starting point, or destination." /></div>}
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--primary-soft)]"><div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-16 lg:px-8 lg:py-20"><div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary-ink)]">Why Smart Safar</p><h2 className="mt-1 text-xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-3xl md:mt-2">Better information for every trip.</h2></div><div className="mt-4 grid grid-cols-2 gap-2.5 md:mt-8 md:grid-cols-4 md:gap-4">{benefits.map(({ title, text, icon: Icon }) => <Card key={title} className="p-4 md:p-5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary-ink)] md:h-10 md:w-10"><Icon size={18} /></span><h3 className="mt-3 text-sm font-bold text-[var(--foreground)] md:mt-5 md:text-base">{title}</h3><p className="mt-1 text-xs leading-5 text-[var(--muted)] md:mt-2 md:text-sm md:leading-6">{text}</p></Card>)}</div></div></section>

      <section className="mx-auto hidden max-w-7xl px-4 py-16 sm:px-6 md:block lg:px-8 lg:py-20"><Card className="grid gap-8 overflow-hidden bg-[var(--foreground)] p-8 text-white lg:grid-cols-[1fr_auto] lg:items-center lg:p-10"><div><Badge className="bg-white/15 text-[var(--primary-soft-strong)]">Built for safer journeys</Badge><h2 className="mt-4 text-3xl font-bold tracking-tight">Safer &amp; More Reliable Travel</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--primary-border)]">Travel with better context. Women Safety helps passengers share the live location of their selected bus with trusted contacts while keeping their personal location private. Bus Trust Score reflects punctuality and historical arrival performance, while route change alerts keep you informed.</p></div><span className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--primary-dark)] text-[var(--primary-soft-strong)] lg:mr-5"><ShieldCheck size={32} /></span></Card></section>

      <section className="border-t border-[var(--border)] bg-white"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:py-14 lg:px-8"><div><h2 className="text-xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-2xl">Ready to plan your journey?</h2><p className="mt-1 text-sm text-[var(--muted)] md:mt-2">Find your route and track your bus with live information.</p></div><div className="grid w-full grid-cols-2 gap-2.5 sm:w-auto"><Link href="/live-map" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-contrast)]">Track a Bus</Link><Link href="/routes" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--foreground)]">View Routes</Link></div></div></section>
    </main>
    <Footer />
  </div>;
}
