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

  function preserveQuery() {
    if (typeof window === "undefined") return pathname;
    return `${pathname}${window.location.search}`;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full border border-[#c4c6d0]/60 bg-white/80 p-1 shadow-sm backdrop-blur",
        className,
      )}
      aria-label={selectorLabel(current)}
      role="group"
    >
      {locales.map((l) => (
        <Link
          key={l.code}
          href={pathname}
          locale={l.code}
          title={l.title}
          onClick={(event) => {
            const href = preserveQuery();
            if (href === pathname) return;
            event.preventDefault();
            const localePrefix = `/${current}`;
            const localizedPath = href.startsWith(localePrefix)
              ? `/${l.code}${href.slice(localePrefix.length)}`
              : `/${l.code}${href.startsWith("/") ? href : `/${href}`}`;
            window.location.assign(localizedPath);
          }}
          className={cn(
            "vitalis-focus flex min-h-9 min-w-10 items-center justify-center rounded-full px-2 text-xs font-bold transition-colors",
            current === l.code
              ? "bg-[#001736] text-white shadow-sm"
              : "text-[#43474f] hover:bg-[#f1f4f7] hover:text-[#001736]",
          )}
          aria-current={current === l.code ? "page" : undefined}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
