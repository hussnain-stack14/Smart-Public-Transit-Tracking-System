"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Camera, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, LogOut, Mail, Pencil, Phone, ShieldCheck, UserRound, X } from "lucide-react";
import { Navbar } from "../../components/navigation/Navbar";
import { Footer } from "../../components/navigation/Footer";
import { ProtectedPage } from "../../components/common/ProtectedPage";
import { Button } from "../../components/common/Button";
import { clearAccessToken } from "../../lib/auth/token";
import { changePassword, updateProfile } from "../../services/authService";

const MAX_IMAGE_BYTES = 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ProfilePage() {
  return <div className="min-h-screen bg-[var(--background)]"><Navbar /><main className="mx-auto w-full max-w-xl px-4 py-6 sm:px-6 sm:py-10"><ProtectedPage>{(user) => <Profile user={user} />}</ProtectedPage></main><Footer /></div>;
}

function Profile({ user }) {
  const router = useRouter();
  const [profile, setProfile] = useState(user);
  const [dialog, setDialog] = useState("");
  const [draft, setDraft] = useState({ name: user.name || "", phone: user.phone || "" });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(user.profileImage || "");
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => () => { if (preview.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

  const initials = profile.name?.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "SS";

  function closeDialog() {
    setDialog(""); setFormError(""); setPhoto(null); setPreview(profile.profileImage || ""); setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
  }

  function openEdit() {
    setDraft({ name: profile.name || "", phone: profile.phone || "" });
    setPhoto(null); setPreview(profile.profileImage || ""); setFormError(""); setDialog("edit");
  }

  function selectPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) { setFormError("Choose a JPEG, PNG, or WebP image."); return; }
    if (file.size > MAX_IMAGE_BYTES) { setFormError("Profile images must be 1 MB or smaller."); return; }
    setFormError(""); setPhoto(file); setPreview(URL.createObjectURL(file));
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!draft.name.trim()) { setFormError("Enter your name."); return; }
    setBusy(true); setFormError("");
    try {
      const values = { name: draft.name.trim(), phone: draft.phone.trim() };
      if (photo) values.profileImage = await fileToDataUrl(photo);
      const saved = await updateProfile(values);
      setProfile(saved); setNotice("Profile updated successfully."); closeDialog();
    } catch (error) { setFormError(error.response?.data?.message || "Unable to save your profile. Please try again."); }
    finally { setBusy(false); }
  }

  async function savePassword(event) {
    event.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) { setFormError("Complete all password fields."); return; }
    if (passwords.newPassword.length < 6) { setFormError("Your new password must contain at least 6 characters."); return; }
    if (passwords.newPassword !== passwords.confirmPassword) { setFormError("New passwords do not match."); return; }
    setBusy(true); setFormError("");
    try { await changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }); setNotice("Password changed successfully."); closeDialog(); }
    catch (error) { setFormError(error.response?.data?.message || "Unable to change your password. Please try again."); }
    finally { setBusy(false); }
  }

  function logout() { clearAccessToken(); router.replace("/"); }

  return <><section className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_18px_48px_rgba(0,0,0,0.08)]"><header className="border-b border-black/10 bg-black px-5 pb-6 pt-7 text-white sm:px-8"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">Passenger profile</p><div className="mt-5 flex items-center gap-4"><ProfileAvatar src={profile.profileImage} initials={initials} size="large" /><div className="min-w-0"><h1 className="truncate text-2xl font-bold">{profile.name}</h1><p className="mt-1 truncate text-sm text-white/65">{profile.email}</p></div></div></header><div className="space-y-5 p-5 sm:p-7">{notice && <div className="flex items-start gap-2 rounded-xl border border-black/10 bg-[var(--primary-soft)] px-3 py-3 text-sm text-black" role="status"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[var(--primary)]" />{notice}<button type="button" onClick={() => setNotice("")} className="ml-auto text-black/50" aria-label="Dismiss message"><X size={16} /></button></div>}<div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-black">Personal details</h2><p className="mt-1 text-sm text-black/55">Keep your passenger account up to date.</p></div><button type="button" onClick={openEdit} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--primary)] px-3.5 text-sm font-bold text-white transition hover:brightness-95"><Pencil size={15} /> Edit</button></div><div className="grid gap-3"><Detail icon={Mail} label="Email" value={profile.email} /><Detail icon={Phone} label="Phone" value={profile.phone || "Not added"} /><Detail icon={UserRound} label="Account" value="Passenger" /></div><section className="rounded-2xl border border-black/10 p-4"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black text-[var(--primary)]"><ShieldCheck size={18} /></span><div className="min-w-0 flex-1"><h2 className="font-bold text-black">Account & security</h2><p className="mt-1 text-sm leading-5 text-black/55">Manage your password and sign-in method.</p></div></div><button type="button" onClick={() => { setFormError(""); setDialog("password"); }} className="mt-4 flex min-h-11 w-full items-center justify-between rounded-xl border border-black/10 px-3 text-left text-sm font-semibold text-black transition hover:bg-black/[.03]"><span className="inline-flex items-center gap-2"><KeyRound size={16} className="text-[var(--primary)]" />Change password</span><span aria-hidden="true">›</span></button><div className="mt-2 flex min-h-11 items-center gap-2 rounded-xl bg-black/[.03] px-3 text-sm text-black/65">{profile.googleConnected ? <><CheckCircle2 size={16} className="text-[var(--primary)]" />Google is connected to this passenger account.</> : <><LockKeyhole size={16} className="text-[var(--primary)]" />Email and password sign-in is enabled.</>}</div></section><button type="button" onClick={() => setConfirmLogout(true)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-black/15 px-4 text-sm font-bold text-black transition hover:bg-black hover:text-white"><LogOut size={16} />Log out</button></div></section>{dialog === "edit" && <Modal title="Edit profile" onClose={closeDialog}><form className="grid gap-5" onSubmit={saveProfile}><div className="flex items-center gap-4"><ProfileAvatar src={preview} initials={initials} /><label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-black/15 px-3 text-sm font-bold text-black hover:bg-black/[.03]"><Camera size={16} />Change photo<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={selectPhoto} /></label></div><p className="-mt-3 text-xs text-black/50">JPEG, PNG, or WebP. Maximum 1 MB.</p><Field label="Name"><input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="profile-input" autoComplete="name" /></Field><Field label="Phone"><input value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} className="profile-input" autoComplete="tel" placeholder="Add your phone number" /></Field>{formError && <FormError message={formError} />}<div className="grid grid-cols-2 gap-3"><Button type="button" variant="secondary" onClick={closeDialog} disabled={busy}>Cancel</Button><Button type="submit" className="bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]" disabled={busy}>{busy ? "Saving..." : "Save changes"}</Button></div></form></Modal>}{dialog === "password" && <Modal title="Change password" onClose={closeDialog}><form className="grid gap-4" onSubmit={savePassword}><p className="text-sm leading-5 text-black/55">Use your current password to confirm this change.</p><PasswordField label="Current password" value={passwords.currentPassword} visible={showPasswords.current} onChange={(value) => setPasswords((current) => ({ ...current, currentPassword: value }))} onToggle={() => setShowPasswords((current) => ({ ...current, current: !current.current }))} autoComplete="current-password" /><PasswordField label="New password" value={passwords.newPassword} visible={showPasswords.next} onChange={(value) => setPasswords((current) => ({ ...current, newPassword: value }))} onToggle={() => setShowPasswords((current) => ({ ...current, next: !current.next }))} autoComplete="new-password" /><PasswordField label="Confirm new password" value={passwords.confirmPassword} visible={showPasswords.confirm} onChange={(value) => setPasswords((current) => ({ ...current, confirmPassword: value }))} onToggle={() => setShowPasswords((current) => ({ ...current, confirm: !current.confirm }))} autoComplete="new-password" />{formError && <FormError message={formError} />}<div className="grid grid-cols-2 gap-3"><Button type="button" variant="secondary" onClick={closeDialog} disabled={busy}>Cancel</Button><Button type="submit" className="bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]" disabled={busy}>{busy ? "Updating..." : "Change password"}</Button></div></form></Modal>}{confirmLogout && <Modal title="Log out?" onClose={() => setConfirmLogout(false)}><p className="text-sm leading-6 text-black/60">You will need to sign in again to manage bookings and trips.</p><div className="mt-6 grid grid-cols-2 gap-3"><Button type="button" variant="secondary" onClick={() => setConfirmLogout(false)}>Cancel</Button><button type="button" onClick={logout} className="min-h-10 rounded-xl bg-black px-4 text-sm font-bold text-white">Log out</button></div></Modal>}</>;
}

