"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";

function menuLabel(locale: string, open: boolean) {
  if (locale === "fa") return open ? "بستن منو" : "باز کردن منو";
  if (locale === "tr") return open ? "Menüyü kapat" : "Menüyü aç";
  if (locale === "ar") return open ? "إغلاق القائمة" : "فتح القائمة";
  return open ? "Close menu" : "Open menu";
}

function navigationLabel(locale: string) {
  if (locale === "fa") return "منوی موبایل";
  if (locale === "tr") return "Mobil menü";
  if (locale === "ar") return "قائمة الجوال";
  return "Mobile navigation";
}

export function MobileNav({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const params = useParams();
  const locale = (params.locale as string) || "fa";
  const navigationId = "hyperdoctor-mobile-navigation";
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        requestAnimationFrame(() => triggerRef.current?.focus());
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="xl:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={navigationId}
        aria-haspopup="menu"
        aria-label={menuLabel(locale, open)}
        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#c4c6d0]/55 bg-white text-[#001736] transition hover:bg-[#f1f4f7]"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open ? (
        <div className="absolute inset-x-0 top-full border-t border-[#c4c6d0]/35 bg-white/95 shadow-[0_18px_42px_rgba(0,23,54,0.12)] backdrop-blur-xl">
          <nav id={navigationId} className="vitalis-container grid gap-1 py-4" aria-label={navigationLabel(locale)}>
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center rounded-xl px-4 text-sm font-bold text-[#001736] transition hover:bg-[#f1f4f7]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
