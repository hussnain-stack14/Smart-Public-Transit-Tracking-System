"use client";

import { LogOut, RefreshCw, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";

export function AdminHeader({ profile, connection, onRefresh, refreshing, onLogout }) {
  const isLive = connection === "live";
  const isConnecting = connection === "connecting";

  return (
    <header className="flex flex-col justify-between gap-5 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
            Administration Console
          </p>
          <span className="inline-flex items-center gap-1 rounded-md bg-[#d8f1e6] px-2 py-0.5 text-[11px] font-semibold text-[var(--primary-dark)]">
            <ShieldCheck size={13} /> Admin
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {profile?.name ? `Logged in as ${profile.name}` : "System Overview & Transit Operations"}
          {profile?.email ? ` (${profile.email})` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={isLive ? "success" : isConnecting ? "warning" : "danger"} className="gap-1.5 py-1 px-3">
          {isLive ? <Wifi size={13} /> : <WifiOff size={13} />}
          {isLive ? "Socket Live" : isConnecting ? "Connecting" : "Socket Offline"}
        </Badge>

        {onRefresh && (
          <Button
            type="button"
            variant="secondary"
            className="gap-2 text-xs"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh dashboard data"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </Button>
        )}

        <Button
          type="button"
          variant="secondary"
          className="gap-2 text-xs text-[var(--danger)] hover:bg-[#fff2f2]"
          onClick={onLogout}
        >
          <LogOut size={14} /> Log out
        </Button>
      </div>
    </header>
  );
}
