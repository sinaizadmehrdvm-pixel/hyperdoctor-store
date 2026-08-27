import { prisma } from "@/lib/prisma";

export async function getCategories() {
  try {
    return await prisma.category.findMany({
      where: { isPublished: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: {
        _count: { select: { products: { where: { isPublished: true } } } },
      },
    });
  } catch (error) {
    console.error("[queries] categories database read failed", error);
    return [];
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    return await prisma.category.findFirst({ where: { slug, isPublished: true } });
  } catch (error) {
    console.error("[queries] category database read failed", error);
    return null;
  }
}

export type ProductSort = "newest" | "price-asc" | "price-desc";

export async function getProducts(opts: {
  categorySlug?: string;
  sort?: ProductSort;
  search?: string;
} = {}) {
  const { categorySlug, sort = "newest", search } = opts;
  const q = search?.trim();

  try {
    return await prisma.product.findMany({
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
  } catch (error) {
    console.error("[queries] products database read failed", error);
    return [];
  }
}

export async function getFeaturedProducts(take = 8) {
  try {
    return await prisma.product.findMany({
      where: { isPublished: true, isFeatured: true },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        brandEntity: true,
      },
      orderBy: [{ isNewArrival: "desc" }, { createdAt: "desc" }],
      take,
    });
  } catch (error) {
    console.error("[queries] featured products database read failed", error);
    return [];
  }
}

export async function getProductBySlug(slug: string) {
  try {
    return await prisma.product.findFirst({
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
  } catch (error) {
    console.error("[queries] product database read failed", error);
    return null;
  }
}

export async function getRelatedProducts(categoryId: string, excludeId: string, take = 4) {
  try {
    return await prisma.product.findMany({
      where: { categoryId, isPublished: true, NOT: { id: excludeId } },
      include: { images: { orderBy: { sortOrder: "asc" } }, brandEntity: true },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take,
    });
  } catch (error) {
    console.error("[queries] related products database read failed", error);
    return [];
  }
}

export async function getServices() {
  try {
    return await prisma.service.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    console.error("[queries] services database read failed", error);
    return [];
  }
}

export async function getServiceBySlug(slug: string) {
  try {
    return await prisma.service.findFirst({ where: { slug, isPublished: true } });
  } catch (error) {
    console.error("[queries] service database read failed", error);
    return null;
  }
}

export async function getPageBySlug(slug: string) {
  try {
    return await prisma.page.findFirst({ where: { slug, isPublished: true } });
  } catch (error) {
    console.error("[queries] page database read failed", error);
    return null;
  }
}

export async function getPublishedArticles(take = 12) {
  try {
    return await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take,
    });
  } catch (error) {
    console.error("[queries] articles database read failed", error);
    return [];
  }
}

export async function getArticleBySlug(slug: string) {
  try {
    return await prisma.article.findFirst({ where: { slug, isPublished: true } });
  } catch (error) {
    console.error("[queries] article database read failed", error);
    return null;
  }
}
