"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

const SORT_VALUES = ["newest", "price-asc", "price-desc"] as const;
type SortValue = (typeof SORT_VALUES)[number];

function isSortValue(value: string | null): value is SortValue {
  return value !== null && SORT_VALUES.includes(value as SortValue);
}

export function SortSelect() {
  const t = useTranslations("shop");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requested = searchParams.get("sort");
  const current: SortValue = isSortValue(requested) ? requested : "newest";

  return (
    <select
      value={current}
      onChange={(event) => {
        const next = event.target.value;
        if (!isSortValue(next)) return;
        const params = new URLSearchParams(searchParams.toString());
        if (next === "newest") params.delete("sort");
        else params.set("sort", next);
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
      }}
      className="vitalis-focus h-11 min-w-40 cursor-pointer rounded-xl border border-[#c4c6d0] bg-white px-3 text-sm font-bold text-[#001736] shadow-sm transition hover:border-[#9aa0aa]"
      aria-label={t("sortLabel")}
    >
      <option value="newest">{t("sortNewest")}</option>
      <option value="price-asc">{t("sortPriceAsc")}</option>
      <option value="price-desc">{t("sortPriceDesc")}</option>
    </select>
  );
}
