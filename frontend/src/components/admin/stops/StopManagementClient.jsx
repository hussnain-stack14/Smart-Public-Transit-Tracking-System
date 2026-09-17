"use client";

import dynamic from "next/dynamic";
import { LoadingSpinner } from "../../common/LoadingSpinner";

const StopManagementPage = dynamic(() => import("./StopManagementPage"), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-screen place-items-center bg-[var(--background)] text-sm text-[var(--muted)]">
      <LoadingSpinner label="Loading stop management..." />
    </div>
  ),
});

export default function StopManagementClient() {
  return <StopManagementPage />;
}
