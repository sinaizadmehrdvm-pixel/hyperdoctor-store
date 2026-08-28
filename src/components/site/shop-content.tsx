import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { ShopProductCard } from "@/components/site/shop-product-card";
import { SortSelect } from "@/components/site/shop-filters";
import { getCategories, getProducts, type ProductSort } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { localizedName } from "@/lib/i18n-content";
import {
  Activity,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Home,
  LayoutGrid,
  Move3d,
  PackageSearch,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  Wind,
  Wrench,
  Truck,
  Headphones,
  GitCompareArrows,
  Crown,
} from "lucide-react";

const campaignHero =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBkGAIWD_2Ir4YxcY60tSJPB-IR4fXygjHFVd9JnXWxpeZOZRMkj-7ds_DII_V05OsBnpKDZyLlvePJGbRasGpY6BrkMgYXdYCPUjxyhNH7GIreHkFFj5XtTrpYFINQXnuM47PBpgh6ePiC3UpdbrcAEn6gJ3WRIh5LjfvbRMRiJEmerf8foDZvCa6eD86sJjKHv1Q9BY82kFJmj8sbyO7am92wowHDlD9oErfaMfym77hKPkWuH7bP5Q";

const saleBanner =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB-41yc4qDncZhkP2v8LZpcQt4uaUBOKfHUPCeP1j9HtT8WzzVrN1m6IdP_EgEUTImBm3dx9k9AhSvAjFu4ena6BATVBuEXMdx0dcSxcy6S0ZM5N1ls05OTnycV-nNfasyAUZMP7xI7QgNX-VrCXpjX4n2Hud93gNyXKT_vnHxx57hWP1GAdYMrMH-nr4DPyrzzfvLcrzJbPHCzrg0ZeLHoU-g26hEdbkZXScPnQtinBAGPaVpu4QKvHA";

const categoryBackdrops = [
  "https://lh3.googleusercontent.com/aida/AEtjO1WQUiQEGzWxk0pACDLKN61qErEQJZUopK3g3DSnYQ4ozN-wBHqW5k5l_vyskoM70yZFEPUSi-Suieizz3uFvN6Ff-g7SInvbezslZH0vMAbTm2V25YOG_ZTotveaKCm2IGMQ3r54dsd2mg4iP_3A1BlUzLzHaA9oykRFxZj9xwups3aY0mdldVLSqRqlaslu5Li4fjLA8doP2Zk9hHliadg7YJ6ND8UU2WL2W65KiyoyWX_R7t_v6OZ94Q",
  "https://lh3.googleusercontent.com/aida/AEtjO1V27OpYcMX2H_e_bQS2CnJ3H6Fo9KBikOnT4vYEAgUGmGjK7B2lSnicJC_zYGTjKzTOBZI3-n7xcui3IWcBh0HTWosSNHsw-7x4anG1H3JnE9IZqeZwLvRGKBLbCILqGzQv5ewPa2gP1ShPi35bjVWDjpoND8gAvZBlz16_RPIFVOjlTMjA7RaOwXhnPrVhfCYbmf7ptkpdFVyceWwhpOX5wNRZ_7ONXk8kPBRZ9zs2pCJtwFgqTfUF-TUB",
  "https://lh3.googleusercontent.com/aida/AEtjO1USm67xLGfVgjK7SPFcuGI3t_viURa5m7TgecfZlyYsQ31-LYdtGGZyUBwU79I8rw65p531GlXIiDhIiR8H4s3I0lRjq4XqPRMMaHTVQr4684BlYda4h01tSouqinaAUorOFePZTSww8Ae1vVzFEi4b2-Z5yXdIRpo-mfTTdeRHCuLstUmz9oZV9Y1dp9fAG5vO59_2yONVSB2MhiyTNWgzFuV4kyCyjTOXSeSJWDaGFENuM9194lJxpmKb",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAc-L63w_5w_YidPcNapKU_sL45wcKysG0m29z4MgDoribfpiRoDt8Oa3kyvVhdV2TenQOUPUVk1MAL6pPdWqBub_IsAcNaaMa3SzRJNxguvpkEKz0qtjlOXHmwgpSQZ55fMATzIkZtmW1T0Ty1G_wkNK2Wst9Qqwwdmt6XO3wTMm3bR9cS3AW7FjVHW1X6JNZL_a9N6RjDa-ht5J9IGJcq-b4Hhg_6uckQj1sGlNn3gKBAyFv39MrlTg",
  "https://lh3.googleusercontent.com/aida/AEtjO1V3l5v9axD6WhnmeOQuKiTQMOTlRPYgDntnVSkvFhlQOVKOVIsIZQIu0Hk4-XaZo85Txhc5yDjlphTnywt-H2AxuXbrTwr-EO-MgNidjPQCUNP7V3X-mcaTxYgbm0Nhmbs5J6zqML8vfu0YQDm3hZSrLrR15tlx_ca4MZdJAJClFmWxOS3e1ApXGK4XZQNctyM3XI3BwTriaxgJnf-FdKbSI7OehOHEzlhTwaPes4yWs3LeTaKStsn5qJc",
];

