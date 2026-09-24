"use client";

import { AlertCircle, BusFront, CalendarCheck, CheckCircle2, Route as RouteIcon } from "lucide-react";
import { Card } from "../common/Card";

export function AdminOverviewCards({ overview, loading }) {
  if (loading) {
    return (
      <div className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="h-full p-5 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-3 w-20 bg-[#e1ede8] rounded" />
                <div className="h-7 w-12 bg-[#d1e6de] rounded" />
                <div className="h-3 w-28 bg-[#e1ede8] rounded" />
              </div>
              <div className="h-10 w-10 bg-[#e1ede8] rounded-xl" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const buses = overview?.buses || { total: 0, active: 0, idle: 0, maintenance: 0 };
  const routesTotal = overview?.routes?.total ?? 0;
  const bookingsToday = overview?.bookingsToday ?? 0;
  const openReports = overview?.openReports ?? 0;

  const cards = [
    {
      label: "Fleet Size",
      value: buses.total,
      detail: `${buses.active} active · ${buses.idle} idle · ${buses.maintenance} maint`,
      icon: BusFront,
      tone: "primary",
    },
    {
      label: "Active Routes",
      value: routesTotal,
      detail: "Operational transit corridors",
      icon: RouteIcon,
      tone: "success",
    },
    {
      label: "Bookings Today",
      value: bookingsToday,
      detail: "Reserved commuter seats",
      icon: CalendarCheck,
      tone: "info",
    },
    {
      label: "Open Reports",
      value: openReports,
      detail: openReports === 0 ? "All incidents resolved" : "Safety & vehicle alerts",
      icon: AlertCircle,
      tone: openReports > 0 ? "warning" : "neutral",
    },
  ];

  return (
    <div className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="h-full p-5 transition hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">{card.detail}</p>
              </div>
              <span className="rounded-xl bg-[#e5f4ee] p-2.5 text-[var(--primary)]">
                <Icon size={20} />
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
