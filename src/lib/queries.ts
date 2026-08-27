import { prisma } from "@/lib/prisma";

export function getCategories() {
  return prisma.category.findMany({
    where: { isPublished: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { products: { where: { isPublished: true } } } },
    },
  });
}

export function getCategoryBySlug(slug: string) {
  return prisma.category.findFirst({ where: { slug, isPublished: true } });
}

export type ProductSort = "newest" | "price-asc" | "price-desc";

export function getProducts(opts: {
  categorySlug?: string;
  sort?: ProductSort;
  search?: string;
} = {}) {
  const { categorySlug, sort = "newest", search } = opts;
  const q = search?.trim();

  return prisma.product.findMany({
    where: {
      isPublished: true,
      category: categorySlug ? { slug: categorySlug, isPublished: true } : undefined,
      ...(q
        ? {
            OR: [
              { nameFa: { contains: q } },
              { nameTr: { contains: q } },
              { nameEn: { contains: q } },
              { nameAr: { contains: q } },
              { brand: { contains: q } },
              { modelNumber: { contains: q } },
              { sku: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
      brandEntity: true,
    },
    orderBy:
      sort === "price-asc"
        ? { price: "asc" }
        : sort === "price-desc"
          ? { price: "desc" }
          : { createdAt: "desc" },
  });
}

export function getFeaturedProducts(take = 8) {
  return prisma.product.findMany({
    where: { isPublished: true, isFeatured: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      brandEntity: true,
    },
    orderBy: [{ isNewArrival: "desc" }, { createdAt: "desc" }],
    take,
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isPublished: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
      brandEntity: true,
      variants: { where: { isPublished: true }, orderBy: { createdAt: "asc" } },
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 12,
      },
    },
  });
}

export function getRelatedProducts(categoryId: string, excludeId: string, take = 4) {
  return prisma.product.findMany({
    where: { categoryId, isPublished: true, NOT: { id: excludeId } },
    include: { images: { orderBy: { sortOrder: "asc" } }, brandEntity: true },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
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

export function getPublishedArticles(take = 12) {
  return prisma.article.findMany({
    where: { isPublished: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take,
  });
}

export function getArticleBySlug(slug: string) {
  return prisma.article.findFirst({ where: { slug, isPublished: true } });
}
