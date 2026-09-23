"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BusFront, LogOut, Mail, Phone, ShieldCheck, UserRound, X } from "lucide-react";
import { Navbar } from "../../components/navigation/Navbar";
import { Footer } from "../../components/navigation/Footer";
import { ProtectedPage } from "../../components/common/ProtectedPage";
import { clearAccessToken } from "../../lib/auth/token";

export default function ProfilePage() {
  return <div className="min-h-screen bg-[var(--background)]"><Navbar /><main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10"><ProtectedPage>{(user) => <Profile user={user} />}</ProtectedPage></main><Footer /></div>;
}
function Profile({ user }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const initials = user.name?.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "SS";
  const roleLabel = user.role === "admin" ? "Administrator" : user.role === "driver" ? "Driver" : "Commuter";
  function logout() { clearAccessToken(); router.replace("/"); }
  return <><section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-[0_16px_45px_rgba(23,51,45,.08)]"><header className="bg-gradient-to-br from-[#075f46] to-[#0a8a64] p-6 text-white sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><span className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl border border-white/30 bg-white/15 text-2xl font-bold">{initials}</span><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[.16em] text-white/75">My account</p><h1 className="mt-2 break-words text-3xl font-bold">{user.name}</h1><p className="mt-2 inline-flex items-center gap-2 text-sm text-white/85"><ShieldCheck size={16} /> {roleLabel}</p></div></div></header><div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-8"><ProfileItem icon={Mail} label="Email" value={user.email} /><ProfileItem icon={Phone} label="Phone" value={user.phone || "Not provided"} /><ProfileItem icon={UserRound} label="Account type" value={roleLabel} />{user.role === "driver" && <ProfileItem icon={BusFront} label="Assigned bus" value={user.assignedBus?.busNumber || (user.assignedBus ? "Assigned bus" : "No bus assigned")} />}<div className="sm:col-span-2 rounded-2xl bg-[#f4f8f6] p-4"><h2 className="font-bold">Account information</h2><p className="mt-1 text-sm leading-6 text-[var(--muted)]">Your account details are managed securely by Smart Safar. Contact an administrator if something needs to be updated.</p></div><button type="button" onClick={() => setConfirm(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#efcaca] px-5 text-sm font-bold text-[var(--danger)] hover:bg-[#fff3f3] sm:col-span-2 sm:justify-self-start"><LogOut size={17} /> Log out</button></div></section>{confirm && <div className="app-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirm(false); }}><section className="app-logout-dialog" role="alertdialog" aria-modal="true" aria-labelledby="profile-logout-title"><button type="button" className="app-dialog-close" aria-label="Close" onClick={() => setConfirm(false)}><X size={18} /></button><span className="app-dialog-icon"><LogOut size={22} /></span><h2 id="profile-logout-title">Log out?</h2><p>Are you sure you want to log out?</p><div><button type="button" onClick={() => setConfirm(false)}>Cancel</button><button type="button" className="is-danger" onClick={logout}>Log out</button></div></section></div>}</>;
}
function ProfileItem({ icon: Icon, label, value }) { return <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-[var(--border)] p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e7f5ed] text-[var(--primary)]"><Icon size={18} /></span><div className="min-w-0"><p className="text-xs text-[var(--muted)]">{label}</p><p className="mt-1 break-words font-semibold capitalize">{value}</p></div></div>; }
