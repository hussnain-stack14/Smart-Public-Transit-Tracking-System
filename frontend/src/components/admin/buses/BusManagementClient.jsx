"use client";

import dynamic from "next/dynamic";
import { LoadingSpinner } from "../../common/LoadingSpinner";

const BusManagementPage = dynamic(() => import("./BusManagementPage"), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-screen place-items-center bg-[var(--background)] text-sm text-[var(--muted)]">
      <LoadingSpinner label="Loading fleet bus management..." />
    </div>
  ),
});

export default function BusManagementClient() {
  return <BusManagementPage />;
}
