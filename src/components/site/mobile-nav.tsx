"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function MobileNav({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="xl:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Menu"
        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#c4c6d0]/55 bg-white text-[#001736] transition hover:bg-[#f1f4f7]"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open ? (
        <div className="absolute inset-x-0 top-full border-t border-[#c4c6d0]/35 bg-white/95 shadow-[0_18px_42px_rgba(0,23,54,0.12)] backdrop-blur-xl">
          <nav className="vitalis-container grid gap-1 py-4">
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
