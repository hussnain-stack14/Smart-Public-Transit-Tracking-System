import { Suspense } from "react";
import LoginPage from "../../components/auth/LoginPage";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

export const metadata = {
  title: "Sign In | Smart Safar Faisalabad",
  description: "Sign in to your Smart Safar Faisalabad account.",
};

export default function LoginRoute() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[var(--background)]"><LoadingSpinner /></div>}>
      <LoginPage />
    </Suspense>
  );
}
