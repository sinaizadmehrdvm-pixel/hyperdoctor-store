"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify, RESERVED_SLUGS } from "@/lib/slug";
import { isPageSectionType } from "@/lib/content/page-sections";

async function requireAdmin() {
  const session = await auth();
  if (!session) redirect("/admin/login");
}

function revalidateManagedPage(slug: string) {
  revalidatePath("/admin/pages");
  revalidatePath(`/fa/${slug}`);
  revalidatePath(`/en/${slug}`);
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
    const previous = await prisma.page.findUnique({ where: { id }, select: { slug: true } });
    await prisma.page.update({ where: { id }, data });
    if (previous?.slug && previous.slug !== slug) revalidateManagedPage(previous.slug);
  } else {
    await prisma.page.create({ data });
  }

  revalidateManagedPage(slug);
  revalidatePath("/", "layout");
  redirect("/admin/pages");
}

export async function deletePage(id: string) {
  await requireAdmin();
  const page = await prisma.page.findUnique({ where: { id }, select: { slug: true } });
  await prisma.page.delete({ where: { id } });
  if (page) revalidateManagedPage(page.slug);
  revalidatePath("/", "layout");
}

export async function createPageSection(formData: FormData) {
  await requireAdmin();
  const pageId = String(formData.get("pageId") || "");
  const type = String(formData.get("type") || "richText");
  if (!pageId || !isPageSectionType(type)) throw new Error("Invalid section request.");

  const page = await prisma.page.findUnique({ where: { id: pageId }, select: { slug: true } });
  if (!page) throw new Error("Page not found.");

  await prisma.$transaction(async (tx) => {
    const last = await tx.pageSection.findFirst({
      where: { pageId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    await tx.pageSection.create({
      data: {
        pageId,
        type,
        sortOrder: (last?.sortOrder ?? -1) + 1,
        status: "DRAFT",
        enabled: true,
      },
    });
  });

  revalidateManagedPage(page.slug);
  revalidatePath(`/admin/pages/${pageId}`);
}

export async function updatePageSection(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Section id is required.");

  const existing = await prisma.pageSection.findUnique({
    where: { id },
    include: { page: { select: { slug: true } } },
  });
  if (!existing) throw new Error("Section not found.");

  const type = String(formData.get("type") || existing.type);
  const status = String(formData.get("status") || "DRAFT");
  if (!isPageSectionType(type)) throw new Error("Invalid section type.");
  if (status !== "DRAFT" && status !== "PUBLISHED") throw new Error("Invalid section status.");

  const settings = String(formData.get("settings") || "{}");
  try {
    const parsed: unknown = JSON.parse(settings);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
  } catch {
    throw new Error("Section settings must be a JSON object.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.pageSection.update({
      where: { id },
      data: {
        type,
        enabled: formData.get("enabled") === "on",
        status,
        titleFa: String(formData.get("titleFa") || ""),
        titleEn: String(formData.get("titleEn") || ""),
        bodyFa: String(formData.get("bodyFa") || ""),
        bodyEn: String(formData.get("bodyEn") || ""),
        ctaLabelFa: String(formData.get("ctaLabelFa") || ""),
        ctaLabelEn: String(formData.get("ctaLabelEn") || ""),
        ctaHref: String(formData.get("ctaHref") || ""),
        backgroundUrl: String(formData.get("backgroundUrl") || ""),
        backgroundAltFa: String(formData.get("backgroundAltFa") || ""),
        backgroundAltEn: String(formData.get("backgroundAltEn") || ""),
        settings,
      },
    });
    if (status === "PUBLISHED") {
      await tx.page.update({ where: { id: existing.pageId }, data: { template: "sections" } });
    }
  });

  revalidateManagedPage(existing.page.slug);
  revalidatePath(`/admin/pages/${existing.pageId}`);
}

export async function movePageSection(id: string, direction: "up" | "down") {
  await requireAdmin();
  const section = await prisma.pageSection.findUnique({
    where: { id },
    include: { page: { select: { slug: true } } },
  });
  if (!section) return;

  const neighbour = await prisma.pageSection.findFirst({
    where: {
      pageId: section.pageId,
      sortOrder: direction === "up" ? { lt: section.sortOrder } : { gt: section.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbour) return;

  await prisma.$transaction(async (tx) => {
    const temporaryOrder = -1_000_000_000;
    await tx.pageSection.update({ where: { id: section.id }, data: { sortOrder: temporaryOrder } });
    await tx.pageSection.update({ where: { id: neighbour.id }, data: { sortOrder: section.sortOrder } });
    await tx.pageSection.update({ where: { id: section.id }, data: { sortOrder: neighbour.sortOrder } });
  });

  revalidateManagedPage(section.page.slug);
  revalidatePath(`/admin/pages/${section.pageId}`);
}

export async function deletePageSection(id: string) {
  await requireAdmin();
  const section = await prisma.pageSection.findUnique({
    where: { id },
    include: { page: { select: { slug: true } } },
  });
  if (!section) return;

  await prisma.$transaction(async (tx) => {
    await tx.pageSection.delete({ where: { id } });
    const remaining = await tx.pageSection.findMany({
      where: { pageId: section.pageId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, sortOrder: true },
    });
    for (let index = 0; index < remaining.length; index += 1) {
      const row = remaining[index];
      if (row.sortOrder === index) continue;
      await tx.pageSection.update({ where: { id: row.id }, data: { sortOrder: -2_000_000_000 - index } });
    }
    for (let index = 0; index < remaining.length; index += 1) {
      await tx.pageSection.update({ where: { id: remaining[index].id }, data: { sortOrder: index } });
    }
  });

  revalidateManagedPage(section.page.slug);
  revalidatePath(`/admin/pages/${section.pageId}`);
}
