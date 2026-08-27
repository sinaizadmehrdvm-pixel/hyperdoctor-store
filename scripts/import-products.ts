import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";

function parseCsv(input: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next = input[i + 1];
    if (ch === '"' && quoted && next === '"') {
      cell += '"';
      i++;
      continue;
    }
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (ch === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell.trim());
      cell = "";
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
  return body.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), values[index] ?? ""])),
  );
}

function asInt(value: string, fallback = 0): number {
  const normalized = value.replace(/[,_\s]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function asOptionalInt(value: string): number | null {
  if (!value.trim()) return null;
  return asInt(value, 0);
}

function asBool(value: string, fallback = false): boolean {
  if (!value.trim()) return fallback;
  return ["1", "true", "yes", "y", "on", "published"].includes(value.trim().toLowerCase());
}

function jsonOrDefault(value: string, fallback: string): string {
  if (!value.trim()) return fallback;
  try {
    JSON.parse(value);
    return value;
  } catch {
    throw new Error(`Invalid JSON value: ${value.slice(0, 120)}`);
  }
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    throw new Error("Usage: npm run import:products -- data/products.csv");
  }

  const absolute = path.resolve(inputPath);
  const rows = parseCsv(fs.readFileSync(absolute, "utf8").replace(/^\uFEFF/, ""));
  if (!rows.length) throw new Error("CSV has no product rows.");

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const [index, row] of rows.entries()) {
    const line = index + 2;
    try {
      if (!row.sku) throw new Error("sku is required");
      if (!row.categorySlug) throw new Error("categorySlug is required");
      if (!row.slug) throw new Error("slug is required");
      if (!row.nameFa || !row.nameEn) throw new Error("nameFa and nameEn are required");

      const category = await prisma.category.findUnique({ where: { slug: row.categorySlug } });
      if (!category) throw new Error(`Unknown categorySlug: ${row.categorySlug}`);

      const existing = await prisma.product.findUnique({ where: { sku: row.sku } });
      const commonData = {
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
        price: asInt(row.price),
        compareAtPrice: asOptionalInt(row.compareAtPrice || ""),
        costPrice: asOptionalInt(row.costPrice || ""),
        stock: asInt(row.stock),
        lowStockThreshold: asInt(row.lowStockThreshold || "2", 2),
        minOrderQty: Math.max(1, asInt(row.minOrderQty || "1", 1)),
        maxOrderQty: asOptionalInt(row.maxOrderQty || ""),
        warrantyMonths: asOptionalInt(row.warrantyMonths || ""),
        specs: jsonOrDefault(row.specs || "", "{}"),
        tags: jsonOrDefault(row.tags || "", "[]"),
        isPublished: asBool(row.isPublished, false),
        isFeatured: asBool(row.isFeatured, false),
        isNewArrival: asBool(row.isNewArrival, false),
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
        update: commonData,
        create: { ...commonData, sku: row.sku },
      });

      const imageUrls = (row.imageUrls || "")
        .split(";")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 12);
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

      if (existing) updated++;
      else created++;
      console.log(`✓ line ${line}: ${row.sku}`);
    } catch (error) {
      failed++;
      console.error(`✗ line ${line}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`\nImport complete — created: ${created}, updated: ${updated}, failed: ${failed}`);
  if (failed) process.exitCode = 1;
}

main().finally(async () => prisma.$disconnect());
