import { Suspense } from "react";
import RegisterPage from "../../components/auth/RegisterPage";

export const metadata = {
  title: "Create Account | Smart Safar Faisalabad",
  description: "Create a Smart Safar Faisalabad commuter account.",
};

export default function RegisterRoute() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[var(--background)] text-sm text-[var(--muted)]">Loading...</div>}>
      <RegisterPage />
    </Suspense>
  );
}
