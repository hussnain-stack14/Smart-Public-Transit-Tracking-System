"use client";

import dynamic from "next/dynamic";

const RouteDetailsPage = dynamic(() => import("./RouteDetailsPage"), {
  ssr: false,
  loading: () => <div className="grid min-h-screen place-items-center bg-[var(--background)] text-sm text-[var(--muted)]">Loading route details...</div>,
});

export default function RouteDetailsRouteClient({ routeId }) {
  return <RouteDetailsPage routeId={routeId} />;
}
