import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Brand marks. Falls back to a placeholder SVG until the admin uploads a real
 * logo in /admin/settings (stored as SiteSetting.holdingLogoUrl / subBrandLogoUrl).
 * All logo usage across the app goes through this file.
 */

export function HyperDoctorMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("h-9 w-9", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hd-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="50%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#hd-metal)" />
      <path
        d="M10 10v20h4v-8h5v8h4V10h-4v8h-5v-8h-4Z"
        fill="#0f172a"
        opacity="0.85"
      />
      <path
        d="M25 18h3v-4h3v4h3v3h-3v4h-3v-4h-3v-3Z"
        fill="#dc2626"
      />
    </svg>
  );
}

export function VetrixMark({
  className,
  logoUrl,
  name = "Vetrix",
}: {
  className?: string;
  logoUrl?: string | null;
  name?: string;
}) {
  if (logoUrl) {
    return (
      <span className={cn("relative inline-block h-7 w-7 shrink-0", className)}>
        <Image src={logoUrl} alt={name} fill className="object-contain" />
      </span>
    );
  }
  return (
    <svg viewBox="0 0 40 40" className={cn("h-7 w-7", className)} aria-hidden="true">
      <defs>
        <linearGradient id="vx-glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="#0b1220" />
      <path d="M8 9l12 22 12-22h-5l-7 13-7-13H8Z" fill="url(#vx-glow)" />
    </svg>
  );
}

export function HyperDoctorLogo({
  className,
  tagline,
  name = "Hyper Doctor",
  logoUrl,
}: {
  className?: string;
  tagline?: string;
  name?: string;
  logoUrl?: string | null;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {logoUrl ? (
        <span className="relative h-9 w-9 shrink-0">
          <Image src={logoUrl} alt={name} fill className="object-contain" />
        </span>
      ) : (
        <HyperDoctorMark />
      )}
      <span className="flex flex-col leading-none">
        <span className="text-base font-bold tracking-tight">{name}</span>
        {tagline ? (
          <span className="text-[11px] font-medium tracking-wide opacity-70">
            {tagline}
          </span>
        ) : null}
      </span>
    </span>
  );
}
