"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BusFront, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { Input } from "../common/Input";
import { useAuth } from "../../hooks/useAuth";
import { getRoleHome, login } from "../../services/authService";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

function safeRedirect(value) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [hasSubmittedLogin, setHasSubmittedLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(loginSchema) });
  const redirectTo = safeRedirect(searchParams.get("redirect"));

  useEffect(() => {
    if (!authLoading && isAuthenticated && !hasSubmittedLogin) router.replace(redirectTo);
  }, [authLoading, hasSubmittedLogin, isAuthenticated, redirectTo, router]);

  async function handleLogin(values) {
    setHasSubmittedLogin(true);
    setSubmitting(true);
    setServerError("");
    try {
      const user = await login(values);
      router.replace(getRoleHome(user.role, redirectTo));
    } catch (error) {
      setHasSubmittedLogin(false);
      setServerError(error.response?.data?.message || "Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="flex min-h-screen flex-col bg-[var(--background)]"><div className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8"><div className="w-full max-w-md"><Link href="/" className="mx-auto flex w-fit items-center gap-2.5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--primary)] text-white"><BusFront size={20} /></span><span className="leading-none"><span className="block text-sm font-bold text-[var(--foreground)]">Smart Transit</span><span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Faisalabad</span></span></Link><Card className="mt-6 p-6 sm:p-8"><div className="text-center"><h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Welcome Back</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Sign in to continue to your Smart Transit account.</p></div>{serverError && <div className="mt-6 rounded-xl border border-[#f4cccc] bg-[#fff8f8] px-4 py-3 text-sm text-[var(--danger)]" role="alert">{serverError}</div>}<form className="mt-6 grid gap-5" onSubmit={handleSubmit(handleLogin)} noValidate><label className="grid gap-1.5 text-sm font-semibold text-[var(--foreground)]" htmlFor="email">Email address<div className="relative"><Mail size={17} className="pointer-events-none absolute left-3 top-3 text-[var(--muted)]" /><input id="email" type="email" autoComplete="email" placeholder="you@example.com" className="field-input pl-10" {...register("email")} /></div>{errors.email && <span className="text-xs font-normal text-[var(--danger)]">{errors.email.message}</span>}</label><label className="grid gap-1.5 text-sm font-semibold text-[var(--foreground)]" htmlFor="password">Password<div className="relative"><LockKeyhole size={17} className="pointer-events-none absolute left-3 top-3 text-[var(--muted)]" /><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" className="field-input px-10" {...register("password")} /><button type="button" className="absolute right-2 top-1.5 grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-[#eef7f3] hover:text-[var(--primary)]" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{errors.password && <span className="text-xs font-normal text-[var(--danger)]">{errors.password.message}</span>}</label><Button type="submit" className="mt-1 min-h-12 w-full" disabled={submitting}>{submitting ? "Signing In..." : "Sign In"}</Button></form></Card><p className="mt-6 text-center text-sm text-[var(--muted)]">Public transit information is available without an account.</p><Link href="/live-map" className="mt-3 block text-center text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)]">Continue browsing</Link></div></div></main>;
}
