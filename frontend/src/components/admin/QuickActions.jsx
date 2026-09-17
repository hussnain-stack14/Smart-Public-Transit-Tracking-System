"use client";

import Link from "next/link";
import { ArrowRight, Compass, MapPin, Navigation, Ticket, History, Activity, BusFront, Users } from "lucide-react";
import { Card } from "../common/Card";

export function QuickActions({ activeBusesCount = 0, totalBusesCount = 0, routesCount = 0, isLive }) {
  const fleetRatio = totalBusesCount > 0 ? Math.round((activeBusesCount / totalBusesCount) * 100) : 0;

  const links = [
    { label: "Driver Management", description: "Fleet driver references and account availability", href: "/admin/users", icon: Users },
    {
      label: "Bus Management",
      description: "Manage transit fleet, register units, and update routes",
      href: "/admin/buses",
      icon: BusFront,
      badge: `${totalBusesCount} Buses`,
    },
    {
      label: "Live Fleet Map",
      description: "Interactive transit tracking and bus location feed",
      href: "/live-map",
      icon: Navigation,
      badge: `${activeBusesCount} Active`,
    },
    {
      label: "Transit Routes",
      description: "All active corridors, stops, and schedules",
      href: "/routes",
      icon: Compass,
      badge: `${routesCount} Routes`,
    },
    {
      label: "Seat Booking",
      description: "Seat reservation portal and seat availability preview",
      href: "/booking",
      icon: Ticket,
    },
    {
      label: "Booking History",
      description: "Commuter reservations and passenger trip ledger",
      href: "/my-trips",
      icon: History,
    },
  ];

  return (
    <Card className="p-5">
      <div className="border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-[var(--primary)]" />
          <h2 className="text-base font-bold text-[var(--foreground)]">System & Quick Links</h2>
        </div>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          Direct navigation to core transit modules
        </p>
      </div>

      {/* Operational Indicators */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[var(--border)] bg-[#f8faf9] p-3">
          <p className="text-[11px] font-semibold text-[var(--muted)]">Fleet Active Ratio</p>
          <p className="mt-1 text-lg font-bold text-[var(--foreground)]">{fleetRatio}%</p>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#dbe8e2] overflow-hidden">
            <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: `${fleetRatio}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[#f8faf9] p-3">
          <p className="text-[11px] font-semibold text-[var(--muted)]">Socket Telemetry</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isLive ? "bg-[var(--success)] animate-pulse" : "bg-[var(--danger)]"
              }`}
            />
            <span className="text-sm font-bold text-[var(--foreground)]">
              {isLive ? "Operational" : "Disconnected"}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-[var(--muted)]">
            {isLive ? "Real-time updates active" : "Check network or backend"}
          </p>
        </div>
      </div>

      {/* Navigation shortcuts */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center justify-between rounded-xl border border-[var(--border)] p-3 transition hover:border-[var(--primary)] hover:bg-[#f0f8f4]"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-[#eaf3ef] p-2 text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white transition">
                  <Icon size={16} />
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="rounded-full bg-[#d8f1e6] px-1.5 py-0.2 text-[10px] font-semibold text-[var(--primary-dark)]">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--muted)] line-clamp-1">{item.description}</p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-[var(--muted)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition"
              />
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
