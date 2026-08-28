"use client";

import { useRouter } from "next/navigation";

export type AdminLocale = "fa" | "ar" | "en" | "tr";

const locales: Array<{ code: AdminLocale; label: string }> = [
  { code: "fa", label: "FA" },
  { code: "ar", label: "AR" },
  { code: "en", label: "EN" },
  { code: "tr", label: "TR" },
];

export function AdminLocaleSwitcher({ locale }: { locale: AdminLocale }) {
  const router = useRouter();
  return (
    <label className="inline-flex items-center">
      <span className="sr-only">Admin language</span>
      <select
        value={locale}
        aria-label="Admin language"
        onChange={(event) => {
          const next = event.target.value as AdminLocale;
          const dir = next === "fa" || next === "ar" ? "rtl" : "ltr";
          document.cookie = `hd_admin_locale=${next}; Path=/admin; Max-Age=31536000; SameSite=Lax`;
          document.documentElement.lang = next;
          document.documentElement.dir = dir;
          router.refresh();
        }}
        className="h-10 rounded-xl border border-[#e0e3e6] bg-white px-2.5 text-xs font-black text-[#5f6570] outline-none focus:border-[#009dd8]"
      >
        {locales.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
      </select>
    </label>
  );
}
