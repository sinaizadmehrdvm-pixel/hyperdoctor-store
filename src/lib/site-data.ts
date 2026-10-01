import { prisma } from "@/lib/prisma";

const defaultSiteSettings = {
  id: 1,
  holdingName: "VITALIS Group",
  holdingLogoUrl: "",
  subBrandName: "Hyper Doctor",
  subBrandLogoUrl: "",
  contactPhone: "04432257238",
  contactPhone2: "04432254578",
  respiratoryPhone: "09149483873",
  contactEmail: "hyperdoctor@gmail.com",
  address: "ارومیه خیام شمالی کوچه صناعی آذرسرا5 همکف",
  instagramUrl: "",
  telegramUrl: "",
  whatsappUrl: "https://wa.me/989149498352",
  defaultLocale: "fa",
  updatedAt: new Date(0),
};

export async function getSiteSettings() {
  // Rendering must stay read-only. Parallel prerender workers can race if they
  // all try to create the singleton row at build time, so use an in-memory
  // production-safe fallback until the settings row is provisioned explicitly.
  return (await prisma.siteSetting.findUnique({ where: { id: 1 } })) ?? defaultSiteSettings;
}

export async function getNavPages() {
  return prisma.page.findMany({
    where: { showInNav: true, isPublished: true },
    orderBy: { navOrder: "asc" },
    select: { slug: true, titleFa: true, titleEn: true },
  });
}
