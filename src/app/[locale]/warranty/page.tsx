import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BadgeCheck, Headphones, ShieldCheck, Wrench } from "lucide-react";
import { Container } from "@/components/ui/container";
import { WarrantyForm } from "@/components/site/warranty-form";
import { getProducts } from "@/lib/queries";

const HERO_IMAGE = "https://lh3.googleusercontent.com/aida/AEtjO1U1Zzri1WAPPMaApZwWUjBtEJW5tGj5LaUw6tMiH5OTgSYg8ZfC4gJTbkxWExkAYdo8Ut5lmTeyjYP4hCyF80ZFXKpNPsLqMrvI1e8xxrMV3W3pTwzZIwRkH28eyFZsAcTSKYVihv1z2qxCiHZlLj0IiOrUCKbiD3B7iaN_FLz4zPvLuAg2hZrJ2gvgqG1RGfzce79WnG0OA6gwCRMZ8PXjXsrId6L-BN0_e8LSABBuzpopv_4NLQnNiPVC";

export default async function WarrantyPage() {
  const [locale, products] = await Promise.all([getLocale(), getProducts()]);
  const fa = { eyebrow:"تضمین کیفیت سطح بالینی", title:"پشتیبانی بی‌وقفه برای تجهیزات حیاتی", body:"در هایپر دکتر، قابلیت اطمینان بخشی از تجربه خرید است. گارانتی و خدمات پس از فروش برای تجهیزات تنفسی و تشخیصی با ثبت و پیگیری شفاف ارائه می‌شود.", service:"درخواست سرویس", urgent:"خط داغ ۲۴/۷", warrantyTitle:"گارانتی رسمی", warrantyBody:"مدت پوشش هر دستگاه از اطلاعات واقعی همان محصول دریافت می‌شود و ثبت آن قابل پیگیری است.", register:"ثبت گارانتی", status:"استعلام گارانتی" };
  const en = { eyebrow:"Clinical-grade quality assurance", title:"Continuous support for critical equipment", body:"At Hyper Doctor, reliability is part of the purchase experience. Warranty and after-sales support for respiratory and diagnostic equipment is registered and traceable.", service:"Request service", urgent:"24/7 hotline", warrantyTitle:"Official warranty", warrantyBody:"Coverage is derived from the actual product record and each registration remains traceable.", register:"Register warranty", status:"Check warranty" };
  const tr = { ...en, eyebrow:"Klinik düzey kalite güvencesi", title:"Kritik cihazlar için kesintisiz destek", service:"Servis talebi", urgent:"7/24 destek", warrantyTitle:"Resmî garanti", register:"Garanti kaydı", status:"Garanti sorgula" };
  const ar = { ...en, eyebrow:"ضمان جودة بمستوى سريري", title:"دعم مستمر للمعدات الحيوية", service:"طلب صيانة", urgent:"دعم 24/7", warrantyTitle:"ضمان رسمي", register:"تسجيل الضمان", status:"التحقق من الضمان" };
  const c = locale === "fa" ? fa : locale === "tr" ? tr : locale === "ar" ? ar : en;

  return <main className="flex-1 bg-[#f4f7fb]">
    <section className="relative min-h-[610px] overflow-hidden bg-[#07305d] text-white">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(1,39,79,.92)_0%,rgba(1,39,79,.72)_48%,rgba(1,39,79,.58)_100%)] rtl:bg-[linear-gradient(270deg,rgba(1,39,79,.92)_0%,rgba(1,39,79,.72)_48%,rgba(1,39,79,.58)_100%)]" />
      <Container className="relative z-10 grid min-h-[610px] items-center gap-10 py-14 lg:grid-cols-[.82fr_1.18fr]">
        <div className="order-2 lg:order-1"><div className="rounded-3xl bg-white/85 p-7 text-[#001736] shadow-[0_24px_60px_rgba(0,0,0,.18)] backdrop-blur-md sm:p-9"><div className="flex items-start gap-5"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#001736] text-white"><ShieldCheck className="h-6 w-6" /></span><div><h2 className="text-2xl font-black">{c.warrantyTitle}</h2><p className="mt-3 text-sm leading-8 text-[#4f5965]">{c.warrantyBody}</p></div></div><div className="mt-6 flex flex-wrap gap-3"><a href="#register" className="rounded-xl bg-[#001736] px-5 py-3 text-xs font-black text-white">{c.register}</a><Link href="/warranty/status" className="rounded-xl border border-[#c4c6d0] bg-white px-5 py-3 text-xs font-black text-[#001736]">{c.status}</Link></div></div></div>
        <div className="order-1 lg:order-2"><span className="inline-flex rounded-full border border-[#33c8ff]/30 bg-[#009dd8]/15 px-4 py-2 text-xs font-black text-[#9bdcff]">{c.eyebrow}</span><h1 className="mt-7 text-4xl font-black leading-[1.35] sm:text-6xl">{c.title}</h1><p className="mt-6 max-w-2xl text-sm leading-8 text-white/78 sm:text-base">{c.body}</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/support" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#009dd8] px-5 text-sm font-black text-white"><Wrench className="h-4 w-4" />{c.service}</Link><Link href="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/30 bg-white/8 px-5 text-sm font-black text-white backdrop-blur"><Headphones className="h-4 w-4" />{c.urgent}</Link></div></div>
      </Container>
    </section>

    <section id="register" className="scroll-mt-28 py-12 sm:py-16"><Container><div className="mb-7 flex items-center gap-3"><BadgeCheck className="h-6 w-6 text-[#009dd8]" /><h2 className="text-2xl font-black text-[#001736]">{c.register}</h2></div><WarrantyForm products={products.map((p:any)=>({id:p.id,nameFa:p.nameFa,nameTr:p.nameTr,nameEn:p.nameEn,nameAr:p.nameAr,warrantyMonths:p.warrantyMonths}))}/></Container></section>
  </main>;
}
