export function BrandCrest({ className = "size-8" }: { className?: string }) {
  return (
    <span
      className={`inline-grid place-items-center rounded-xl bg-gradient-to-br from-[var(--accent-gold)] to-[#8C6004] text-white shadow-sm border border-[var(--accent-gold-border)] select-none shrink-0 ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5 fill-none stroke-current"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Shield contour */}
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        {/* Inner Adinkra knot geometric core */}
        <path d="M12 8v8M8 12h8" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="2.5" className="fill-current stroke-none" />
      </svg>
    </span>
  );
}
