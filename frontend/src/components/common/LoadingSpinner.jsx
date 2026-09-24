import { BusFront } from "lucide-react";

// Preserve the shared export so existing loading states use the route animation.
export function LoadingSpinner({ label = "Loading Smart Safar…", className = "" }) {
  return (
    <span className={`safar-loader ${className}`} role="status" aria-live="polite">
      <span className="safar-loader-scene" aria-hidden="true">
        <svg viewBox="0 0 80 80" className="safar-loader-road">
          <circle cx="40" cy="40" r="26" fill="none" stroke="var(--border)" strokeWidth="10" />
          <circle cx="40" cy="40" r="26" fill="none" stroke="var(--primary)" strokeOpacity=".3" strokeWidth="1.5" strokeDasharray="3 5" />
          <circle cx="40" cy="40" r="4" fill="var(--primary)" opacity=".15" />
        </svg>
        <span className="safar-loader-orbit"><span className="safar-loader-bus"><BusFront size={17} strokeWidth={2} /></span></span>
      </span>
      <span className="safar-loader-label">{label}</span>
    </span>
  );
}
