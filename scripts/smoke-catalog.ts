import { prisma } from "@/lib/prisma";

async function main() {
  const suffix = Date.now().toString(36);
  const categorySlug = `ci-category-${suffix}`;
  const productSku = `CI-${suffix}`;
  const productSlug = `ci-product-${suffix}`;

  const category = await prisma.category.create({
    data: {
      vertical: "MEDICAL_EQUIPMENT",
      slug: categorySlug,
      nameFa: "دسته تست CI",
      nameTr: "CI test kategorisi",
      nameEn: "CI test category",
      nameAr: "فئة اختبار CI",
      isPublished: true,
    },
  });

  const product = await prisma.product.create({
    data: {
      vertical: "MEDICAL_EQUIPMENT",
      categoryId: category.id,
      slug: productSlug,
      sku: productSku,
      nameFa: "محصول تست CI",
      nameTr: "CI test ürünü",
      nameEn: "CI test product",
      nameAr: "منتج اختبار CI",
      price: 125000,
      stock: 7,
      isPublished: true,
      images: {
        create: [
          {
            url: "https://example.com/ci-product-1.webp",
            sortOrder: 0,
            altFa: "تصویر محصول تست",
            altTr: "CI test ürün görseli",
            altEn: "CI test product image",
            altAr: "صورة منتج الاختبار",
          },
          {
            url: "https://example.com/ci-product-2.webp",
            sortOrder: 1,
            altEn: "CI test product alternate image",
          },
        ],
      },
    },
    include: { images: true },
  });

  if (product.images.length !== 2) {
    throw new Error(`Expected 2 product images, got ${product.images.length}`);
  }

  const updated = await prisma.product.update({
    where: { sku: productSku },
    data: { price: 135000, stock: 11, nameTr: "Güncellenmiş CI ürünü" },
  });

  if (updated.price !== 135000 || updated.stock !== 11 || !updated.nameTr) {
    throw new Error("Product update smoke test failed");
  }

  const visible = await prisma.product.findFirst({
    where: { sku: productSku, isPublished: true },
    include: { category: true, images: { orderBy: { sortOrder: "asc" } } },
  });

  if (!visible || visible.category.slug !== categorySlug || visible.images[0]?.sortOrder !== 0) {
    throw new Error("Published catalog query smoke test failed");
  }

  await prisma.product.delete({ where: { id: product.id } });
  const orphanMedia = await prisma.media.count({ where: { productId: product.id } });
  if (orphanMedia !== 0) throw new Error("Product media cascade delete failed");

  await prisma.category.delete({ where: { id: category.id } });

  console.log("Catalog smoke test passed: create, images, update, query, cascade cleanup");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
