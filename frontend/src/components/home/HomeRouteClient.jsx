"use client";

import dynamic from "next/dynamic";
import { useAuth } from "../../hooks/useAuth";
import CommuterHome from "./CommuterHome";

const HomePage = dynamic(() => import("./HomePage"), {
  ssr: false,
  loading: () => <HomeSkeleton />,
});

function HomeSkeleton() {
  return <main className="min-h-screen overflow-x-hidden bg-[var(--background)]" aria-busy="true">
    <section className="border-b border-[var(--border)] bg-[#edf7f2]"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20"><div className="animate-pulse"><div className="h-4 w-40 rounded bg-[#cfe5dc]" /><div className="mt-5 h-12 max-w-xl rounded bg-[#dcebe5]" /><div className="mt-3 h-5 max-w-lg rounded bg-[#dcebe5]" /></div><div className="hidden h-72 rounded-[2rem] bg-[#dcebe5] lg:block" /></div></section>
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><div className="h-14 rounded-2xl border border-[var(--border)] bg-white" /><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-40 animate-pulse rounded-2xl border border-[var(--border)] bg-white" />)}</div></section>
  </main>;
}

export default function HomeRouteClient() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <CommuterHome /> : <HomePage />;
}
