"use client";

import { useTranslations } from "next-intl";
import { CalendarDays } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function BookServiceButton({ slug }: { slug: string }) {
  const t = useTranslations("services");

  return (
    <Link
      href={`/booking?service=${encodeURIComponent(slug)}`}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#ba0036] px-6 text-sm font-black text-white shadow-[0_12px_28px_rgba(186,0,54,.20)] transition hover:bg-[#e80346] vitalis-focus"
    >
      <CalendarDays className="h-4 w-4" aria-hidden="true" />
      {t("bookNow")}
    </Link>
  );
}
