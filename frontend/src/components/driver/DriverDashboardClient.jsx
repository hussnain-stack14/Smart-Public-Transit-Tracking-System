"use client";

import dynamic from "next/dynamic";
import { LoadingSpinner } from "../common/LoadingSpinner";

const DriverDashboardPage = dynamic(() => import("./DriverDashboardPage"), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-screen place-items-center bg-[var(--background)] text-sm text-[var(--muted)]">
      <LoadingSpinner label="Loading driver dashboard..." />
    </div>
  ),
});

export default function DriverDashboardClient() {
  return <DriverDashboardPage />;
}
