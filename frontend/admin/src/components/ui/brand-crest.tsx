export function BrandCrest({ className = "size-10" }: { className?: string }) {
  return (
    <span
      className={`relative inline-grid place-items-center rounded-2xl bg-gradient-to-br from-[#d4a017] via-[#b8860b] to-[#785202] text-white shadow-md border border-[var(--accent-gold-border)] select-none shrink-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Specular glass reflection overlay */}
      <span className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/30 pointer-events-none" />

      <svg
        viewBox="0 0 32 32"
        className="size-6 fill-none stroke-white drop-shadow-sm"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Modern Shield Contour */}
        <path d="M16 28s10-5 10-13V6l-10-3-10 3v9c0 8 10 13 10 13z" className="stroke-white" />

        {/* Authentic West African Adinkra Gye Nyame Core Geometry */}
        <path
          d="M16 9v14M11 16h10"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="16" cy="16" r="3.5" className="fill-white/20 stroke-white" strokeWidth="1.8" />
        <circle cx="16" cy="16" r="1.5" className="fill-white stroke-none" />
      </svg>
    </span>
  );
}
