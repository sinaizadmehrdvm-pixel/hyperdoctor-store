import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, locale: string) {
  const formatted = new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(
    amount
  );
  return formatted;
}
