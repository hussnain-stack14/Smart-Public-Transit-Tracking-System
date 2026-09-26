"use client";

import dynamic from "next/dynamic";
import { LoadingSpinner } from "../common/LoadingSpinner";


export const ClientTransitMap = dynamic(() => import("./TransitMap").then((module) => module.TransitMap), { ssr: false, loading: () => <div className="grid min-h-72 place-items-center rounded-2xl bg-[var(--surface-subtle)] text-sm text-[var(--muted)]"><LoadingSpinner label="Loading map..." /></div> });
