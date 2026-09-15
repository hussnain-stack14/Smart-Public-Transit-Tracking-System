"use client";

import dynamic from "next/dynamic";

export const ClientTransitMap = dynamic(() => import("./TransitMap").then((module) => module.TransitMap), { ssr: false, loading: () => <div className="grid min-h-72 place-items-center rounded-2xl bg-[#eaf3ef] text-sm text-[var(--muted)]">Loading map...</div> });
