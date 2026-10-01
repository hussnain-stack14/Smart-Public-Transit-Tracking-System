"use client";

import dynamic from "next/dynamic";
import { LoadingSpinner } from "../common/LoadingSpinner";


const BusDetailsPage = dynamic(() => import("./BusDetailsPage"), {
  ssr: false,
  loading: () => <div className="grid min-h-screen place-items-center bg-[var(--background)] text-sm text-[var(--muted)]"><LoadingSpinner label="Loading bus details..." /></div>,
});

export default function BusDetailsRouteClient({ busId }) {
  return <BusDetailsPage busId={busId} />;
}
