"use client";

import dynamic from "next/dynamic";
import { LoadingSpinner } from "../../common/LoadingSpinner";

const RouteManagementPage = dynamic(() => import("./RouteManagementPage"), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-screen place-items-center bg-[var(--background)] text-sm text-[var(--muted)]">
      <LoadingSpinner label="Loading route management..." />
    </div>
  ),
});

export default function RouteManagementClient() {
  return <RouteManagementPage />;
}
