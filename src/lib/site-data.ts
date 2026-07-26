import { prisma } from "@/lib/prisma";

export async function getSiteSettings() {
  const settings = await prisma.siteSetting.findUnique({ where: { id: 1 } });
  if (settings) return settings;
  return prisma.siteSetting.create({ data: { id: 1 } });
}

export async function getNavPages() {
  return prisma.page.findMany({
    where: { showInNav: true, isPublished: true },
    orderBy: { navOrder: "asc" },
    select: { slug: true, titleFa: true, titleEn: true },
  });
}
