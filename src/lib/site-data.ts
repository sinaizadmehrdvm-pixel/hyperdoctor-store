import { prisma } from "@/lib/prisma";

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
  updatedAt: new Date(0),
};

export async function getSiteSettings() {
  const settings = await prisma.siteSetting.findUnique({ where: { id: 1 } });
  return settings ?? FALLBACK_SITE_SETTINGS;
}

export async function getNavPages() {
  return prisma.page.findMany({
    where: { showInNav: true, isPublished: true },
    orderBy: { navOrder: "asc" },
    select: {
      slug: true,
      titleFa: true,
      titleTr: true,
      titleEn: true,
      titleAr: true,
    },
  });
}
