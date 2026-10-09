// Keep the existing interface: callers continue to control when loading ends.
export function LoadingSpinner({ label = "Loading", className = "" }) {
  return (
    <span className={`safar-loader ${className}`} role="status" aria-live="polite">
      {label}
    </span>
  );
}
