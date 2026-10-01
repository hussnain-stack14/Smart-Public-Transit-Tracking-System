"use client";

import dynamic from "next/dynamic";
import { LoadingSpinner } from "../common/LoadingSpinner";


const LiveMapPage = dynamic(() => import("./LiveMapPage"), {
  ssr: false,
  loading: () => <div className="grid min-h-screen place-items-center bg-[var(--background)] text-sm text-[var(--muted)]"><LoadingSpinner label="Loading live transit map..." /></div>,
});

export default function LiveMapRouteClient() {
  return <LiveMapPage />;
}
