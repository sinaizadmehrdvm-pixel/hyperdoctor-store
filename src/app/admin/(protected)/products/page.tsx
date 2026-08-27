import Link from "next/link";
import Image from "next/image";
import { Archive, ImageOff, PackageSearch, Pencil, Plus, Search } from "lucide-react";
import { adminRpc } from "@/lib/admin-data";
import { formatPrice } from "@/lib/utils";
import { deleteProduct } from "./actions";

type ProductRow = {
  id:string; slug:string; nameFa:string; nameEn:string; sku:string; brand:string; price:number; stock:number; lowStockThreshold:number;
  isPublished:boolean; isFeatured:boolean; isNewArrival:boolean; categoryId:string; categoryNameFa:string; image?:string|null;
};
type ProductBundle = { products:ProductRow[]; categories:Array<{id:string;nameFa:string}> };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?:string }> }) {
  const { q = "" } = await searchParams;
  const bundle = await adminRpc<ProductBundle>("admin_products_bundle", { p_search:q });

  return <div className="mx-auto max-w-[1500px]">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#009dd8]">CATALOG MANAGEMENT</p><h1 className="mt-2 text-3xl font-black text-[#001736]">مدیریت محصولات</h1><p className="mt-2 text-sm text-[#747780]">کاتالوگ، قیمت، موجودی، تصاویر و انتشار چهارزبانه</p></div><Link href="/admin/products/new" className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#ba0036] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(186,0,54,.18)] hover:bg-[#e80346]"><Plus className="h-4 w-4"/>محصول جدید</Link></div>

    <form className="mt-7 flex gap-3 rounded-3xl border border-[#dfe4ea] bg-white p-4 shadow-[0_12px_32px_rgba(0,23,54,.04)]"><label className="relative flex-1"><Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#747780]"/><input name="q" defaultValue={q} placeholder="جستجوی نام، SKU یا برند..." className="h-12 w-full rounded-2xl border border-[#c4c6d0] bg-[#f7fafd] ps-11 pe-4 text-sm text-[#001736] outline-none focus:border-[#009dd8]"/></label><button className="rounded-2xl bg-[#002b5b] px-5 text-xs font-black text-white">جستجو</button></form>

    <section className="mt-6 overflow-hidden rounded-3xl border border-[#dfe4ea] bg-white shadow-[0_14px_38px_rgba(0,23,54,.045)]">
      <div className="flex items-center justify-between border-b border-[#e0e3e6] px-5 py-4"><div className="flex items-center gap-2 text-sm font-black text-[#001736]"><PackageSearch className="h-5 w-5 text-[#009dd8]"/>{bundle.products.length} محصول</div><div className="text-[11px] font-bold text-[#747780]">{bundle.categories.length} دسته‌بندی</div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-[#f7fafd] text-[11px] font-black text-[#747780]"><tr><th className="px-5 py-3 text-start">محصول</th><th className="px-5 py-3 text-start">دسته / برند</th><th className="px-5 py-3 text-start">قیمت</th><th className="px-5 py-3 text-start">موجودی</th><th className="px-5 py-3 text-start">وضعیت</th><th className="px-5 py-3 text-end">عملیات</th></tr></thead><tbody className="divide-y divide-[#edf0f2]">
        {bundle.products.map((p)=><tr key={p.id} className="hover:bg-[#fafcff]"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#f1f4f7]">{p.image?<Image src={p.image} alt="" fill className="object-contain p-1" sizes="48px"/>:<div className="flex h-full items-center justify-center text-[#9a9da5]"><ImageOff className="h-5 w-5"/></div>}</div><div className="min-w-0"><p className="max-w-[260px] truncate font-black text-[#001736]">{p.nameFa}</p><p dir="ltr" className="mt-1 text-[10px] font-mono text-[#8a8e96]">{p.sku}</p></div></div></td><td className="px-5 py-4"><p className="text-xs font-bold text-[#43474f]">{p.categoryNameFa}</p><p className="mt-1 text-[10px] text-[#8a8e96]">{p.brand || "—"}</p></td><td className="px-5 py-4 font-black tabular-nums text-[#001736]">{formatPrice(p.price,"fa")}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${p.stock<=p.lowStockThreshold?"bg-red-50 text-red-700":"bg-emerald-50 text-emerald-700"}`}>{p.stock}</span></td><td className="px-5 py-4"><div className="flex flex-wrap gap-1.5"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${p.isPublished?"bg-emerald-50 text-emerald-700":"bg-[#f1f4f7] text-[#747780]"}`}>{p.isPublished?"منتشرشده":"پیش‌نویس"}</span>{p.isFeatured?<span className="rounded-full bg-[#d6e3ff] px-2.5 py-1 text-[10px] font-black text-[#002b5b]">ویژه</span>:null}{p.isNewArrival?<span className="rounded-full bg-[#ffdada] px-2.5 py-1 text-[10px] font-black text-[#ba0036]">جدید</span>:null}</div></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><Link href={`/admin/products/${p.id}`} title="ویرایش" className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#dfe4ea] text-[#002b5b] hover:border-[#009dd8]"><Pencil className="h-4 w-4"/></Link><form action={deleteProduct.bind(null,p.id)}><button title="خروج از انتشار" className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#dfe4ea] text-[#747780] hover:border-[#ba0036]/40 hover:text-[#ba0036]"><Archive className="h-4 w-4"/></button></form></div></td></tr>)}
        {bundle.products.length===0?<tr><td colSpan={6} className="px-6 py-14 text-center"><PackageSearch className="mx-auto h-10 w-10 text-[#009dd8]"/><p className="mt-4 text-sm font-black text-[#001736]">هنوز محصولی ثبت نشده است.</p><p className="mt-2 text-xs text-[#747780]">از دکمه «محصول جدید» اولین کالای واقعی را اضافه کنید.</p></td></tr>:null}
      </tbody></table></div>
    </section>
  </div>;
}
