"use client";

import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";

const locales = [
  { code: "fa", label: "فا", title: "فارسی" },
  { code: "tr", label: "TR", title: "Türkçe" },
  { code: "en", label: "EN", title: "English" },
  { code: "ar", label: "عر", title: "العربية" },
] as const;

function selectorLabel(locale: string) {
  if (locale === "fa") return "انتخاب زبان";
  if (locale === "tr") return "Dil seçici";
  if (locale === "ar") return "اختيار اللغة";
  return "Language selector";
}

export function LocaleSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();
  const params = useParams();
  const current = params.locale as string;

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full border border-white/15 bg-white/5 p-1 backdrop-blur",
        className,
      )}
      aria-label={selectorLabel(current)}
    >
      {locales.map((l) => (
        <Link
          key={l.code}
          href={pathname}
          locale={l.code}
          title={l.title}
          className={cn(
            "min-h-8 min-w-9 px-2 rounded-full text-xs font-semibold flex items-center justify-center transition-colors",
            current === l.code
              ? "bg-white text-navy shadow-sm"
              : "text-navy-muted hover:text-white hover:bg-white/10",
          )}
          aria-current={current === l.code ? "true" : undefined}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
