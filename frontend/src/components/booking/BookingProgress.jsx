import { Check } from "lucide-react";

const steps = ["Trip Details", "Seat Selection", "Confirmation"];

export function BookingProgress({ currentStep }) {
  return <ol className="mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:max-w-2xl sm:gap-4" aria-label="Booking steps">
    {steps.map((label, index) => {
      const step = index + 1;
      const current = currentStep === step;
      return <li key={label} aria-current={current ? "step" : undefined} className="flex min-w-0 flex-col items-center gap-1.5 text-center sm:flex-row sm:text-left">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${current ? "bg-[var(--primary)] text-white" : currentStep > step ? "bg-[#dff2e8] text-[var(--primary)]" : "border border-[var(--border)] bg-white text-[var(--muted)]"}`}>{currentStep > step ? <Check size={14} /> : step}</span>
        <span className={`min-w-0 text-[10px] leading-3 sm:text-xs sm:leading-4 ${current ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted)]"}`}>{label}</span>
      </li>;
    })}
  </ol>;
}

