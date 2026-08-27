"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { BadgeCheck, Loader2, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";

type WarrantyProduct = {
  id: string;
  nameFa: string;
  nameTr?: string | null;
  nameEn: string;
  nameAr?: string | null;
  warrantyMonths?: number | null;
};

function productName(locale: string, p: WarrantyProduct) {
  return locale === "fa" ? p.nameFa : locale === "tr" ? p.nameTr || p.nameEn : locale === "ar" ? p.nameAr || p.nameEn : p.nameEn;
}

export function WarrantyForm({ products }: { products: WarrantyProduct[] }) {
  const locale = useLocale();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ serialNumber: string; publicToken: string; expiresAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const copy = locale === "fa"
    ? { title:"ثبت گارانتی محصول", body:"محصول، شماره سریال و تاریخ خرید را ثبت کنید. مدت گارانتی از اطلاعات واقعی همان محصول محاسبه می‌شود.", product:"محصول", serial:"شماره سریال", order:"شماره سفارش (اختیاری)", date:"تاریخ خرید", name:"نام و نام خانوادگی", phone:"شماره تماس", email:"ایمیل (اختیاری)", submit:"ثبت گارانتی", empty:"در حال حاضر محصول منتشرشده‌ای با گارانتی قابل ثبت وجود ندارد. پس از افزودن محصولات واقعی، فرم به‌صورت خودکار فعال می‌شود.", success:"گارانتی با موفقیت ثبت شد.", expiry:"پایان گارانتی", track:"مشاهده وضعیت گارانتی" }
    : locale === "tr"
      ? { title:"Ürün garantisini kaydet", body:"Ürünü, seri numarasını ve satın alma tarihini girin. Garanti süresi gerçek ürün bilgisinden hesaplanır.", product:"Ürün", serial:"Seri numarası", order:"Sipariş no (isteğe bağlı)", date:"Satın alma tarihi", name:"Ad Soyad", phone:"Telefon", email:"E-posta (isteğe bağlı)", submit:"Garantiyi kaydet", empty:"Şu anda kayıt edilebilir garantili yayımlanmış ürün yok. Gerçek ürünler eklendiğinde form otomatik etkinleşir.", success:"Garanti kaydı oluşturuldu.", expiry:"Garanti bitişi", track:"Garanti durumunu gör" }
      : locale === "ar"
        ? { title:"تسجيل ضمان المنتج", body:"اختر المنتج وأدخل الرقم التسلسلي وتاريخ الشراء. يتم حساب مدة الضمان من بيانات المنتج الفعلية.", product:"المنتج", serial:"الرقم التسلسلي", order:"رقم الطلب (اختياري)", date:"تاريخ الشراء", name:"الاسم الكامل", phone:"الهاتف", email:"البريد الإلكتروني (اختياري)", submit:"تسجيل الضمان", empty:"لا توجد حالياً منتجات منشورة بضمان قابل للتسجيل. سيتم تفعيل النموذج تلقائياً بعد إضافة المنتجات الفعلية.", success:"تم تسجيل الضمان بنجاح.", expiry:"نهاية الضمان", track:"عرض حالة الضمان" }
        : { title:"Register product warranty", body:"Choose the product and enter its serial number and purchase date. Warranty duration is calculated from the real product record.", product:"Product", serial:"Serial number", order:"Order number (optional)", date:"Purchase date", name:"Full name", phone:"Phone", email:"Email (optional)", submit:"Register warranty", empty:"There are currently no published products with a registerable warranty. The form activates automatically after real products are added.", success:"Warranty registered successfully.", expiry:"Warranty expiry", track:"View warranty status" };

  const eligible = products.filter((p) => (p.warrantyMonths ?? 0) > 0);
  const field = "h-12 w-full rounded-xl border border-[#c4c6d0] bg-[#f7fafd] px-3.5 text-sm text-[#001736] outline-none focus:border-[#009dd8] focus:ring-2 focus:ring-[#009dd8]/10";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError(null); setResult(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/warranty", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ requestToken:crypto.randomUUID(), productId:String(form.get("productId")||""), serialNumber:String(form.get("serialNumber")||""), orderNumber:String(form.get("orderNumber")||""), purchaseDate:String(form.get("purchaseDate")||""), name:String(form.get("name")||""), phone:String(form.get("phone")||""), email:String(form.get("email")||""), locale }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Warranty registration failed");
      setResult({ serialNumber:data.serialNumber, publicToken:data.publicToken, expiresAt:data.expiresAt }); event.currentTarget.reset();
    } catch (err) { setError(err instanceof Error ? err.message : "Warranty registration failed"); } finally { setSubmitting(false); }
  }

  if (eligible.length === 0) return <div className="rounded-3xl border border-[#dfe4ea] bg-white p-8 text-center shadow-[0_14px_38px_rgba(0,23,54,.045)]"><ShieldCheck className="mx-auto h-11 w-11 text-[#009dd8]" /><h2 className="mt-4 text-xl font-black text-[#001736]">{copy.title}</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#5f6570]">{copy.empty}</p></div>;

  return <form onSubmit={submit} className="rounded-3xl border border-[#dfe4ea] bg-white p-6 shadow-[0_18px_50px_rgba(0,23,54,.055)] sm:p-8">
    <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#001736] text-white"><BadgeCheck className="h-5 w-5" /></span><div><h2 className="text-xl font-black text-[#001736]">{copy.title}</h2><p className="mt-1 text-xs leading-6 text-[#747780]">{copy.body}</p></div></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <Label text={copy.product} className="sm:col-span-2"><select name="productId" required className={field}>{eligible.map(p=><option key={p.id} value={p.id}>{productName(locale,p)} · {p.warrantyMonths} months</option>)}</select></Label>
      <Label text={copy.serial}><input name="serialNumber" required minLength={3} maxLength={120} dir="ltr" className={field} /></Label>
      <Label text={copy.order}><input name="orderNumber" maxLength={80} dir="ltr" className={field} /></Label>
      <Label text={copy.date}><input name="purchaseDate" type="date" required max={new Date().toISOString().slice(0,10)} className={field} /></Label>
      <Label text={copy.name}><input name="name" required minLength={2} maxLength={120} className={field} /></Label>
      <Label text={copy.phone}><input name="phone" required minLength={8} maxLength={24} dir="ltr" className={field} /></Label>
      <Label text={copy.email}><input name="email" type="email" dir="ltr" className={field} /></Label>
    </div>
    {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div> : null}
    {result ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><div className="flex items-center gap-2 font-black"><BadgeCheck className="h-5 w-5" />{copy.success}</div><div className="mt-2 text-xs">{copy.expiry}: {new Date(result.expiresAt).toLocaleDateString(locale)}</div><Link href={`/warranty/status?serial=${encodeURIComponent(result.serialNumber)}&token=${encodeURIComponent(result.publicToken)}`} className="mt-3 inline-flex text-xs font-black underline">{copy.track}</Link></div> : null}
    <button type="submit" disabled={submitting} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#ba0036] px-6 text-sm font-black text-white shadow-[0_12px_28px_rgba(186,0,54,.18)] hover:bg-[#e80346] disabled:opacity-60">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}{copy.submit}</button>
  </form>;
}

function Label({text,children,className=""}:{text:string;children:React.ReactNode;className?:string}) { return <label className={`flex flex-col gap-1.5 ${className}`}><span className="text-xs font-black text-[#5f6570]">{text}</span>{children}</label>; }
