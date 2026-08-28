"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { useParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";

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

export function MobileNav({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const params = useParams();
  const pathname = usePathname();
  const locale = (params.locale as string) || "fa";
  const navigationId = "hyperdoctor-mobile-navigation";
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("a,button")?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        requestAnimationFrame(() => triggerRef.current?.focus());
      }
      if (event.key === "Tab" && panelRef.current) {
        const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled])'));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
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
        aria-label={menuLabel(locale, open)}
        className="vitalis-focus inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[#c4c6d0]/60 bg-white text-[#001736] shadow-sm transition hover:border-[#9aa0aa] hover:bg-[#f1f4f7]"
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 top-[72px] z-[-1] cursor-default bg-[#001736]/18 backdrop-blur-[2px]"
            aria-label={menuLabel(locale, true)}
            onClick={() => setOpen(false)}
          />
          <div ref={panelRef} className="absolute inset-x-0 top-full max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-[#c4c6d0]/35 bg-white/98 shadow-[0_22px_55px_rgba(0,23,54,0.16)] backdrop-blur-xl">
            <nav id={navigationId} className="vitalis-container grid gap-1.5 py-4" aria-label={navigationLabel(locale)}>
              {items.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`vitalis-focus flex min-h-12 items-center rounded-xl border px-4 text-sm font-bold transition ${active ? "border-[#d6e3ff] bg-[#edf4ff] text-[#001736]" : "border-transparent text-[#43474f] hover:bg-[#f1f4f7] hover:text-[#001736]"}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="mt-2 border-t border-[#e0e3e6] pt-4 md:hidden">
                <LocaleSwitcher className="w-fit" />
              </div>
            </nav>
          </div>
        </>
      ) : null}
    </div>
  );
}
