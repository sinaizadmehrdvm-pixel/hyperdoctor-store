import { adminRpc } from "@/lib/admin-data";

type Row={sku:string;slug:string;nameFa:string;nameTr:string;nameEn:string;nameAr:string;brand:string;primaryCategorySlug:string;secondaryCategories:string;taxonomy:string;price:number;stock:number;isPublished:boolean;isFeatured:boolean;isNewArrival:boolean};
const headers=["sku","slug","nameFa","nameTr","nameEn","nameAr","brand","primaryCategorySlug","secondaryCategories","taxonomy","price","stock","isPublished","isFeatured","isNewArrival"] as const;
function cell(value:unknown){const s=String(value??"");return /[",\n\r]/.test(s)?`"${s.replaceAll('"','""')}"`:s;}
export async function GET(){const rows=await adminRpc<Row[]>("admin_catalog_export");const csv=[headers.join(","),...rows.map(row=>headers.map(key=>cell(row[key])).join(","))].join("\r\n");return new Response(`\uFEFF${csv}`,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="hyperdoctor-catalog-${new Date().toISOString().slice(0,10)}.csv"`,"Cache-Control":"no-store"}})}
