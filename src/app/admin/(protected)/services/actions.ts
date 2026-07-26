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

export async function upsertService(formData: FormData) {
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
    price: formData.get("price") ? Number(formData.get("price")) : null,
    priceIsFrom: formData.get("priceIsFrom") === "on",
    durationMinutes: formData.get("durationMinutes")
      ? Number(formData.get("durationMinutes"))
      : null,
    requiresBooking: formData.get("requiresBooking") === "on",
    isPublished: formData.get("isPublished") === "on",
  };

  if (id) {
    await prisma.service.update({ where: { id }, data });
  } else {
    await prisma.service.create({ data });
  }

  revalidatePath("/admin/services");
  revalidatePath("/", "layout");
  redirect("/admin/services");
}

export async function deleteService(id: string) {
  await requireAdmin();
  await prisma.service.delete({ where: { id } });
  revalidatePath("/admin/services");
  revalidatePath("/", "layout");
}
