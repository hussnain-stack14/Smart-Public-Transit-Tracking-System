import { Suspense } from "react";
import LoginPage from "../../components/auth/LoginPage";

export const metadata = {
  title: "Sign In | Smart Transit Faisalabad",
  description: "Sign in to your Smart Transit Faisalabad account.",
};

export default function LoginRoute() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[var(--background)] text-sm text-[var(--muted)]">Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}
