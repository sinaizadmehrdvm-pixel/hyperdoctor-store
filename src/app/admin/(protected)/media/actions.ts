"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function addMedia(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const url = String(formData.get("url") || "");
  if (!url) return;

  await prisma.media.create({ data: { url } });
  revalidatePath("/admin/media");
}

export async function deleteMedia(id: string) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  await prisma.media.delete({ where: { id } });
  revalidatePath("/admin/media");
}
