import { NextResponse } from "next/server";
import { adminRpc } from "@/lib/admin-data";

function parseCsv(input: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i], next = input[i + 1];
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
  const normalizedHeaders = headers.map(h => h.replace(/^\uFEFF/, "").trim());
  return body.map(values => Object.fromEntries(normalizedHeaders.map((h, i) => [h, values[i] ?? ""])));
}

function normalizeBoolean(value: string | undefined, fallback = false) {
  if (!String(value ?? "").trim()) return fallback;
  return ["1", "true", "yes", "y", "on", "published"].includes(String(value).trim().toLowerCase());
}
function validJson(value: string | undefined, fallback: string) {
  if (!String(value ?? "").trim()) return fallback;
  const parsed = JSON.parse(String(value));
  return JSON.stringify(parsed);
}
function cleanNumber(value: string | undefined, fallback = "") {
  const raw = String(value ?? "").replace(/[,_\s]/g, "").trim();
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Invalid number: ${value}`);
  return String(Math.trunc(n));
}
function required(value: string | undefined) { return Boolean(String(value ?? "").trim()); }

type ImportRowResult = { id: string; sku: string; slug: string; created: boolean };

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid multipart payload" }, { status: 400 });
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "CSV file is too large" }, { status: 400 });
  if (!/\.csv$/i.test(file.name) && !String(file.type).toLowerCase().includes("csv")) return NextResponse.json({ error: "Only CSV files are allowed" }, { status: 400 });

  const rows = parseCsv((await file.text()).replace(/^\uFEFF/, ""));
  if (!rows.length) return NextResponse.json({ error: "CSV contains no product rows" }, { status: 400 });
  if (rows.length > 2000) return NextResponse.json({ error: "CSV row limit is 2000 products per import" }, { status: 400 });

  let created = 0, updated = 0;
  const errors: { line: number; sku: string; error: string }[] = [];

  for (const [index, source] of rows.entries()) {
    try {
      const mandatory = ["sku", "categorySlug", "nameFa", "nameTr", "nameEn", "nameAr"] as const;
      const missing = mandatory.filter(key => !required(source[key]));
      if (missing.length) throw new Error(`Required fields missing: ${missing.join(", ")}`);
      const row: Record<string, unknown> = {
        ...source,
        sku: source.sku.trim(), categorySlug: source.categorySlug.trim(),
        nameFa: source.nameFa.trim(), nameTr: source.nameTr.trim(), nameEn: source.nameEn.trim(), nameAr: source.nameAr.trim(),
        price: cleanNumber(source.price, "0"), compareAtPrice: cleanNumber(source.compareAtPrice), costPrice: cleanNumber(source.costPrice),
        stock: cleanNumber(source.stock, "0"), lowStockThreshold: cleanNumber(source.lowStockThreshold, "2"), minOrderQty: cleanNumber(source.minOrderQty, "1"),
        maxOrderQty: cleanNumber(source.maxOrderQty), weightGrams: cleanNumber(source.weightGrams), lengthMm: cleanNumber(source.lengthMm), widthMm: cleanNumber(source.widthMm), heightMm: cleanNumber(source.heightMm), warrantyMonths: cleanNumber(source.warrantyMonths),
        specs: validJson(source.specs, "{}"), tags: validJson(source.tags, "[]"),
        isPublished: normalizeBoolean(source.isPublished), isFeatured: normalizeBoolean(source.isFeatured), isNewArrival: normalizeBoolean(source.isNewArrival),
      };
      const images = (source.imageUrls || "").split(";").map(url => url.trim()).filter(Boolean).slice(0, 12);
      delete row.imageUrls;
      const result = await adminRpc<ImportRowResult>("admin_import_product_row", { p_row: row, p_images: images });
      if (result.created) created++; else updated++;
    } catch (error) {
      errors.push({ line: index + 2, sku: source.sku || "", error: error instanceof Error ? error.message : "Unknown import error" });
    }
  }

  return NextResponse.json({ created, updated, failed: errors.length, errors: errors.slice(0, 100) }, { status: errors.length === rows.length ? 400 : 200 });
}
