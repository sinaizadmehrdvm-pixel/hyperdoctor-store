"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify, RESERVED_SLUGS } from "@/lib/slug";

async function requireAdmin() {
  const session = await auth();
  if (!session) redirect("/admin/login");
}

export async function upsertPage(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const slug = slugify(String(formData.get("slug") || formData.get("titleEn")));
  if (RESERVED_SLUGS.has(slug)) {
    throw new Error(`اسلاگ "${slug}" رزرو شده است و قابل استفاده نیست.`);
  }

  const data = {
    slug,
    titleFa: String(formData.get("titleFa") || ""),
    titleEn: String(formData.get("titleEn") || ""),
    contentFa: String(formData.get("contentFa") || ""),
    contentEn: String(formData.get("contentEn") || ""),
    isPublished: formData.get("isPublished") === "on",
    showInNav: formData.get("showInNav") === "on",
    navOrder: Number(formData.get("navOrder") || 0),
  };

  if (id) {
    await prisma.page.update({ where: { id }, data });
  } else {
    await prisma.page.create({ data });
  }

  revalidatePath("/admin/pages");
  revalidatePath("/", "layout");
  redirect("/admin/pages");
}

export async function deletePage(id: string) {
  await requireAdmin();
  await prisma.page.delete({ where: { id } });
  revalidatePath("/admin/pages");
  revalidatePath("/", "layout");
}
