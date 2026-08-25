import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, locale: string) {
  const intlLocale =
    locale === "fa" ? "fa-IR" : locale === "tr" ? "tr-TR" : locale === "ar" ? "ar" : "en-US";
  return new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(value: Date | string, locale: string) {
  const intlLocale =
    locale === "fa" ? "fa-IR" : locale === "tr" ? "tr-TR" : locale === "ar" ? "ar" : "en-US";
  return new Intl.DateTimeFormat(intlLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