const categoryIcons = [Wind, HeartPulse, Home, BedDouble, Move3d, Stethoscope];

function l(locale: string, fa: string, en: string, tr: string, ar: string) {
  if (locale === "en") return en;
  if (locale === "tr") return tr;
  if (locale === "ar") return ar;
  return fa;
}

function emptyCopy(locale: string) {
  return {
    title: l(locale, "محصولی در این بخش ثبت نشده است", "No products have been added here yet", "Bu bölüme henüz ürün eklenmedi", "لم تتم إضافة منتجات هنا بعد"),
    body: l(locale, "ساختار فروشگاه آماده است و پس از ثبت محصول واقعی در پنل مدیریت، کارت‌ها به‌صورت خودکار در همین بخش نمایش داده می‌شوند.", "The storefront is ready. Real products added in Admin will appear here automatically.", "Mağaza hazır. Yönetim paneline eklenen gerçek ürünler burada otomatik görünecek.", "المتجر جاهز وستظهر المنتجات الحقيقية المضافة من لوحة الإدارة هنا تلقائياً."),
  };
}

function EmptyProducts({ locale, dark = false }: { locale: string; dark?: boolean }) {
  const text = emptyCopy(locale);
  return (
    <div className={cn("col-span-full flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center", dark ? "border-white/20 bg-white/8 text-white" : "border-[#c4c6d0] bg-[#f7fafd] text-[#001736]")}>
      <PackageSearch className={cn("h-8 w-8", dark ? "text-[#82cfff]" : "text-[#002b5b]")} />
      <strong className="mt-3 text-sm font-black">{text.title}</strong>
      <p className={cn("mt-2 max-w-md text-xs leading-6", dark ? "text-white/65" : "text-[#747780]")}>{text.body}</p>
    </div>
  );
}

