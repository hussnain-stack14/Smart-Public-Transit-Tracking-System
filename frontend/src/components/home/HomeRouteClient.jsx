"use client";

import dynamic from "next/dynamic";
import { LoadingSpinner } from "../common/LoadingSpinner";

import { useAuth } from "../../hooks/useAuth";

const loading = () => <div className="grid min-h-[55vh] place-items-center p-4"><LoadingSpinner label="Loading Smart Safar..." /></div>;

const HomePage = dynamic(() => import("./HomePage"), { ssr: false, loading });
const CommuterHome = dynamic(() => import("./CommuterHome"), { ssr: false, loading });

export default function HomeRouteClient() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <CommuterHome /> : <HomePage />;
}
