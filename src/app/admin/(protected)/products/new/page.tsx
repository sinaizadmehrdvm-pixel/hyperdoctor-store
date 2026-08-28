import Link from "next/link";
import { ChevronLeft, Database, PackagePlus } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-[1450px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-[#e80346]"><Database className="h-4 w-4"/>Catalog Database</p>
          <h1 className="mt-2 text-3xl font-black text-[#001736]">افزودن محصول جدید</h1>
          <p className="mt-2 text-sm text-[#747780]">اطلاعات پایه، قیمت و موجودی، تصاویر، مشخصات فنی، SEO و انتشار چهارزبانه</p>
        </div>
        <Link href="/admin/products" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#dfe4ea] bg-white px-4 text-xs font-black text-[#001736]"><ChevronLeft className="h-4 w-4"/>بازگشت به محصولات</Link>
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#e2e6eb] bg-white p-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#001736] text-white"><PackagePlus className="h-4 w-4"/></span><p className="mt-3 text-xs font-black text-[#001736]">۱. اطلاعات و شناسه‌ها</p></div>
        <div className="rounded-2xl border border-[#e2e6eb] bg-white p-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf4ff] text-[#002b5b]">۲</span><p className="mt-3 text-xs font-black text-[#001736]">۲. تصاویر و مشخصات فنی</p></div>
        <div className="rounded-2xl border border-[#e2e6eb] bg-white p-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff0f3] text-[#e80346]">۳</span><p className="mt-3 text-xs font-black text-[#001736]">۳. SEO و انتشار</p></div>
      </div>
      <ProductForm />
    </div>
  );
}
