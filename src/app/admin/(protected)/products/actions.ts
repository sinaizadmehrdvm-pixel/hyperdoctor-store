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

  if (imageUrl) {
    const existingImage = await prisma.media.findFirst({ where: { productId: product.id } });
    if (existingImage) {
      await prisma.media.update({ where: { id: existingImage.id }, data: { url: imageUrl } });
    } else {
      await prisma.media.create({
        data: { url: imageUrl, productId: product.id, altFa: data.nameFa, altEn: data.nameEn },
      });
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
}
