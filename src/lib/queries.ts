import { inFilter, supabaseSelect } from "@/lib/supabase-rest";

async function hydrateProducts(products: any[]) {
  if (!products.length) return [];

  const productIds = products.map((product) => product.id);
  const categoryIds = [...new Set(products.map((product) => product.categoryId).filter(Boolean))];
  const brandIds = [...new Set(products.map((product) => product.brandId).filter(Boolean))];

  const [images, categories, brands] = await Promise.all([
    supabaseSelect<any>("Media", {
      select: "*",
      productId: inFilter(productIds),
      order: "sortOrder.asc",
    }),
    categoryIds.length
      ? supabaseSelect<any>("Category", { select: "*", id: inFilter(categoryIds) })
      : Promise.resolve([]),
    brandIds.length
      ? supabaseSelect<any>("Brand", { select: "*", id: inFilter(brandIds) })
      : Promise.resolve([]),
  ]);

  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const brandsById = new Map(brands.map((brand) => [brand.id, brand]));
  const imagesByProductId = new Map<string, any[]>();

  for (const image of images) {
    const list = imagesByProductId.get(image.productId) ?? [];
    list.push(image);
    imagesByProductId.set(image.productId, list);
  }

  return products.map((product) => ({
    ...product,
    images: imagesByProductId.get(product.id) ?? [],
    category: categoriesById.get(product.categoryId) ?? null,
    brandEntity: product.brandId ? brandsById.get(product.brandId) ?? null : null,
  }));
}

export async function getCategories() {
  try {
    const [categories, products] = await Promise.all([
      supabaseSelect<any>("Category", {
        select: "*",
        isPublished: "eq.true",
        order: "order.asc,createdAt.asc",
      }),
      supabaseSelect<any>("Product", {
        select: "id,categoryId",
        isPublished: "eq.true",
      }),
    ]);

    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
    }

    return categories.map((category) => ({
      ...category,
      _count: { products: counts.get(category.id) ?? 0 },
    }));
  } catch (error) {
    console.error("[queries] categories Data API read failed", error);
    return [];
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    const rows = await supabaseSelect<any>("Category", {
      select: "*",
      slug: `eq.${slug}`,
      isPublished: "eq.true",
      limit: "1",
    });
    return rows[0] ?? null;
  } catch (error) {
    console.error("[queries] category Data API read failed", error);
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
  const q = search?.trim().toLocaleLowerCase();

  try {
    let categoryId: string | undefined;
    if (categorySlug) {
      const category = await getCategoryBySlug(categorySlug);
      if (!category) return [];
      categoryId = category.id;
    }

    const params: Record<string, string> = {
      select: "*",
      isPublished: "eq.true",
    };
    if (categoryId) params.categoryId = `eq.${categoryId}`;

    let products = await supabaseSelect<any>("Product", params);

    if (q) {
      products = products.filter((product) =>
        [
          product.nameFa,
          product.nameTr,
          product.nameEn,
          product.nameAr,
          product.brand,
          product.modelNumber,
          product.sku,
        ].some((value) => String(value ?? "").toLocaleLowerCase().includes(q)),
      );
    }

    products.sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return await hydrateProducts(products);
  } catch (error) {
    console.error("[queries] products Data API read failed", error);
    return [];
  }
}

export async function getFeaturedProducts(take = 8) {
  try {
    const products = await supabaseSelect<any>("Product", {
      select: "*",
      isPublished: "eq.true",
      isFeatured: "eq.true",
    });

    products.sort((a, b) => {
      if (a.isNewArrival !== b.isNewArrival) return a.isNewArrival ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return await hydrateProducts(products.slice(0, take));
  } catch (error) {
    console.error("[queries] featured products Data API read failed", error);
    return [];
  }
}

export async function getProductBySlug(slug: string) {
  try {
    const rows = await supabaseSelect<any>("Product", {
      select: "*",
      slug: `eq.${slug}`,
      isPublished: "eq.true",
      limit: "1",
    });
    const product = rows[0];
    if (!product) return null;

    const [hydrated] = await hydrateProducts([product]);
    const [variants, reviews] = await Promise.all([
      supabaseSelect<any>("ProductVariant", {
        select: "*",
        productId: `eq.${product.id}`,
        isPublished: "eq.true",
        order: "createdAt.asc",
      }),
      supabaseSelect<any>("Review", {
        select: "*",
        productId: `eq.${product.id}`,
        status: "eq.APPROVED",
        order: "createdAt.desc",
        limit: "12",
      }),
    ]);

    return { ...hydrated, variants, reviews };
  } catch (error) {
    console.error("[queries] product Data API read failed", error);
    return null;
  }
}

export async function getRelatedProducts(categoryId: string, excludeId: string, take = 4) {
  try {
    let products = await supabaseSelect<any>("Product", {
      select: "*",
      categoryId: `eq.${categoryId}`,
      isPublished: "eq.true",
    });
    products = products.filter((product) => product.id !== excludeId);
    products.sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return await hydrateProducts(products.slice(0, take));
  } catch (error) {
    console.error("[queries] related products Data API read failed", error);
    return [];
  }
}

export async function getServices() {
  try {
    return await supabaseSelect<any>("Service", {
      select: "*",
      isPublished: "eq.true",
      order: "createdAt.asc",
    });
  } catch (error) {
    console.error("[queries] services Data API read failed", error);
    return [];
  }
}

export async function getServiceBySlug(slug: string) {
  try {
    const rows = await supabaseSelect<any>("Service", {
      select: "*",
      slug: `eq.${slug}`,
      isPublished: "eq.true",
      limit: "1",
    });
    return rows[0] ?? null;
  } catch (error) {
    console.error("[queries] service Data API read failed", error);
    return null;
  }
}

export async function getPageBySlug(slug: string) {
  try {
    const rows = await supabaseSelect<any>("Page", {
      select: "*",
      slug: `eq.${slug}`,
      isPublished: "eq.true",
      limit: "1",
    });
    return rows[0] ?? null;
  } catch (error) {
    console.error("[queries] page Data API read failed", error);
    return null;
  }
}

function articleIsPublic(article: any, now = Date.now()) {
  if (!article?.isPublished) return false;
  if (!article.publishedAt) return true;
  const publishedAt = new Date(article.publishedAt).getTime();
  return Number.isFinite(publishedAt) && publishedAt <= now;
}

export async function getPublishedArticles(take = 12) {
  try {
    const articles = await supabaseSelect<any>("Article", {
      select: "*",
      isPublished: "eq.true",
      order: "publishedAt.desc,createdAt.desc",
    });
    return articles.filter((article) => articleIsPublic(article)).slice(0, take);
  } catch (error) {
    console.error("[queries] articles Data API read failed", error);
    return [];
  }
}

export async function getArticleBySlug(slug: string) {
  try {
    const rows = await supabaseSelect<any>("Article", {
      select: "*",
      slug: `eq.${slug}`,
      isPublished: "eq.true",
      limit: "1",
    });
    const article = rows[0] ?? null;
    return articleIsPublic(article) ? article : null;
  } catch (error) {
    console.error("[queries] article Data API read failed", error);
    return null;
  }
}
