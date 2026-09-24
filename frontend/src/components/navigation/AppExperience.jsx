"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BusFront, ChartNoAxesCombined, Flag, History, House, LogOut, MapPinned, Route, Ticket, UserRound, Users, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { clearAccessToken, getAccessToken } from "../../lib/auth/token";
import { getProfile, getRoleHome } from "../../services/authService";
import { alertService } from "../../services/alertService";
import { routeService } from "../../services/routeService";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { BrandMark } from "../common/BrandMark";

const commuter = [
  { href: "/", label: "Home", icon: House },
  { href: "/live-map", label: "Live Buses", shortLabel: "Buses", icon: BusFront },
  { href: "/routes", label: "Routes", icon: Route },
  { href: "/booking", label: "Bookings", icon: Ticket },
  { href: "/my-trips", label: "My Trips", icon: History },
];
const driver = [
  { href: "/driver/dashboard", label: "Dashboard", icon: House },
  { href: "/driver/dashboard#driver-map", label: "Route", icon: MapPinned },
  { href: "/driver/dashboard#driver-passengers", label: "Passengers", icon: Users },
  { href: "/reports", label: "Reports", icon: Flag },
  { href: "/driver/dashboard#driver-shift", label: "Shift", icon: History },
];
const admin = [
  { href: "/admin/dashboard", label: "Dashboard", icon: ChartNoAxesCombined },
  { href: "/admin/buses", label: "Buses", icon: BusFront },
  { href: "/admin/routes", label: "Routes", icon: Route },
  { href: "/admin/users", label: "Drivers", icon: Users },
  { href: "/admin/stops", label: "Stops", icon: MapPinned },
  { href: "/admin/reports", label: "Reports", icon: Flag },
];

