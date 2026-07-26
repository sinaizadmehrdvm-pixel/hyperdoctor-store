"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export function SortSelect() {
  const t = useTranslations("shop");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "newest";

  return (
    <select
      value={current}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", e.target.value);
        router.push(`${pathname}?${params.toString()}`);
      }}
      className="h-11 min-w-40 rounded-lg border border-border bg-card px-3 text-sm text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={t("sortLabel")}
    >
      <option value="newest">{t("sortNewest")}</option>
      <option value="price-asc">{t("sortPriceAsc")}</option>
      <option value="price-desc">{t("sortPriceDesc")}</option>
    </select>
  );
}