function ProfileAvatar({ src, initials, size = "normal" }) { return src ? <img src={src} alt="Profile photo" className={size === "large" ? "h-24 w-24 shrink-0 rounded-full border-2 border-[var(--primary)] object-cover" : "h-16 w-16 shrink-0 rounded-full border-2 border-[var(--primary)] object-cover"} /> : <span className={size === "large" ? "grid h-24 w-24 shrink-0 place-items-center rounded-full border-2 border-[var(--primary)] bg-white text-2xl font-bold text-black" : "grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 border-[var(--primary)] bg-white text-lg font-bold text-black"}>{initials}</span>; }
function Detail({ icon: Icon, label, value }) { return <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-black/10 px-3.5 py-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-black text-[var(--primary)]"><Icon size={17} /></span><div className="min-w-0"><p className="text-xs text-black/50">{label}</p><p className="mt-0.5 truncate text-sm font-semibold text-black">{value}</p></div></div>; }
function Field({ label, children }) { return <label className="grid gap-1.5 text-sm font-semibold text-black">{label}{children}</label>; }
function PasswordField({ label, value, visible, onChange, onToggle, autoComplete }) { return <Field label={label}><div className="relative"><input type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} className="profile-input pr-11" /><button type="button" onClick={onToggle} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-black/55" aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></Field>; }
function FormError({ message }) { return <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert"><AlertCircle size={16} className="mt-0.5 shrink-0" />{message}</p>; }
function Modal({ title, children, onClose }) { return <div className="app-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6" role="dialog" aria-modal="true" aria-label={title}><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-xl font-bold text-black">{title}</h2><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-black/60 hover:bg-black/[.05]" aria-label="Close"><X size={18} /></button></div>{children}</section></div>; }
function fileToDataUrl(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error("Unable to read this image.")); reader.readAsDataURL(file); }); }
