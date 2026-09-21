"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BusFront, ChartNoAxesCombined, Flag, History, House, LogOut, MapPinned, Route, Ticket, UserRound, Users } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { clearAccessToken } from "../../lib/auth/token";
import { getProfile, getRoleHome } from "../../services/authService";
import { BrandMark } from "../common/BrandMark";

const commuter = [
  { href: "/", label: "Home", icon: House },
  { href: "/live-map", label: "Buses", icon: BusFront },
  { href: "/routes", label: "Routes", icon: Route },
  { href: "/booking", label: "Bookings", icon: Ticket },
  { href: "/my-trips", label: "My Trips", icon: History },
  { href: "/profile", label: "Profile", icon: UserRound },
];
const driver = [
  { href: "/driver/dashboard", label: "Dashboard", icon: House },
  { href: "/driver/dashboard#driver-map", label: "Route", icon: MapPinned },
  { href: "/reports", label: "Reports", icon: Flag },
  { href: "/profile", label: "Profile", icon: UserRound },
];
const admin = [
  { href: "/admin/dashboard", label: "Dashboard", icon: ChartNoAxesCombined },
  { href: "/admin/buses", label: "Buses", icon: BusFront },
  { href: "/admin/routes", label: "Routes", icon: Route },
  { href: "/admin/users", label: "Drivers", icon: Users },
  { href: "/admin/stops", label: "Stops", icon: MapPinned },
  { href: "/admin/alerts", label: "Alerts", icon: Bell },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/profile", label: "Profile", icon: UserRound },
];

function Navigation({ items, pathname, mobile = false }) {
  return <nav aria-label={mobile ? "Mobile app navigation" : "Application navigation"} className={mobile ? "app-bottom-nav" : "app-desktop-nav"}>
    {items.map(({ href, label, icon: Icon }) => {
      const path = href.split("#")[0];
      const active = !href.includes("#") && (path === "/" ? pathname === "/" : pathname === path || (path !== "/profile" && pathname.startsWith(path + "/")));
      return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={active ? "app-nav-link is-active" : "app-nav-link"}><Icon size={mobile ? 20 : 18} /><span>{label}</span></Link>;
    })}
  </nav>;
}
function allowed(path, role) {
  if (path.startsWith("/admin")) return role === "admin";
  if (path.startsWith("/driver")) return role === "driver";
  if (path.startsWith("/booking") || path.startsWith("/my-trips") || path === "/safety") return role === "commuter";
  if (path === "/reports") return role === "driver" || role === "commuter";
  return true;
}
export function AppExperience({ children }) {
  const { token } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState({ token: null, user: null, error: "" });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!token) return;
    let active = true;
    getProfile().then(user => { if (active) setProfile({ token, user, error: "" }); }).catch(error => {
      if (active) setProfile({ token, user: null, error: [401, 403].includes(error.response?.status) ? "auth" : "load" });
    });
    return () => { active = false; };
  }, [token, retry]);
  const user = token && profile.token === token ? profile.user : null;
  const error = token && profile.token === token ? profile.error : "";
  const authPage = pathname === "/login" || pathname === "/register";
  useEffect(() => {
    if (!user) return;
    if (authPage) {
      const requested = new URLSearchParams(window.location.search).get("redirect");
      const safe = requested?.startsWith("/") && !requested.startsWith("//") && !requested.startsWith("/login") && !requested.startsWith("/register") ? requested : "/";
      router.replace(getRoleHome(user.role, safe));
    } else if (pathname === "/" && user.role !== "commuter") router.replace(getRoleHome(user.role));
  }, [user, authPage, pathname, router]);
  if (!token || pathname.startsWith("/safety/track/")) return children;
  if (error === "load") return <div className="app-auth-state"><p>Unable to verify your account. Check your connection and try again.</p><button type="button" onClick={() => setRetry(n => n + 1)}>Try again</button></div>;
  if (error === "auth") return <div className="app-auth-state"><p>Your session has expired.</p><Link href="/login">Sign in</Link></div>;
  if (!user) return <div className="app-auth-state" role="status">Loading your account…</div>;
  if (!allowed(pathname, user.role)) return <div className="app-auth-state"><p>This page is unavailable for your account.</p><Link href={getRoleHome(user.role)}>Go to your dashboard</Link></div>;
  if (authPage || (pathname === "/" && user.role !== "commuter")) return <div className="app-auth-state" role="status">Opening your dashboard…</div>;
  const role = user.role;
  const items = role === "admin" ? admin : role === "driver" ? driver : commuter;
  const title = role === "admin" ? "Admin Panel" : role === "driver" ? "Driver Dashboard" : "Smart Safar";
  function logout() { clearAccessToken(); router.replace("/"); }
  return <div className={"app-experience app-experience--" + role}>
    <header className="app-header"><div className="app-header-inner"><Link href={getRoleHome(role)} className="app-brand"><BrandMark size={34} /><span><strong>{title}</strong><small>{role === "commuter" ? "Faisalabad transit" : "Smart Safar"}</small></span></Link><div className="app-header-actions"><span className="app-role-label">{role === "admin" ? "Administrator" : role === "driver" ? "Driver mode" : "Commuter"}</span><button type="button" onClick={logout} aria-label="Log out" className="app-logout"><LogOut size={18} /><span>Log out</span></button></div></div></header>
    <div className="app-frame"><aside className="app-sidebar"><Navigation items={items} pathname={pathname} /></aside><div className="app-content">{role === "admin" && <nav className="app-admin-shortcuts" aria-label="More admin tools">{admin.slice(4, 7).map(({ href, label, icon: Icon }) => <Link key={href} href={href}><Icon size={16} />{label}</Link>)}</nav>}{children}</div></div>
    <Navigation items={role === "admin" ? [admin[0], admin[1], admin[2], admin[3], admin[7]] : items} pathname={pathname} mobile />
  </div>;
}

