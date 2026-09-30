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

export async function upsertCategory(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const data = {
    vertical: String(formData.get("vertical")) as
      | "MEDICAL_EQUIPMENT"
      | "RESPIRATORY_SERVICES"
      | "DENTAL"
      | "VETERINARY"
      | "PHARMACY"
      | "NURSING",
    slug: slugify(String(formData.get("slug") || formData.get("nameEn"))),
    nameFa: String(formData.get("nameFa") || ""),
    nameEn: String(formData.get("nameEn") || ""),
    descriptionFa: String(formData.get("descriptionFa") || ""),
    descriptionEn: String(formData.get("descriptionEn") || ""),
    image: String(formData.get("image") || "") || null,
    order: Number(formData.get("order") || 0),
  };

  if (id) {
    await prisma.category.update({ where: { id }, data });
  } else {
    await prisma.category.create({ data });
  }

  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const category = await prisma.category.findUnique({
    where: { id },
    select: { _count: { select: { products: true, children: true } } },
  });
  if (!category) return;
  if (category._count.products > 0 || category._count.children > 0) {
    throw new Error("Category must be empty before deletion.");
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
}
