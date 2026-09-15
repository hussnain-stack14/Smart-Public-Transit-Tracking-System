import { Check } from "lucide-react";

export function BookingProgress({ currentStep }) {
  const steps = ["Trip Details", "Seat Selection", "Confirmation"];
  return <div className="mt-8 flex max-w-2xl items-center gap-2 text-xs sm:gap-4">{steps.map((label, index) => <div key={label} className="contents"><div className="flex shrink-0 items-center gap-2"><span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${currentStep === index + 1 ? "bg-[var(--primary)] text-white" : currentStep > index + 1 ? "bg-[#dff2e8] text-[var(--primary)]" : "border border-[var(--border)] bg-white text-[var(--muted)]"}`}>{currentStep > index + 1 ? <Check size={14} /> : index + 1}</span><span className={currentStep === index + 1 ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted)]"}>{label}</span></div>{index < steps.length - 1 && <span className="h-px flex-1 bg-[var(--border)]" />}</div>)}</div>;
}
