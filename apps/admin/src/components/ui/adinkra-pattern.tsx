export function AdinkraWatermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Precision Mathematical African Vector Mesh with Subtle Opacity */}
      <svg
        className="h-full w-full opacity-[0.035] dark:opacity-[0.055] transition-opacity duration-500 text-[var(--accent-gold)]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="adinkra-mesh"
            width="180"
            height="180"
            patternUnits="userSpaceOnUse"
          >
            {/* Adinkrahene (Leadership, Greatness & Balance) */}
            <g transform="translate(45, 45)">
              <circle cx="0" cy="0" r="26" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="18" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="0" cy="0" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="0" cy="0" r="4" fill="currentColor" />
            </g>

            {/* Dwennimmen (Ram's Horns — Strength, Humility & Integrity) */}
            <g transform="translate(135, 45)">
              <path
                d="M -16 0 C -16 -14, -4 -18, 0 -8 C 4 -18, 16 -14, 16 0 C 16 14, 4 18, 0 8 C -4 18, -16 14, -16 0 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <circle cx="-7" cy="-5" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="7" cy="-5" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="-7" cy="5" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="7" cy="5" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
            </g>

            {/* Gye Nyame (Supremacy and Omnipresence) */}
            <g transform="translate(45, 135)">
              <path
                d="M 0 -22 C 12 -22, 18 -10, 10 0 C 18 10, 12 22, 0 22 C -12 22, -18 10, -10 0 C -18 -10, -12 -22, 0 -22 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path d="M -8 -12 L -2 0 L -8 12 M 8 -12 L 2 0 L 8 12" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <circle cx="0" cy="0" r="3" fill="currentColor" />
            </g>

            {/* Kente Diamond Lattice Geometry */}
            <g transform="translate(135, 135)">
              <rect
                x="-16"
                y="-16"
                width="32"
                height="32"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                transform="rotate(45)"
              />
              <rect
                x="-10"
                y="-10"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                transform="rotate(45)"
              />
              <path d="M -16 0 L 16 0 M 0 -16 L 0 16" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
            </g>

            {/* Connecting Trust Vectors */}
            <path
              d="M 0 45 L 180 45 M 0 135 L 180 135 M 45 0 L 45 180 M 135 0 L 135 180"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray="4 6"
              opacity="0.3"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#adinkra-mesh)" />
      </svg>
    </div>
  );
}
