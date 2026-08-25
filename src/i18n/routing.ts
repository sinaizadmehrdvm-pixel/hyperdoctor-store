import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fa", "tr", "en", "ar"],
  defaultLocale: "fa",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
