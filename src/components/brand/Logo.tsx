// The stage ring: four arcs for Measure, Plan, Change and Sustain, with the
// first stage in the brand colour. Uses currentColor so it works on light and dark.
export function Logo({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"
        strokeDasharray="12.3 5" transform="rotate(-84 16 16)" />
      <circle cx="16" cy="16" r="11" fill="none" stroke="#1b6984" strokeWidth="3.2" strokeLinecap="round"
        strokeDasharray="12.3 56.9" transform="rotate(-84 16 16)" />
    </svg>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return <span className={`flex items-center gap-2.5 text-lg font-semibold tracking-tight ${className}`}><Logo />CuraCulture</span>;
}
