// Keep the existing interface: callers continue to control when loading ends.
export function LoadingSpinner({ label = "Loading Smart Safar…", className = "" }) {
  return (
    <span className={`safar-loader ${className}`} role="status" aria-live="polite">
      <span className="safar-loader-scene" aria-hidden="true">
        <svg viewBox="0 0 88 88" className="safar-loader-road" focusable="false">
          <circle cx="44" cy="44" r="28" fill="none" stroke="var(--border)" strokeWidth="16" strokeOpacity=".65" />
          <circle cx="44" cy="44" r="36" fill="none" stroke="var(--primary)" strokeWidth=".75" strokeOpacity=".12" />
          <circle cx="44" cy="44" r="20" fill="none" stroke="var(--primary)" strokeWidth=".75" strokeOpacity=".12" />
          <circle cx="44" cy="44" r="28" fill="none" stroke="var(--primary)" strokeWidth="1" strokeOpacity=".3" strokeDasharray="3 5" />
          <circle cx="44" cy="44" r="8" fill="none" stroke="var(--primary)" strokeOpacity=".1" />
          <circle cx="44" cy="44" r="2.5" fill="var(--primary)" opacity=".35" />
          {/* The bus and its heading share one transform, tangent to the road. */}
          <g className="safar-loader-orbit">
            {/* A compact plan view makes the front and direction of travel clear. */}
            <svg x="32" y="9" width="24" height="14" viewBox="0 0 28 16" className="safar-loader-bus" focusable="false">
              <g fill="var(--foreground)">
                <rect x="6" y="1" width="4" height="3" rx="1" />
                <rect x="19" y="1" width="4" height="3" rx="1" />
                <rect x="6" y="12" width="4" height="3" rx="1" />
                <rect x="19" y="12" width="4" height="3" rx="1" />
              </g>
              <rect x="1.5" y="2.5" width="25" height="11" rx="3.5" fill="var(--primary)" stroke="var(--primary-dark)" strokeWidth=".75" />
              <rect x="4.5" y="4" width="15" height="8" rx="2" fill="var(--card)" />
              <rect x="7" y="6" width="4" height="4" rx="1" fill="var(--border)" />
              <rect x="13" y="6" width="4" height="4" rx="1" fill="var(--border)" />
              <path d="M21 4h1.5a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H21Z" fill="var(--foreground)" />
              <path d="M22 5h.5a1 1 0 0 1 1 1v2H22Z" fill="var(--card)" opacity=".5" />
              <path d="M25.5 4.5v2m0 3v2" stroke="var(--card)" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M2.5 5v1m0 4v1" stroke="var(--border)" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </g>
        </svg>
      </span>
      <span className="safar-loader-label">{label}</span>
    </span>
  );
}
