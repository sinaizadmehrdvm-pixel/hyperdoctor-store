"use client";

import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";

const locales = [
  { code: "fa", label: "فا" },
  { code: "en", label: "EN" },
] as const;

export function LocaleSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();
  const params = useParams();
  const current = params.locale as string;

  return (
    <div className={cn("flex items-center gap-1 rounded-full border border-white/15 p-1", className)}>
      {locales.map((l) => (
        <Link
          key={l.code}
          href={pathname}
          locale={l.code}
          className={cn(
            "min-h-8 min-w-9 px-2 rounded-full text-xs font-semibold flex items-center justify-center transition-colors",
            current === l.code
              ? "bg-white/15 text-white"
              : "text-navy-muted hover:text-white"
          )}
          aria-current={current === l.code ? "true" : undefined}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