export async function ShopContent({ categorySlug, sort, search }: { categorySlug?: string; sort?: ProductSort; search?: string }) {
  const locale = await getLocale();
  const t = await getTranslations("shop");
  const [categories, products] = await Promise.all([getCategories(), getProducts({ categorySlug, sort, search })]);
  const activeCategory = categorySlug ? categories.find((cat) => cat.slug === categorySlug) : null;
  const Arrow = locale === "fa" || locale === "ar" ? ChevronLeft : ChevronRight;

  return (
    <main className="flex-1 bg-[#f7fafd] pb-24 md:pb-0">
      <div className="hidden border-b border-[#e0e3e6] bg-white/92 shadow-sm backdrop-blur lg:block">
        <Container className="flex min-h-14 items-center justify-center gap-1 overflow-x-auto py-2">
          <Link href="/shop" className="shrink-0 rounded-full bg-[#001736] px-4 py-2 text-xs font-black text-white">{l(locale,"همه دسته‌بندی‌ها","All categories","Tüm kategoriler","كل الفئات")}</Link>
          {categories.map((cat) => <Link key={cat.id} href={`/shop/${cat.slug}`} className={cn("shrink-0 rounded-full px-4 py-2 text-xs font-bold transition", categorySlug === cat.slug ? "bg-[#d6e3ff] text-[#001736]" : "text-[#43474f] hover:bg-[#f1f4f7]")}>{localizedName(locale, cat)}</Link>)}
        </Container>
      </div>

      <Container className="pt-5 sm:pt-7">
        <section className="mb-5 lg:hidden">
          <form action={`/${locale}/shop`} method="get" className="relative"><Search className="pointer-events-none absolute end-4 top-1/2 h-6 w-6 -translate-y-1/2 text-[#747780]" /><input name="q" defaultValue={search ?? ""} placeholder={l(locale,"جستجوی تجهیزات پزشکی...","Search medical equipment...","Medikal ekipman ara...","ابحث عن المعدات الطبية...")} className="vitalis-focus h-14 w-full rounded-full border-2 border-[#c4c6d0] bg-transparent px-6 pe-13 text-base font-bold text-[#181c1e] placeholder:text-[#43474f]" /></form>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><Link href="/shop" className={cn("shrink-0 rounded-full border px-5 py-2 text-xs font-black", !categorySlug ? "border-[#002b5b] bg-[#002b5b] text-white" : "border-[#c4c6d0] bg-white text-[#43474f]")}>{l(locale,"همه محصولات","All products","Tüm ürünler","كل المنتجات")}</Link>{categories.slice(0, 5).map((cat) => <Link key={cat.id} href={`/shop/${cat.slug}`} className={cn("shrink-0 rounded-full border px-5 py-2 text-xs font-bold", categorySlug === cat.slug ? "border-[#002b5b] bg-[#002b5b] text-white" : "border-[#c4c6d0] bg-white text-[#43474f]")}>{localizedName(locale,cat)}</Link>)}</div>
        </section>

        <section className="relative hidden min-h-[360px] overflow-hidden rounded-3xl border border-white/20 bg-[#001736] shadow-[0_22px_60px_rgba(0,23,54,.16)] lg:block">
          <Image src={campaignHero} alt="Hyper Doctor campaign" fill priority className="object-cover" sizes="1280px" />
          <div className="absolute inset-0 bg-gradient-to-l from-[#001736]/96 via-[#001736]/62 to-transparent rtl:bg-gradient-to-r" />
          <div className="relative z-10 flex min-h-[360px] max-w-xl flex-col justify-center p-12 text-white"><span className="w-fit rounded-full bg-[#ba0036] px-3 py-1.5 text-[11px] font-black">{l(locale,"کمپین سلامت هایپر دکتر","Hyper Doctor Health Campaign","Hyper Doctor Sağlık Kampanyası","حملة هايبر دكتور الصحية")}</span><h1 className="mt-5 text-4xl font-black leading-[1.35]">{activeCategory ? localizedName(locale, activeCategory) : l(locale,"تجهیزات پزشکی تخصصی؛ انتخاب مطمئن برای مراقبت بهتر","Specialist medical equipment for better care","Daha iyi bakım için uzman medikal ekipman","معدات طبية متخصصة لرعاية أفضل")}</h1><p className="mt-4 text-sm leading-7 text-white/78">{l(locale,"فروشگاه تخصصی تجهیزات تنفسی، مراقبت در منزل، توانبخشی، هتلینگ و تجهیزات تشخیصی با پشتیبانی حرفه‌ای.","Respiratory, home-care, rehabilitation, medical furniture and diagnostic equipment with professional support.","Solunum, evde bakım, rehabilitasyon, medikal mobilya ve tanı ekipmanları profesyonel destekle.","معدات التنفس والرعاية المنزلية وإعادة التأهيل والأثاث الطبي والتشخيص بدعم احترافي.")}</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/contact" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#ba0036] px-5 text-sm font-black text-white">{l(locale,"دریافت مشاوره تخصصی","Get specialist advice","Uzman danışmanlık al","احصل على استشارة متخصصة")}<Arrow className="h-4 w-4" /></Link></div></div>
        </section>

        <section className="py-8 lg:py-11"><div className="mb-6 flex items-end justify-between gap-4"><h2 className="text-2xl font-black text-[#001736] sm:text-3xl">{l(locale,"دسته‌بندی‌های تخصصی تجهیزات پزشکی","Specialist medical equipment categories","Uzman medikal ekipman kategorileri","فئات المعدات الطبية المتخصصة")}</h2><Link href="/shop" className="hidden items-center gap-1 text-xs font-black text-[#ba0036] sm:flex">{l(locale,"مشاهده همه","View all","Tümünü gör","عرض الكل")}<Arrow className="h-4 w-4" /></Link></div><div className="grid grid-cols-3 gap-3 sm:grid-cols-6">{categories.map((cat, index) => { const Icon = categoryIcons[index % categoryIcons.length]; return <Link key={cat.id} href={`/shop/${cat.slug}`} className={cn("group flex min-h-28 flex-col items-center justify-center rounded-2xl border bg-white p-3 text-center shadow-[0_8px_24px_rgba(0,23,54,.045)] transition hover:-translate-y-1", categorySlug === cat.slug ? "border-[#009dd8] ring-2 ring-[#009dd8]/10" : "border-[#e0e3e6]")}><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1f4f7] text-[#001736] transition group-hover:bg-[#001736] group-hover:text-white"><Icon className="h-5 w-5" /></span><strong className="mt-2 line-clamp-2 text-[11px] leading-5 text-[#181c1e] sm:text-xs">{localizedName(locale,cat)}</strong></Link>; })}</div></section>

        <section className="mb-8 grid gap-3 rounded-2xl border border-[#e0e3e6] bg-white p-4 shadow-[0_8px_24px_rgba(0,23,54,.04)] sm:grid-cols-3 sm:p-5">{[[ShieldCheck,l(locale,"تضمین اصالت کالا","Authenticity guaranteed","Orijinallik garantisi","ضمان الأصالة")],[Truck,l(locale,"ارسال سریع و مطمئن","Fast secure delivery","Hızlı güvenli teslimat","توصيل سريع وآمن")],[Headphones,l(locale,"پشتیبانی تخصصی","Specialist support","Uzman destek","دعم متخصص")]].map(([Icon,label]) => { const I = Icon as typeof ShieldCheck; return <div key={String(label)} className="flex items-center justify-center gap-3 rounded-xl bg-[#f7fafd] p-4 text-center"><I className="h-5 w-5 text-[#ba0036]"/><strong className="text-xs text-[#001736]">{label as string}</strong></div>; })}</section>

        {categorySlug ? (
          <section className="pb-12"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black text-[#ba0036]">HYPER DOCTOR STORE</p><h2 className="mt-2 text-2xl font-black text-[#001736] sm:text-3xl">{activeCategory ? localizedName(locale,activeCategory) : t("title")}</h2><p className="mt-1 text-xs text-[#747780]">{products.length} {l(locale,"محصول","products","ürün","منتج")}</p></div><SortSelect /></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{products.length ? products.map((product) => <ShopProductCard key={product.id} product={product} />) : <EmptyProducts locale={locale} />}</div></section>
        ) : (
          <>
            <section className="pb-10 lg:pb-12"><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-3"><Sparkles className="h-6 w-6 text-[#ba0036]"/><h2 className="text-2xl font-black text-[#001736] lg:text-3xl">{products.length ? l(locale,"جدیدترین محصولات افزوده شده","Latest products","Yeni ürünler","أحدث المنتجات") : l(locale,"پیشنهادات ویژه","Special offers","Özel teklifler","عروض خاصة")}</h2></div><Link href="/shop" className="flex items-center gap-1 text-xs font-black text-[#ba0036]">{l(locale,"مشاهده همه","View all","Tümünü gör","عرض الكل")}<Arrow className="h-4 w-4" /></Link></div>{products.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{products.slice(0,4).map((product)=><ShopProductCard key={product.id} product={product}/>)}</div> : <div className="relative min-h-64 overflow-hidden rounded-3xl border border-[#e0e3e6] bg-[#001736] shadow-lg"><Image src={saleBanner} alt="Hyper Doctor special offer" fill className="object-cover opacity-85" sizes="1280px"/><div className="absolute inset-0 bg-gradient-to-t from-[#001736]/80 via-transparent to-transparent"/><div className="absolute inset-x-0 bottom-0 p-6 text-white"><strong className="text-xl font-black">{l(locale,"فروش ویژه تجهیزات پزشکی","Medical equipment special sale","Medikal ekipman özel satışı","تخفيضات المعدات الطبية")}</strong><p className="mt-2 max-w-xl text-xs leading-6 text-white/75">{emptyCopy(locale).body}</p></div></div>}</section>

            <section className="mb-10 overflow-hidden border-y border-[#e0e3e6] bg-white py-6"><div className="grid grid-cols-3 items-center gap-4 text-center text-xl font-black tracking-tight text-[#747780] sm:grid-cols-6 sm:text-2xl">{["Löwenstein","ResMed","PHILIPS","B.Well","JTS","BRISK"].map((brand)=><span key={brand}>{brand}</span>)}</div></section>

            <section className="mb-10 rounded-3xl border border-[#dce2e8] bg-[#eef4f9] p-5 sm:p-7"><div className="flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-center"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#001736] shadow-sm"><GitCompareArrows className="h-5 w-5"/></span><div><h2 className="text-xl font-black text-[#001736]">{l(locale,"مرکز مقایسه کالا","Product comparison center","Ürün karşılaştırma merkezi","مركز مقارنة المنتجات")}</h2><p className="mt-1 text-xs leading-6 text-[#747780]">{l(locale,"تا چهار محصول واقعی را انتخاب کنید و قیمت، موجودی و مشخصات آن‌ها را کنار هم بررسی کنید.","Select up to four real products and compare price, stock and specifications side by side.","En fazla dört gerçek ürünü seçip fiyat, stok ve özellikleri yan yana karşılaştırın.","اختر حتى أربعة منتجات حقيقية وقارن السعر والمخزون والمواصفات جنباً إلى جنب.")}</p></div></div><Link href="/compare" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#001736] px-5 text-xs font-black text-white">{l(locale,"باز کردن مقایسه","Open comparison","Karşılaştırmayı aç","فتح المقارنة")}<Arrow className="h-4 w-4"/></Link></div></section>

            <div className="space-y-8">{categories.slice(0,5).map((cat,index)=>{ const railProducts = products.filter((product)=>product.categoryId===cat.id).slice(0,4); const Icon = categoryIcons[index % categoryIcons.length]; return <section key={cat.id} className="relative overflow-hidden rounded-3xl bg-[#001736] p-5 text-white shadow-[0_20px_48px_rgba(0,23,54,.16)] sm:p-7"><div className="absolute inset-0 bg-cover bg-center opacity-24" style={{backgroundImage:`linear-gradient(rgba(0,23,54,.75),rgba(0,23,54,.75)),url('${categoryBackdrops[index % categoryBackdrops.length]}')`}}/><div className="relative z-10"><div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/12 text-[#82cfff] backdrop-blur"><Icon className="h-5 w-5"/></span><div><h2 className="text-xl font-black sm:text-2xl">{localizedName(locale,cat)}</h2><p className="mt-1 text-[11px] text-white/62">{l(locale,"منتخب تجهیزات این دسته","Selected equipment","Seçili ekipmanlar","معدات مختارة")}</p></div></div><Link href={`/shop/${cat.slug}`} className="inline-flex items-center gap-1 text-xs font-black text-[#82cfff]">{l(locale,"مشاهده همه","View all","Tümünü gör","عرض الكل")}<Arrow className="h-4 w-4"/></Link></div><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{railProducts.length ? railProducts.map((product)=><ShopProductCard key={product.id} product={product} compact/>) : <EmptyProducts locale={locale} dark/>}</div></div></section>; })}</div>

            <section className="relative my-10 overflow-hidden rounded-3xl bg-[#001736] text-white shadow-xl"><Image src={saleBanner} alt="VIP respiratory equipment" fill className="object-cover opacity-45" sizes="1280px"/><div className="absolute inset-0 bg-gradient-to-r from-[#001736]/95 via-[#001736]/72 to-[#ba0036]/35 rtl:bg-gradient-to-l"/><div className="relative z-10 flex min-h-64 flex-col justify-center p-7 sm:p-10"><span className="flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black"><Crown className="h-4 w-4 text-[#82cfff]"/>{l(locale,"تجهیزات تنفسی رده VIP","VIP respiratory equipment","VIP solunum ekipmanları","معدات تنفس VIP")}</span><h2 className="mt-4 max-w-2xl text-2xl font-black leading-10 sm:text-3xl">{l(locale,"پیشنهادهای ویژه برای تجهیزات تخصصی و حرفه‌ای","Special offers for specialist professional equipment","Uzman ve profesyonel ekipmanlar için özel teklifler","عروض خاصة للمعدات الاحترافية المتخصصة")}</h2><Link href="/shop/respiratory" className="mt-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-[#ba0036] px-5 text-xs font-black text-white">{l(locale,"مشاهده محصولات","View products","Ürünleri gör","عرض المنتجات")}<Arrow className="h-4 w-4"/></Link></div></section>
          </>
        )}

        <section className="mb-10"><h2 className="mb-5 text-center text-2xl font-black text-[#001736]">{l(locale,"خدمات ویژه هایپر دکتر","Hyper Doctor specialist services","Hyper Doctor uzman hizmetleri","خدمات هايبر دكتور المتخصصة")}</h2><div className="grid gap-3 sm:grid-cols-3">{[[Wrench,l(locale,"نصب و راه‌اندازی تخصصی","Specialist installation","Uzman kurulum","تركيب متخصص")],[Activity,l(locale,"سرویس دوره‌ای و نگهداری","Periodic maintenance","Periyodik bakım","الصيانة الدورية")],[Stethoscope,l(locale,"تعمیرات تخصصی","Specialist repair","Uzman onarım","إصلاح متخصص")]].map(([Icon,label])=>{const I=Icon as typeof Wrench;return <Link key={String(label)} href="/services" className="rounded-2xl border border-[#e0e3e6] bg-white p-6 text-center shadow-[0_8px_24px_rgba(0,23,54,.045)] transition hover:-translate-y-1"><I className="mx-auto h-7 w-7 text-[#002b5b]"/><h3 className="mt-3 text-sm font-black text-[#001736]">{label as string}</h3><p className="mt-2 text-xs leading-6 text-[#747780]">{l(locale,"ارائه خدمات حرفه‌ای با هماهنگی تیم پشتیبانی.","Professional service coordinated by our support team.","Destek ekibimizle koordineli profesyonel hizmet.","خدمة احترافية بالتنسيق مع فريق الدعم.")}</p></Link>;})}</div></section>
      </Container>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#dfe4e9] bg-white/96 px-2 py-2 shadow-[0_-12px_34px_rgba(0,23,54,.09)] backdrop-blur md:hidden" aria-label={l(locale,"ناوبری فروشگاه","Shop mobile navigation","Mağaza mobil menüsü","تنقل المتجر على الهاتف")}>
        <Link href="/" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-bold text-[#43474f]"><Home className="h-5 w-5"/><span>{l(locale,"خانه","Home","Ana Sayfa","الرئيسية")}</span></Link>
        <Link href="/shop" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-black text-[#ba0036]"><LayoutGrid className="h-5 w-5"/><span>{l(locale,"دسته‌بندی‌ها","Categories","Kategoriler","الفئات")}</span></Link>
        <Link href="/services" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-bold text-[#43474f]"><Wind className="h-5 w-5"/><span>{l(locale,"خدمات","Services","Hizmetler","الخدمات")}</span></Link>
        <Link href="/account" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-bold text-[#43474f]"><UserRound className="h-5 w-5"/><span>{l(locale,"حساب کاربری","Profile","Profil","الحساب")}</span></Link>
      </nav>
    </main>
  );
}
