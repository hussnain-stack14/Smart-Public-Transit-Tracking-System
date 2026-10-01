"use client";

import dynamic from "next/dynamic";
import { LoadingSpinner } from "../common/LoadingSpinner";

const AdminDashboardPage = dynamic(() => import("./AdminDashboardPage"), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-screen place-items-center bg-[var(--background)] text-sm text-[var(--muted)]">
      <LoadingSpinner label="Loading administration dashboard..." />
    </div>
  ),
});

export default function AdminDashboardClient() {
  return <AdminDashboardPage />;
}
