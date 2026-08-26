"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

async function requireAdmin() {
  const session = await auth();
  if (!session) redirect("/admin/login");
}

function revalidateProduct(product: { id: string; slug: string }) {
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${product.id}`);
  for (const locale of ["fa", "en"]) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/shop`);
    revalidatePath(`/${locale}/product/${product.slug}`);
  }
}

export async function upsertProduct(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const imageUrl = String(formData.get("imageUrl") || "");

  const data = {
    vertical: String(formData.get("vertical")) as
      | "MEDICAL_EQUIPMENT"
      | "RESPIRATORY_SERVICES"
      | "DENTAL"
      | "VETERINARY"
      | "PHARMACY"
      | "NURSING",
    categoryId: String(formData.get("categoryId")),
    slug: slugify(String(formData.get("slug") || formData.get("nameEn"))),
    nameFa: String(formData.get("nameFa") || ""),
    nameEn: String(formData.get("nameEn") || ""),
    descriptionFa: String(formData.get("descriptionFa") || ""),
    descriptionEn: String(formData.get("descriptionEn") || ""),
    brand: String(formData.get("brand") || ""),
    sku: String(formData.get("sku") || ""),
    price: Number(formData.get("price") || 0),
    compareAtPrice: formData.get("compareAtPrice")
      ? Number(formData.get("compareAtPrice"))
      : null,
    stock: Number(formData.get("stock") || 0),
    specs: String(formData.get("specs") || "{}"),
    isPublished: formData.get("isPublished") === "on",
    isFeatured: formData.get("isFeatured") === "on",
  };

  const product = id
    ? await prisma.product.update({ where: { id }, data })
    : await prisma.product.create({ data });

  if (imageUrl && imageUrl.startsWith("/uploads/")) {
    const existingImage = await prisma.media.findFirst({
      where: { productId: product.id },
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    });
    if (existingImage) {
      await prisma.media.update({
        where: { id: existingImage.id },
        data: { url: imageUrl, isPrimary: true, isPublished: true },
      });
    } else {
      await prisma.media.create({
        data: {
          url: imageUrl,
          productId: product.id,
          altFa: data.nameFa,
          altEn: data.nameEn,
          sortOrder: 0,
          isPrimary: true,
          isPublished: true,
        },
      });
    }
  }

  revalidateProduct(product);
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const product = await prisma.product.findUnique({ where: { id }, select: { id: true, slug: true } });
  await prisma.product.delete({ where: { id } });
  if (product) revalidateProduct(product);
}

export async function addProductMedia(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") || "");
  const url = String(formData.get("url") || "");
  if (!productId || !url.startsWith("/uploads/")) throw new Error("Invalid media upload.");

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, slug: true, nameFa: true, nameEn: true } });
  if (!product) throw new Error("Product not found.");

  await prisma.$transaction(async (tx) => {
    const last = await tx.media.findFirst({ where: { productId }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
    const count = await tx.media.count({ where: { productId } });
    await tx.media.create({
      data: {
        productId,
        url,
        altFa: String(formData.get("altFa") || product.nameFa),
        altEn: String(formData.get("altEn") || product.nameEn),
        sortOrder: (last?.sortOrder ?? -1) + 1,
        isPrimary: count === 0,
        isPublished: formData.get("isPublished") === "on",
      },
    });
  });
  revalidateProduct(product);
}

export async function updateProductMedia(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const media = await prisma.media.findUnique({ where: { id }, include: { product: { select: { id: true, slug: true } } } });
  if (!media?.product) throw new Error("Product media not found.");

  await prisma.media.update({
    where: { id },
    data: {
      altFa: String(formData.get("altFa") || ""),
      altEn: String(formData.get("altEn") || ""),
      isPublished: formData.get("isPublished") === "on",
    },
  });
  revalidateProduct(media.product);
}

export async function setPrimaryProductMedia(id: string) {
  await requireAdmin();
  const media = await prisma.media.findUnique({ where: { id }, include: { product: { select: { id: true, slug: true } } } });
  if (!media?.productId || !media.product) return;

  await prisma.$transaction([
    prisma.media.updateMany({ where: { productId: media.productId }, data: { isPrimary: false } }),
    prisma.media.update({ where: { id }, data: { isPrimary: true } }),
  ]);
  revalidateProduct(media.product);
}

export async function moveProductMedia(id: string, direction: "up" | "down") {
  await requireAdmin();
  const media = await prisma.media.findUnique({ where: { id }, include: { product: { select: { id: true, slug: true } } } });
  if (!media?.productId || !media.product) return;

  const neighbour = await prisma.media.findFirst({
    where: {
      productId: media.productId,
      sortOrder: direction === "up" ? { lt: media.sortOrder } : { gt: media.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbour) return;

  await prisma.$transaction([
    prisma.media.update({ where: { id: media.id }, data: { sortOrder: neighbour.sortOrder } }),
    prisma.media.update({ where: { id: neighbour.id }, data: { sortOrder: media.sortOrder } }),
  ]);
  revalidateProduct(media.product);
}

export async function deleteProductMedia(id: string) {
  await requireAdmin();
  const media = await prisma.media.findUnique({ where: { id }, include: { product: { select: { id: true, slug: true } } } });
  if (!media?.productId || !media.product) return;

  await prisma.$transaction(async (tx) => {
    await tx.media.delete({ where: { id } });
    const remaining = await tx.media.findMany({ where: { productId: media.productId! }, orderBy: { sortOrder: "asc" } });
    for (let index = 0; index < remaining.length; index += 1) {
      await tx.media.update({
        where: { id: remaining[index].id },
        data: { sortOrder: index, isPrimary: media.isPrimary ? index === 0 : remaining[index].isPrimary },
      });
    }
  });
  revalidateProduct(media.product);
}
