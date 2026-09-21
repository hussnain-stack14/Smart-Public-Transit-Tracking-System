"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, LogOut, RefreshCw, ShieldAlert } from "lucide-react";
import { Navbar } from "../navigation/Navbar";
import { Footer } from "../navigation/Footer";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import { useLiveBuses } from "../../hooks/useLiveBuses";
import { getProfile } from "../../services/authService";
import { adminService } from "../../services/adminService";
import { busService } from "../../services/busService";
import { routeService } from "../../services/routeService";
import { stopService } from "../../services/stopService";
import { reportService } from "../../services/reportService";
import { clearAccessToken } from "../../lib/auth/token";
import { getOrderedRouteStops } from "../../lib/transit/coordinates";
import { getBusPosition } from "../../lib/transit/format";

import { AdminHeader } from "./AdminHeader";
import { AdminOverviewCards } from "./AdminOverviewCards";
import { LiveTransitPanel } from "./LiveTransitPanel";
import { AdminMapWidget } from "./AdminMapWidget";
import { AnalyticsSection } from "./AnalyticsSection";
import { ReportsWidget } from "./ReportsWidget";
import { QuickActions } from "./QuickActions";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const socket = useSocket();
  const liveUpdates = useLiveBuses([]);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState(() => (socket?.connected ? "live" : "connecting"));

  // Dashboard Data State
  const [overview, setOverview] = useState(null);
  const [bookingAnalytics, setBookingAnalytics] = useState([]);
  const [occupancyAnalytics, setOccupancyAnalytics] = useState([]);
  const [reportsSummary, setReportsSummary] = useState(null);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [reports, setReports] = useState([]);

  // Track individual section load failures
  const [widgetErrors, setWidgetErrors] = useState({});

  const loadDashboardData = useCallback(async () => {
    if (!isAuthenticated) return;
    setError("");

    try {
      // 1. Verify User Profile and Role
      const user = await getProfile();
      if (user.role !== "admin") {
        setProfile(user);
        setError("unauthorized");
        setLoading(false);
        return;
      }
      setProfile(user);

      // 2. Fetch all admin and transit data with Promise.allSettled
      const [
        overviewRes,
        bookingAnalyticsRes,
        occupancyRes,
        reportsSummaryRes,
        busesRes,
        routesRes,
        reportsRes,
      ] = await Promise.allSettled([
        adminService.getOverview(),
        adminService.getBookingAnalytics(),
        adminService.getOccupancyAnalytics(),
        adminService.getReportsSummary(),
        busService.list(),
        routeService.list(),
        reportService.list(),
      ]);

      const errors = {};

      if (overviewRes.status === "fulfilled") {
        setOverview(overviewRes.value);
      } else {
        errors.overview = true;
      }

      if (bookingAnalyticsRes.status === "fulfilled") {
        setBookingAnalytics(Array.isArray(bookingAnalyticsRes.value) ? bookingAnalyticsRes.value : []);
      } else {
        errors.bookings = true;
      }

      if (occupancyRes.status === "fulfilled") {
        setOccupancyAnalytics(Array.isArray(occupancyRes.value) ? occupancyRes.value : []);
      } else {
        errors.occupancy = true;
      }

      if (reportsSummaryRes.status === "fulfilled") {
        setReportsSummary(reportsSummaryRes.value);
      } else {
        errors.reportsSummary = true;
      }

      if (busesRes.status === "fulfilled") {
        setBuses(Array.isArray(busesRes.value) ? busesRes.value : []);
      } else {
        errors.buses = true;
      }

      if (routesRes.status === "fulfilled") {
        setRoutes(Array.isArray(routesRes.value) ? routesRes.value : []);
      } else {
        errors.routes = true;
      }

      if (routesRes.status === "fulfilled" && Array.isArray(routesRes.value)) {
        const stopResults = await Promise.allSettled(routesRes.value.map((route) => stopService.listByRoute(route._id)));
        setStops(stopResults.flatMap((result, index) => result.status === "fulfilled" && Array.isArray(result.value) ? getOrderedRouteStops(result.value, routesRes.value[index]._id) : []));
        if (stopResults.some((result) => result.status !== "fulfilled" || !Array.isArray(result.value))) errors.stops = true;
      } else {
        setStops([]);
        errors.stops = true;
      }

      if (reportsRes.status === "fulfilled") {
        setReports(Array.isArray(reportsRes.value) ? reportsRes.value : []);
      } else {
        errors.reports = true;
      }

      setWidgetErrors(errors);
    } catch (requestError) {
      console.error("Unable to load admin dashboard", requestError);
      if ([401, 403].includes(requestError.response?.status)) {
        setError(requestError.response.status === 403 ? "unauthorized" : "auth");
      } else {
        setError("load");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) loadDashboardData();
    });
    return () => {
      active = false;
    };
  }, [loadDashboardData]);

  // Socket connection lifecycle
  useEffect(() => {
    const markLive = () => setConnection("live");
    const markOffline = () => setConnection("offline");

    socket.on("connect", markLive);
    socket.on("disconnect", markOffline);
    socket.on("connect_error", markOffline);

    return () => {
      socket.off("connect", markLive);
      socket.off("disconnect", markOffline);
      socket.off("connect_error", markOffline);
    };
  }, [socket]);

  // Merge live socket telemetry into buses state
  const liveBuses = useMemo(() => {
    return buses.map((bus) => {
      const update = liveUpdates.find(
        (item) => (item.id || item._id || item.busId)?.toString() === bus._id?.toString()
      );
      if (!update) return bus;

      return {
        ...bus,
        ...update,
        currentLocation:
          update.latitude != null && update.longitude != null
            ? {
                latitude: update.latitude,
                longitude: update.longitude,
                speed: update.speed != null ? update.speed : bus.currentLocation?.speed,
              }
            : bus.currentLocation,
        status: update.status || bus.status,
      };
    });
  }, [buses, liveUpdates]);

  function handleRefresh() {
    setRefreshing(true);
    loadDashboardData();
  }

  function handleLogout() {
    clearAccessToken();
    router.replace("/login?redirect=/admin/dashboard");
  }

  // --- Render Protection / Loading / Error Views ---

  if (authLoading || (loading && !profile && !error)) {
    return (
      <PageShell>
        <div className="grid min-h-[60vh] place-items-center">
          <LoadingSpinner label="Authenticating administrator..." />
        </div>
      </PageShell>
    );
  }

  if (!isAuthenticated || error === "auth") {
    return (
      <PageShell>
        <Card className="mx-auto max-w-lg p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e5f4ee] text-[var(--primary)]">
            <ShieldAlert size={26} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">Sign In Required</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            You must be signed in with an administrator account to access the Smart Safar Admin Console.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Link
              href="/login?redirect=/admin/dashboard"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]"
            >
              Sign In as Admin
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-5 text-sm font-semibold text-[var(--foreground)] hover:bg-[#f5f8f7]"
            >
              Back to Home
            </Link>
          </div>
        </Card>
      </PageShell>
    );
  }

  if (error === "unauthorized") {
    return (
      <PageShell>
        <Card className="mx-auto max-w-lg p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#fde8e8] text-[var(--danger)]">
            <AlertTriangle size={26} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">Admin Access Required</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            You are signed in as <strong>{profile?.name || "User"}</strong> (Role:{" "}
            <span className="capitalize">{profile?.role || "standard"}</span>), which does not have administrator privileges.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Link
              href="/live-map"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]"
            >
              View Live Map
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm font-semibold text-[var(--danger)] hover:bg-[#fff2f2]"
            >
              <LogOut size={15} /> Switch Account
            </button>
          </div>
        </Card>
      </PageShell>
    );
  }

  if (error === "load") {
    return (
      <PageShell>
        <Card className="mx-auto max-w-lg p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#fde8e8] text-[var(--danger)]">
            <AlertTriangle size={26} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">Unable to Load Dashboard</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            We encountered a network or server error while retrieving administrative data.
          </p>
          <div className="mt-6">
            <Button type="button" onClick={loadDashboardData} className="gap-2">
              <RefreshCw size={15} /> Try Again
            </Button>
          </div>
        </Card>
      </PageShell>
    );
  }

  const activeBusesCount = liveBuses.filter((b) => b.status === "active").length;

  return (
    <PageShell>
      {/* 1. Header */}
      <AdminHeader
        profile={profile}
        connection={connection}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onLogout={handleLogout}
      />

      {/* Partial failure notice if any backend API had an issue */}
      {Object.keys(widgetErrors).length > 0 && (
        <div className="mt-4 rounded-xl border border-[#ffe082] bg-[#fffde7] px-4 py-3 text-xs text-[#8d6e1a] flex items-center justify-between">
          <span>Some non-critical dashboard metrics could not be loaded from the server.</span>
          <button
            type="button"
            onClick={handleRefresh}
            className="font-bold underline hover:text-[var(--foreground)] ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Overview KPI Cards */}
      <div className="mt-6">
        <AdminOverviewCards overview={overview} loading={loading} />
      </div>

      {/* 3. Live Transit Map & Fleet Panel Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <AdminMapWidget buses={liveBuses} stops={stops} stopsError={Boolean(widgetErrors.stops)} stopsLoading={loading || refreshing} />
        </div>
        <div>
          <LiveTransitPanel buses={liveBuses} loading={loading} />
        </div>
      </div>

      {/* 4. Analytics: 7-Day Bookings & Route Occupancy */}
      <div className="mt-6">
        <AnalyticsSection
          bookingAnalytics={bookingAnalytics}
          occupancyAnalytics={occupancyAnalytics}
          loading={loading}
        />
      </div>

      {/* 5. Incident Reports & System Quick Actions Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <ReportsWidget
            reports={reports}
            reportsSummary={reportsSummary}
            loading={loading}
          />
        </div>
        <div>
          <QuickActions
            activeBusesCount={activeBusesCount}
            totalBusesCount={liveBuses.length}
            routesCount={routes.length}
            isLive={connection === "live"}
          />
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({ children }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--background)]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}
