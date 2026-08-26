import { prisma } from "@/lib/prisma";

export function getSiteSettings() {
  // `findUnique() → create()` races during parallel prerender workers. Use one
  // atomic upsert so every route can safely request settings concurrently.
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
    select: { slug: true, titleFa: true, titleEn: true },
  });
}
