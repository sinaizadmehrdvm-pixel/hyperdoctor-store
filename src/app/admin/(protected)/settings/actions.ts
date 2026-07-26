"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function updateSiteSettings(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const data = {
    holdingName: String(formData.get("holdingName") || ""),
    holdingLogoUrl: String(formData.get("holdingLogoUrl") || ""),
    subBrandName: String(formData.get("subBrandName") || ""),
    subBrandLogoUrl: String(formData.get("subBrandLogoUrl") || ""),
    contactPhone: String(formData.get("contactPhone") || ""),
    contactEmail: String(formData.get("contactEmail") || ""),
    address: String(formData.get("address") || ""),
    instagramUrl: String(formData.get("instagramUrl") || ""),
    telegramUrl: String(formData.get("telegramUrl") || ""),
    whatsappUrl: String(formData.get("whatsappUrl") || ""),
  };

  await prisma.siteSetting.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}
