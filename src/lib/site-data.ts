import { supabaseSelect } from "@/lib/supabase-rest";
import { DEFAULT_BUSINESS_TIME_ZONE } from "@/lib/calendar";

const FALLBACK_SITE_SETTINGS = {
  id: 1,
  holdingName: "VITALIS Group",
  holdingLogoUrl: "",
  subBrandName: "Hyper Doctor",
  subBrandLogoUrl: "",
  contactPhone: "",
  contactEmail: "",
  address: "",
  instagramUrl: "",
  telegramUrl: "",
  whatsappUrl: "",
  defaultLocale: "fa",
  supportedLocales: "fa,tr,en,ar",
  currency: "IRT",
  businessTimeZone: DEFAULT_BUSINESS_TIME_ZONE,
  updatedAt: new Date(0),
};

export async function getSiteSettings() {
  try {
    const rows = await supabaseSelect<any>("SiteSetting", {
      select: "*",
      id: "eq.1",
      limit: "1",
    });
    return rows[0] ?? FALLBACK_SITE_SETTINGS;
  } catch (error) {
    console.error("[site-data] site settings Data API read failed", error);
    return FALLBACK_SITE_SETTINGS;
  }
}

export async function getBusinessTimeZone() {
  const settings = await getSiteSettings();
  return typeof settings.businessTimeZone === "string" && settings.businessTimeZone
    ? settings.businessTimeZone
    : DEFAULT_BUSINESS_TIME_ZONE;
}

export async function getNavPages() {
  try {
    return await supabaseSelect<any>("Page", {
      select: "slug,titleFa,titleTr,titleEn,titleAr,navOrder",
      showInNav: "eq.true",
      isPublished: "eq.true",
      order: "navOrder.asc",
    });
  } catch (error) {
    console.error("[site-data] navigation Data API read failed", error);
    return [];
  }
}