function Navigation({ items, pathname, activeHash, onNavigate, mobile = false }) {
  return <nav aria-label={mobile ? "Mobile app navigation" : "Application navigation"} className={mobile ? "app-bottom-nav" : "app-desktop-nav"}>
    {items.map(({ href, label, shortLabel, icon: Icon }) => {
      const [path, fragment] = href.split("#");
      const sameSection = items.some((item) => item.href.startsWith(path + "#"));
      const active = fragment
        ? pathname === path && activeHash === `#${fragment}`
        : (!activeHash || !sameSection) && (path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/"));
      return <Link key={href} href={href} onClick={(event) => onNavigate?.(event, href)} aria-current={active ? "page" : undefined} className={active ? "app-nav-link is-active" : "app-nav-link"}><Icon size={mobile ? 20 : 18} /><span>{mobile && shortLabel ? shortLabel : label}</span></Link>;
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
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [activeHash, setActiveHash] = useState("");
  const [notifications, setNotifications] = useState({ status: "loading", items: [] });
  const accountRef = useRef(null);
  const notificationsRef = useRef(null);

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
  const isBookingPage = pathname === "/booking" || pathname.startsWith("/booking/");

  useEffect(() => {
    if (!isBookingPage) return;
    if (error === "auth" && getAccessToken() === token) clearAccessToken();
    // Read storage here: the server snapshot is signed out until hydration finishes.
    // Do not redirect a commuter whose saved session is still being restored.
    if (!getAccessToken()) {
      const requested = window.location.pathname + window.location.search + window.location.hash;
      router.replace("/login?redirect=" + encodeURIComponent(requested));
    }
  }, [isBookingPage, pathname, token, error, router]);

  const loadNotifications = useCallback(async () => {
    setNotifications((current) => ({ ...current, status: "loading" }));
    try {
      const result = await routeService.list();
      const routes = Array.isArray(result) ? result : result.routes || [];
      const alertResults = await Promise.allSettled(routes.map((route) => alertService.listByRoute(route._id)));
      const items = alertResults.flatMap((result, index) => result.status === "fulfilled" && Array.isArray(result.value)
        ? result.value.map((alert) => ({ ...alert, routeName: routes[index].routeName }))
        : []);
      items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setNotifications({ status: alertResults.some((result) => result.status === "rejected") && !items.length ? "error" : "ready", items });
    } catch {
      setNotifications({ status: "error", items: [] });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.resolve().then(loadNotifications);
  }, [user, loadNotifications]);

  useEffect(() => {
    if (!user) return;
    if (authPage) {
      const requested = new URLSearchParams(window.location.search).get("redirect");
      const safe = requested?.startsWith("/") && !requested.startsWith("//") && !requested.startsWith("/login") && !requested.startsWith("/register") ? requested : "/";
      router.replace(getRoleHome(user.role, safe));
    } else if (pathname === "/" && user.role !== "commuter") router.replace(getRoleHome(user.role));
  }, [user, authPage, pathname, router]);

  useEffect(() => {
    const updateHash = () => setActiveHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, [pathname]);

  useEffect(() => {
    if (!accountOpen && !notificationsOpen) return;
    const close = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
      if (!notificationsRef.current?.contains(event.target)) setNotificationsOpen(false);
    };
    const escape = (event) => { if (event.key === "Escape") { setAccountOpen(false); setNotificationsOpen(false); } };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [accountOpen, notificationsOpen]);

  // Never mount booking forms or their data effects before authentication succeeds.
  if (isBookingPage && (!token || error === "auth")) return <div className="app-auth-state"><p role="status">Please sign in to book a ticket.</p></div>;
  if (!token || pathname.startsWith("/safety/track/")) return children;
  if (error === "load") return <div className="app-auth-state"><p>Unable to verify your account. Check your connection and try again.</p><button type="button" onClick={() => setRetry(n => n + 1)}>Try again</button></div>;
  if (error === "auth") return <div className="app-auth-state"><p>Your session has expired.</p><Link href="/login">Sign in</Link></div>;
  if (!user) return <div className="app-auth-state" ><LoadingSpinner label="Loading your account..." /></div>;
  if (!allowed(pathname, user.role)) return <div className="app-auth-state"><p>You don&apos;t have permission to access this page.</p><Link href={getRoleHome(user.role)}>Go to your dashboard</Link></div>;
  if (authPage || (pathname === "/" && user.role !== "commuter")) return <div className="app-auth-state" ><LoadingSpinner label="Opening your dashboard..." /></div>;

  const role = user.role;
  const items = role === "admin" ? admin : role === "driver" ? driver : commuter;
  const mobileItems = role === "admin" ? [admin[0], admin[1], admin[2], admin[4], admin[5]] : items;
  const title = role === "admin" ? "Admin Panel" : role === "driver" ? "Driver Dashboard" : "Smart Safar";
  const initials = user.name?.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "SS";
  function logout() { clearAccessToken(); setConfirmLogout(false); setAccountOpen(false); router.replace("/"); }
  function navigate(event, href) {
    const [path, hash] = href.split("#");
    if (!hash || path !== pathname) return;
    event.preventDefault();
    const target = document.getElementById(hash);
    if (target) {
      window.history.pushState(null, "", href);
      setActiveHash(`#${hash}`);
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return <div className={"app-experience app-experience--" + role}>
    <header className="app-header"><div className="app-header-inner"><Link href={getRoleHome(role)} className="app-brand"><BrandMark size={34} /><span><strong>{title}</strong><small>{role === "commuter" ? "Faisalabad transit" : "Smart Safar"}</small></span></Link><div className="app-header-actions"><span className="app-role-label">{role === "admin" ? "Administrator" : role === "driver" ? "Driver mode" : "Commuter"}</span><div className="app-notifications" ref={notificationsRef}><button type="button" className="app-icon-button" aria-label="Open notifications" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((open) => !open); setAccountOpen(false); }}><Bell size={19} />{notifications.items.length > 0 && <span>{notifications.items.length > 9 ? "9+" : notifications.items.length}</span>}</button>{notificationsOpen && <section className="app-notification-panel" role="dialog" aria-label="Notifications"><header><div><p>Notifications</p><span>Current route alerts</span></div><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications"><X size={17} /></button></header><div className="app-notification-list">{notifications.status === "loading" ? <p className="app-notification-state">Loading alerts…</p> : notifications.status === "error" ? <div className="app-notification-state"><p>Alerts are unavailable right now.</p><button type="button" onClick={loadNotifications}>Try again</button></div> : notifications.items.length ? notifications.items.map((alert) => <article key={alert._id}><span className="app-notification-icon"><Bell size={15} /></span><div><strong>{alert.routeName || "Route alert"}</strong><p>{alert.message}</p>{(alert.createdAt || alert.expiresAt) && <time>{alert.createdAt ? new Date(alert.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : `Active until ${new Date(alert.expiresAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`}</time>}</div></article>) : <p className="app-notification-state">No new alerts</p>}</div>{role === "admin" && <Link href="/admin/alerts" onClick={() => setNotificationsOpen(false)} className="app-notification-manage">Manage route alerts</Link>}</section>}</div><div className="app-account" ref={accountRef}><button type="button" className="app-avatar" aria-label="Open profile menu" aria-expanded={accountOpen} onClick={() => { setAccountOpen((open) => !open); setNotificationsOpen(false); }}>{initials}</button>{accountOpen && <div className="app-account-menu" role="menu"><div className="app-account-summary"><strong>{user.name}</strong><span>{user.email}</span></div><Link href="/profile" role="menuitem" onClick={() => setAccountOpen(false)}><UserRound size={17} /> Profile</Link><button type="button" role="menuitem" onClick={() => { setAccountOpen(false); setConfirmLogout(true); }}><LogOut size={17} /> Log out</button></div>}</div></div></div></header>
    <div className="app-frame"><aside className="app-sidebar"><Navigation items={items} pathname={pathname} activeHash={activeHash} onNavigate={navigate} /></aside><div className="app-content">{children}</div></div>
    <Navigation items={mobileItems} pathname={pathname} activeHash={activeHash} onNavigate={navigate} mobile />
    {confirmLogout && <div className="app-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmLogout(false); }}><section className="app-logout-dialog" role="alertdialog" aria-modal="true" aria-labelledby="logout-title"><button type="button" className="app-dialog-close" aria-label="Close" onClick={() => setConfirmLogout(false)}><X size={18} /></button><span className="app-dialog-icon"><LogOut size={22} /></span><h2 id="logout-title">Log out?</h2><p>Are you sure you want to log out?</p><div><button type="button" onClick={() => setConfirmLogout(false)}>Cancel</button><button type="button" className="is-danger" onClick={logout}>Log out</button></div></section></div>}
  </div>;
}
