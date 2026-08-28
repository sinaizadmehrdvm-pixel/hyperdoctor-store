import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { adminRpc } from "@/lib/admin-data";
import { ProductForm } from "@/components/admin/product-form";
import { currentAdminLocale } from "@/lib/admin-locale-server";
import type { AdminLocale } from "@/lib/admin-i18n";

type ProductDetail = Parameters<typeof ProductForm>[0]["product"];
const copy:Record<AdminLocale,{eyebrow:string;title:string;back:string}>={fa:{eyebrow:"ویرایشگر کاتالوگ",title:"ویرایش محصول",back:"بازگشت به محصولات"},ar:{eyebrow:"محرر الكتالوج",title:"تعديل المنتج",back:"العودة إلى المنتجات"},en:{eyebrow:"Catalog editor",title:"Edit product",back:"Back to products"},tr:{eyebrow:"Katalog düzenleyici",title:"Ürünü düzenle",back:"Ürünlere dön"}};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }=await params;const[product,locale]=await Promise.all([adminRpc<ProductDetail|null>("admin_product_detail",{p_id:id}),currentAdminLocale()]);if(!product)notFound();const t=copy[locale];const Arrow=locale==="fa"||locale==="ar"?ChevronLeft:ChevronRight;
  return <div className="mx-auto max-w-7xl"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.12em] text-[#009dd8]">{t.eyebrow}</p><h1 className="mt-2 text-3xl font-black text-[#001736]">{t.title}</h1></div><Link href="/admin/products" className="vitalis-focus inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#dfe4ea] bg-white px-4 text-xs font-black text-[#001736]"><Arrow className="h-4 w-4" aria-hidden="true"/>{t.back}</Link></div><ProductForm product={product}/></div>;
}
