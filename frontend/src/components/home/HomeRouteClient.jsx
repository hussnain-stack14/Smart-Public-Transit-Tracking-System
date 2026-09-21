"use client";

import dynamic from "next/dynamic";
import { useAuth } from "../../hooks/useAuth";

const HomePage = dynamic(() => import("./HomePage"), { ssr: false });
const CommuterHome = dynamic(() => import("./CommuterHome"), { ssr: false });

export default function HomeRouteClient() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <CommuterHome /> : <HomePage />;
}
