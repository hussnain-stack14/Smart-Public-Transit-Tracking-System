"use client";
import { RefreshCw, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";

export function AdminHeader({ profile, connection, onRefresh, refreshing }) {
  const isLive = connection === "live";
  const isConnecting = connection === "connecting";
  return <header className="flex flex-col justify-between gap-5 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end"><div><div className="flex items-center gap-2"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">Administration</p><span className="inline-flex items-center gap-1 rounded-md bg-[#d8f1e6] px-2 py-0.5 text-[11px] font-semibold text-[var(--primary-dark)]"><ShieldCheck size={13} /> Admin</span></div><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Dashboard</h1><p className="mt-2 text-sm text-[var(--muted)]">{profile?.name ? `Welcome back, ${profile.name}` : "Transit operations overview"}</p></div><div className="flex flex-wrap items-center gap-3"><Badge tone={isLive ? "success" : isConnecting ? "warning" : "danger"} className="gap-1.5 px-3 py-1">{isLive ? <Wifi size={13} /> : <WifiOff size={13} />}{isLive ? "Live connection" : isConnecting ? "Connecting" : "Connection offline"}</Badge>{onRefresh && <Button type="button" variant="secondary" className="gap-2 text-xs" onClick={onRefresh} disabled={refreshing}><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh</Button>}</div></header>;
}
