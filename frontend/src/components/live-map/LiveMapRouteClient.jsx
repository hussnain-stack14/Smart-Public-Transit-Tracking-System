"use client";

import dynamic from "next/dynamic";

const LiveMapPage = dynamic(() => import("./LiveMapPage"), {
  ssr: false,
  loading: () => <div className="grid min-h-screen place-items-center bg-[var(--background)] text-sm text-[var(--muted)]">Loading live transit map...</div>,
});

export default function LiveMapRouteClient() {
  return <LiveMapPage />;
}
