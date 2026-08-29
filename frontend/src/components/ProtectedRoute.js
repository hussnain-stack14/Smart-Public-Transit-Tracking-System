'use client';

// src/components/ProtectedRoute.js
// Wraps any page that requires authentication.
//
// Props:
//   children     — the page content to render when access is granted
//   allowedRoles — optional string[], e.g. ["admin"] or ["driver", "admin"]
//                  if omitted, any authenticated user is allowed

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // wait until the initial session check is done

    if (!user) {
      router.push("/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // User is authenticated but not authorised for this route
      router.push("/?error=unauthorized");
    }
  }, [user, loading, router, allowedRoles]);

  // --- Render states ---

  // Still checking session
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-navy">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber border-t-transparent" />
      </div>
    );
  }

  // Render children only when access is confirmed
  if (user && (!allowedRoles || allowedRoles.includes(user.role))) {
    return <>{children}</>;
  }

  // Return null during the redirect (avoids a flash of content)
  return null;
}
