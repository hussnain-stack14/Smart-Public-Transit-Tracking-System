'use client';

// src/app/profile/page.js
// Shows logged-in user's details. Wrapped in <ProtectedRoute> — any authenticated role.

import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/AuthContext";

const ROLE_LABELS = {
  commuter: { label: "Commuter", icon: "🚌", color: "text-teal-soft border-teal/40" },
  driver:   { label: "Driver",   icon: "🚍", color: "text-amber border-amber/40"    },
  admin:    { label: "Admin",    icon: "🛡",  color: "text-coral border-coral/40"    },
};

function ProfileContent() {
  const { user, logout } = useAuth();
  const router           = useRouter();
  const roleInfo         = ROLE_LABELS[user?.role] || ROLE_LABELS.commuter;
  const initial          = user?.name?.charAt(0).toUpperCase() ?? "?";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4 font-body">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-black tracking-wider text-amber uppercase">
            Sawari
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-navy-deep border border-teal/20 p-8 shadow-2xl">

          {/* Avatar + name */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal/20 font-display text-4xl font-black text-amber border-2 border-amber/30">
              {initial}
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-cream">{user?.name}</p>
              <span className={`mt-1 inline-block rounded-full border px-3 py-0.5 text-xs font-semibold ${roleInfo.color}`}>
                {roleInfo.icon} {roleInfo.label}
              </span>
            </div>
          </div>

          {/* Detail rows */}
          <div className="divide-y divide-teal/10 rounded-xl border border-teal/20 bg-navy overflow-hidden">
            <DetailRow label="Email" value={user?.email} />
            {user?.phone && <DetailRow label="Phone" value={user.phone} />}
            <DetailRow label="Role"  value={roleInfo.label} />
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="mt-6 w-full rounded-lg border border-coral/40 bg-coral/10 py-2.5 text-sm font-semibold text-coral transition hover:bg-coral/20 focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 focus:ring-offset-navy-deep"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-teal-soft">{label}</span>
      <span className="text-sm text-cream">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
