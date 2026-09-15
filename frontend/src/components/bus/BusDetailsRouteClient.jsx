"use client";

import dynamic from "next/dynamic";

const BusDetailsPage = dynamic(() => import("./BusDetailsPage"), {
  ssr: false,
  loading: () => <div className="grid min-h-screen place-items-center bg-[var(--background)] text-sm text-[var(--muted)]">Loading bus details...</div>,
});

export default function BusDetailsRouteClient({ busId }) {
  return <BusDetailsPage busId={busId} />;
}
