import { cn } from "@/lib/utils";

/**
 * ALLIOME brand mark — an engineered "A" formed by three alliance nodes
 * connected by a sage→brass gradient on a deep forest tile. Designed to
 * feel both structured (engineered) and connected (alliance + ecosystem).
 */
export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="aliG" x1="18" y1="48" x2="46" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9CC5AC" />
          <stop offset="1" stopColor="#C9A85C" />
        </linearGradient>
        <radialGradient id="aliCore" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 20) rotate(45) scale(12)">
          <stop stopColor="#E3CE9A" />
          <stop offset="1" stopColor="#A87F2E" />
        </radialGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="#1E4636" />
      <rect x="0.5" y="0.5" width="63" height="63" rx="13.5" stroke="rgba(244,240,229,0.18)" />
      {/* Engineered A-frame: alliance lines from apex to two base nodes */}
      <path d="M32 20 L18 48 M32 20 L46 48 M22 38 L42 38" stroke="url(#aliG)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      {/* Subtle flow dash on the crossbar (engineered motion) */}
      <path d="M22 38 L42 38" stroke="url(#aliG)" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2 5" opacity="0.55" />
      {/* Apex node (brass) */}
      <circle cx="32" cy="20" r="5" fill="url(#aliCore)" />
      <circle cx="32" cy="20" r="5" stroke="rgba(244,240,229,0.4)" strokeWidth="1" />
      {/* Base nodes (sage + mint — the alliance) */}
      <circle cx="18" cy="48" r="3.6" fill="#9CC5AC" />
      <circle cx="18" cy="48" r="3.6" stroke="rgba(21,43,32,0.5)" strokeWidth="1" />
      <circle cx="46" cy="48" r="3.6" fill="#2F855A" />
      <circle cx="46" cy="48" r="3.6" stroke="rgba(21,43,32,0.5)" strokeWidth="1" />
      {/* Crossbar intersections */}
      <circle cx="22" cy="38" r="1.6" fill="#C9A85C" opacity="0.75" />
      <circle cx="42" cy="38" r="1.6" fill="#C9A85C" opacity="0.75" />
    </svg>
  );
}

export function Logo({
  className,
  size = 30,
  compact = false,
}: {
  className?: string;
  size?: number;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <LogoMark size={size} />
      {!compact && (
        <span className="text-[17px] font-semibold tracking-tight text-foreground">
          ALLI<span className="text-gradient">OME</span>
        </span>
      )}
    </span>
  );
}
