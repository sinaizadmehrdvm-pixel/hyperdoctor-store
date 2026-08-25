import { prisma } from "@/lib/prisma";

export async function getSiteSettings() {
  return prisma.siteSetting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
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
