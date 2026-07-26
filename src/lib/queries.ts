import { prisma } from "@/lib/prisma";

export function getCategories() {
  return prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

export type ProductSort = "newest" | "price-asc" | "price-desc";

export function getProducts(opts: {
  categorySlug?: string;
  sort?: ProductSort;
  search?: string;
} = {}) {
  const { categorySlug, sort = "newest", search } = opts;
  return prisma.product.findMany({
    where: {
      isPublished: true,
      category: categorySlug ? { slug: categorySlug } : undefined,
      ...(search
        ? {
            OR: [
              { nameFa: { contains: search } },
              { nameEn: { contains: search } },
            ],
          }
        : {}),
    },
    include: { images: true, category: true },
    orderBy:
      sort === "price-asc"
        ? { price: "asc" }
        : sort === "price-desc"
          ? { price: "desc" }
          : { createdAt: "desc" },
  });
}

export function getFeaturedProducts(take = 4) {
  return prisma.product.findMany({
    where: { isPublished: true, isFeatured: true },
    include: { images: true },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isPublished: true },
    include: { images: true, category: true },
  });
}

export function getRelatedProducts(categoryId: string, excludeId: string, take = 4) {
  return prisma.product.findMany({
    where: { categoryId, isPublished: true, NOT: { id: excludeId } },
    include: { images: true },
    take,
  });
}

export function getServices() {
  return prisma.service.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "asc" },
  });
}

export function getServiceBySlug(slug: string) {
  return prisma.service.findFirst({ where: { slug, isPublished: true } });
}

export function getPageBySlug(slug: string) {
  return prisma.page.findFirst({ where: { slug, isPublished: true } });
}
