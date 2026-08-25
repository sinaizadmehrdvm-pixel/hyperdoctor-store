import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function parseCsv(input: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next = input[i + 1];
    if (ch === '"' && quoted && next === '"') { cell += '"'; i++; continue; }
    if (ch === '"') { quoted = !quoted; continue; }
    if (ch === "," && !quoted) { row.push(cell.trim()); cell = ""; continue; }
    if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell.trim()); cell = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  const [headers, ...body] = rows;
  if (!headers) return [];
  return body.map((values) => Object.fromEntries(headers.map((h, i) => [h.trim(), values[i] ?? ""])));
}

const int = (value: string | undefined, fallback = 0) => {
  const number = Number(String(value ?? "").replace(/[,_\s]/g, ""));
  return Number.isFinite(number) ? Math.trunc(number) : fallback;
};
const optionalInt = (value: string | undefined) => String(value ?? "").trim() ? int(value) : null;
const bool = (value: string | undefined, fallback = false) => {
  if (!String(value ?? "").trim()) return fallback;
  return ["1", "true", "yes", "y", "on", "published"].includes(String(value).trim().toLowerCase());
};
function validJson(value: string | undefined, fallback: string) {
  if (!String(value ?? "").trim()) return fallback;
  JSON.parse(String(value));
  return String(value);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "CSV file is too large" }, { status: 400 });

  const rows = parseCsv((await file.text()).replace(/^\uFEFF/, ""));
  if (!rows.length) return NextResponse.json({ error: "CSV contains no product rows" }, { status: 400 });

  let created = 0;
  let updated = 0;
  const errors: { line: number; sku: string; error: string }[] = [];

  for (const [index, row] of rows.entries()) {
    try {
      if (!row.sku || !row.categorySlug || !row.slug || !row.nameFa || !row.nameEn) {
        throw new Error("sku, categorySlug, slug, nameFa and nameEn are required");
      }
      const category = await prisma.category.findUnique({ where: { slug: row.categorySlug } });
      if (!category) throw new Error(`Unknown categorySlug: ${row.categorySlug}`);
      const existing = await prisma.product.findUnique({ where: { sku: row.sku } });

      const data = {
        vertical: (row.vertical || category.vertical) as typeof category.vertical,
        categoryId: category.id,
        slug: row.slug,
        nameFa: row.nameFa,
        nameTr: row.nameTr || "",
        nameEn: row.nameEn,
        nameAr: row.nameAr || "",
        descriptionFa: row.descriptionFa || "",
        descriptionTr: row.descriptionTr || "",
        descriptionEn: row.descriptionEn || "",
        descriptionAr: row.descriptionAr || "",
        brand: row.brand || "",
        modelNumber: row.modelNumber || "",
        barcode: row.barcode || "",
        gtin: row.gtin || "",
        manufacturer: row.manufacturer || "",
        countryOfOrigin: row.countryOfOrigin || "",
        price: int(row.price),
        compareAtPrice: optionalInt(row.compareAtPrice),
        costPrice: optionalInt(row.costPrice),
        stock: int(row.stock),
        lowStockThreshold: int(row.lowStockThreshold, 2),
        minOrderQty: Math.max(1, int(row.minOrderQty, 1)),
        maxOrderQty: optionalInt(row.maxOrderQty),
        warrantyMonths: optionalInt(row.warrantyMonths),
        specs: validJson(row.specs, "{}"),
        tags: validJson(row.tags, "[]"),
        isPublished: bool(row.isPublished),
        isFeatured: bool(row.isFeatured),
        isNewArrival: bool(row.isNewArrival),
        seoTitleFa: row.seoTitleFa || "",
        seoTitleTr: row.seoTitleTr || "",
        seoTitleEn: row.seoTitleEn || "",
        seoTitleAr: row.seoTitleAr || "",
        seoDescriptionFa: row.seoDescriptionFa || "",
        seoDescriptionTr: row.seoDescriptionTr || "",
        seoDescriptionEn: row.seoDescriptionEn || "",
        seoDescriptionAr: row.seoDescriptionAr || "",
      };

      const product = await prisma.product.upsert({
        where: { sku: row.sku },
        update: data,
        create: { ...data, sku: row.sku },
      });

      const imageUrls = (row.imageUrls || "").split(";").map((url) => url.trim()).filter(Boolean).slice(0, 12);
      if (imageUrls.length) {
        await prisma.media.deleteMany({ where: { productId: product.id } });
        await prisma.media.createMany({
          data: imageUrls.map((url, sortOrder) => ({
            productId: product.id,
            url,
            sortOrder,
            altFa: row.nameFa,
            altTr: row.nameTr || row.nameEn,
            altEn: row.nameEn,
            altAr: row.nameAr || row.nameFa,
          })),
        });
      }
      if (existing) updated++; else created++;
    } catch (error) {
      errors.push({ line: index + 2, sku: row.sku || "", error: error instanceof Error ? error.message : "Unknown import error" });
    }
  }

  return NextResponse.json({ created, updated, failed: errors.length, errors: errors.slice(0, 100) }, { status: errors.length === rows.length ? 400 : 200 });
}
