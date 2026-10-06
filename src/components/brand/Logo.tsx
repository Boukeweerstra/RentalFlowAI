/** Woordmerk van RentalFlowAI: een eenvoudig huisje in een afgeronde tegel, met "AI" in de accentkleur. */
export default function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 text-lg font-semibold tracking-tight ${className}`}>
      <svg aria-hidden="true" width="28" height="28" viewBox="0 0 28 28" className="shrink-0">
        <rect width="28" height="28" rx="7" fill={light ? "#ffffff" : "#163b5c"} />
        <path d="M7 14.2 14 8l7 6.2V21a1 1 0 0 1-1 1h-3.5v-4.5h-5V22H8a1 1 0 0 1-1-1v-6.8Z" fill={light ? "#163b5c" : "#ffffff"} />
        <circle cx="21.5" cy="7.5" r="2.5" fill="#2dd4bf" />
      </svg>
      <span>
        RentalFlow<span className={light ? "text-teal-300" : "text-accent-600"}>AI</span>
      </span>
    </span>
  );
}
