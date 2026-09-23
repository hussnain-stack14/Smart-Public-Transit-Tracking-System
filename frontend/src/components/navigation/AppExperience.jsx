"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BusFront, ChartNoAxesCombined, Flag, History, House, LogOut, MapPinned, Route, Ticket, UserRound, Users, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { clearAccessToken } from "../../lib/auth/token";
import { getProfile, getRoleHome } from "../../services/authService";
import { BrandMark } from "../common/BrandMark";

const commuter = [
  { href: "/", label: "Home", icon: House }, { href: "/live-map", label: "Buses", icon: BusFront },
  { href: "/routes", label: "Routes", icon: Route }, { href: "/booking", label: "Bookings", icon: Ticket },
  { href: "/my-trips", label: "My Trips", icon: History }, { href: "/profile", label: "Profile", icon: UserRound },
];
const driver = [
  { href: "/driver/dashboard", label: "Dashboard", icon: House }, { href: "/driver/dashboard#driver-map", label: "Route", icon: MapPinned },
  { href: "/reports", label: "Reports", icon: Flag }, { href: "/profile", label: "Profile", icon: UserRound },
];
const admin = [
  { href: "/admin/dashboard", label: "Dashboard", icon: ChartNoAxesCombined }, { href: "/admin/buses", label: "Buses", icon: BusFront },
  { href: "/admin/routes", label: "Routes", icon: Route }, { href: "/admin/users", label: "Drivers", icon: Users },
  { href: "/admin/stops", label: "Stops", icon: MapPinned }, { href: "/admin/alerts", label: "Alerts", icon: Bell },
  { href: "/admin/reports", label: "Reports", icon: Flag }, { href: "/profile", label: "Profile", icon: UserRound },
];

function Navigation({ items, pathname, activeHash, onNavigate, mobile = false }) {
  return <nav aria-label={mobile ? "Mobile app navigation" : "Application navigation"} className={mobile ? "app-bottom-nav" : "app-desktop-nav"}>
    {items.map(({ href, label, icon: Icon }) => {
      const [path, fragment] = href.split("#");
      const sameSection = items.some((item) => item.href.startsWith(path + "#"));
      const active = fragment ? pathname === path && activeHash === `#${fragment}` : !activeHash || !sameSection ? (path === "/" ? pathname === "/" : pathname === path || (path !== "/profile" && pathname.startsWith(path + "/"))) : false;
      return <Link key={href} href={href} onClick={(event) => onNavigate?.(event, href)} aria-current={active ? "page" : undefined} className={active ? "app-nav-link is-active" : "app-nav-link"}><Icon size={mobile ? 20 : 18} aria-hidden="true" /><span>{label}</span></Link>;
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
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [activeHash, setActiveHash] = useState("");
  const accountRef = useRef(null);

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

  useEffect(() => {
    const updateHash = () => setActiveHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, [pathname]);

  useEffect(() => {
    if (!accountOpen) return;
    const close = (event) => { if (!accountRef.current?.contains(event.target)) setAccountOpen(false); };
    const escape = (event) => { if (event.key === "Escape") setAccountOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [accountOpen]);

  if (!token || pathname.startsWith("/safety/track/")) return children;
  if (error === "load") return <div className="app-auth-state"><p>Unable to verify your account. Check your connection and try again.</p><button type="button" onClick={() => setRetry(n => n + 1)}>Try again</button></div>;
  if (error === "auth") return <div className="app-auth-state"><p>Your session has expired.</p><Link href="/login">Sign in</Link></div>;
  if (!user) return <div className="app-auth-state" role="status">Loading your account…</div>;
  if (!allowed(pathname, user.role)) return <div className="app-auth-state"><p>You don&apos;t have permission to access this page.</p><Link href={getRoleHome(user.role)}>Go to your dashboard</Link></div>;
  if (authPage || (pathname === "/" && user.role !== "commuter")) return <div className="app-auth-state" role="status">Opening your dashboard…</div>;

  const role = user.role;
  const items = role === "admin" ? admin : role === "driver" ? driver : commuter;
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
    <header className="app-header"><div className="app-header-inner"><Link href={getRoleHome(role)} className="app-brand"><BrandMark size={34} /><span><strong>{title}</strong><small>{role === "commuter" ? "Faisalabad transit" : "Smart Safar"}</small></span></Link><div className="app-header-actions"><span className="app-role-label">{role === "admin" ? "Administrator" : role === "driver" ? "Driver mode" : "Commuter"}</span><div className="app-account" ref={accountRef}><button type="button" className="app-avatar" aria-label="Open account menu" aria-expanded={accountOpen} aria-haspopup="menu" onClick={() => setAccountOpen((open) => !open)}>{initials}</button>{accountOpen && <div className="app-account-menu" role="menu"><div className="app-account-summary"><strong>{user.name}</strong><span>{user.email}</span></div><Link href="/profile" role="menuitem" onClick={() => setAccountOpen(false)}><UserRound size={17} aria-hidden="true" /> Profile</Link><button type="button" role="menuitem" onClick={() => { setAccountOpen(false); setConfirmLogout(true); }}><LogOut size={17} aria-hidden="true" /> Log out</button></div>}</div></div></div></header>
    <div className="app-frame"><aside className="app-sidebar"><Navigation items={items} pathname={pathname} activeHash={activeHash} onNavigate={navigate} /></aside><div className="app-content">{role === "admin" && <nav className="app-admin-shortcuts" aria-label="More admin tools">{admin.slice(4, 7).map(({ href, label, icon: Icon }) => <Link key={href} href={href}><Icon size={16} />{label}</Link>)}</nav>}{children}</div></div>
    <Navigation items={role === "admin" ? [admin[0], admin[1], admin[2], admin[3], admin[7]] : items} pathname={pathname} activeHash={activeHash} onNavigate={navigate} mobile />
    {confirmLogout && <div className="app-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmLogout(false); }}><section className="app-logout-dialog" role="alertdialog" aria-modal="true" aria-labelledby="logout-title" aria-describedby="logout-description"><button type="button" className="app-dialog-close" aria-label="Close" onClick={() => setConfirmLogout(false)}><X size={18} /></button><span className="app-dialog-icon"><LogOut size={22} /></span><h2 id="logout-title">Log out?</h2><p id="logout-description">Are you sure you want to log out?</p><div><button type="button" onClick={() => setConfirmLogout(false)}>Cancel</button><button type="button" className="is-danger" onClick={logout}>Log out</button></div></section></div>}
  </div>;
}
