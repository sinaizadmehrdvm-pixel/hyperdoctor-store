import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/site/product-card";
import { SortSelect } from "@/components/site/shop-filters";
import { getCategories, getProducts, type ProductSort } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { localizedName } from "@/lib/i18n-content";
import {
  BedDouble,
  HeartPulse,
  Home,
  LayoutGrid,
  Move3d,
  PackageSearch,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  UserRound,
  Wind,
} from "lucide-react";

const stitchSaleBanner =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB-41yc4qDncZhkP2v8LZpcQt4uaUBOKfHUPCeP1j9HtT8WzzVrN1m6IdP_EgEUTImBm3dx9k9AhSvAjFu4ena6BATVBuEXMdx0dcSxcy6S0ZM5N1ls05OTnycV-nNfasyAUZMP7xI7QgNX-VrCXpjX4n2Hud93gNyXKT_vnHxx57hWP1GAdYMrMH-nr4DPyrzzfvLcrzJbPHCzrg0ZeLHoU-g26hEdbkZXScPnQtinBAGPaVpu4QKvHA";

const stitchMedicalHero =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBkGAIWD_2Ir4YxcY60tSJPB-IR4fXygjHFVd9JnXWxpeZOZRMkj-7ds_DII_V05OsBnpKDZyLlvePJGbRasGpY6BrkMgYXdYCPUjxyhNH7GIreHkFFj5XtTrpYFINQXnuM47PBpgh6ePiC3UpdbrcAEn6gJ3WRIh5LjfvbRMRiJEmerf8foDZvCa6eD86sJjKHv1Q9BY82kFJmj8sbyO7am92wowHDlD9oErfaMfym77hKPkWuH7bP5Q";

const categoryIcons = [Wind, Home, Move3d, BedDouble, HeartPulse, Stethoscope];

function copy(locale: string) {
  const isFa = locale === "fa";
  const isTr = locale === "tr";
  const isAr = locale === "ar";

  return {
    heroEyebrow: isFa
      ? "فروشگاه تخصصی تجهیزات پزشکی"
      : isTr
        ? "Uzman Medikal Ekipman Mağazası"
        : isAr
          ? "متجر المعدات الطبية المتخصص"
          : "Specialist Medical Equipment Store",
    heroTitle: isFa
      ? "تجهیزات پزشکی تخصصی؛ ضامن سلامتی شما"
      : isTr
        ? "Uzman tıbbi ekipman; sağlığınız için güvenilir seçim"
        : isAr
          ? "معدات طبية متخصصة؛ خيار موثوق لصحتك"
          : "Specialist medical equipment, selected for better care",
    heroBody: isFa
      ? "تجهیزات تنفسی، مراقبت در منزل، توانبخشی و اقلام تخصصی را با ساختار دقیق دسته‌بندی و پشتیبانی هایپر دکتر پیدا کنید."
      : isTr
        ? "Solunum, evde bakım, rehabilitasyon ve uzman ekipmanları düzenli kategoriler ve Hyper Doctor desteğiyle keşfedin."
        : isAr
          ? "اكتشف معدات التنفس والرعاية المنزلية وإعادة التأهيل ضمن فئات دقيقة وبدعم Hyper Doctor."
          : "Discover respiratory, home-care, rehabilitation and specialist equipment with structured categories and Hyper Doctor support.",
    categories: isFa ? "دسته‌بندی‌های تخصصی تجهیزات پزشکی" : isTr ? "Uzman ekipman kategorileri" : isAr ? "فئات المعدات المتخصصة" : "Specialist equipment categories",
    latest: isFa ? "جدیدترین محصولات افزوده شده" : isTr ? "Yeni eklenen ürünler" : isAr ? "أحدث المنتجات المضافة" : "Latest products",
    offer: isFa ? "پیشنهادات ویژه" : isTr ? "Özel teklifler" : isAr ? "عروض خاصة" : "Special offers",
    brands: isFa ? "برندهای منتخب" : isTr ? "Seçili markalar" : isAr ? "علامات مختارة" : "Selected brands",
    emptyTitle: isFa ? "کاتالوگ محصولات آماده دریافت داده است" : isTr ? "Ürün kataloğu veri almaya hazır" : isAr ? "كتالوج المنتجات جاهز لاستقبال البيانات" : "Product catalog is ready for data",
    emptyBody: isFa ? "دسته‌بندی‌ها فعال هستند. به محض ثبت محصولات واقعی در پنل مدیریت، همین بخش با کارت‌های طراحی Stitch تکمیل می‌شود." : isTr ? "Kategoriler aktif. Gerçek ürünler yönetim paneline eklendiğinde bu alan Stitch kartlarıyla otomatik dolacak." : isAr ? "الفئات فعالة. بعد إضافة المنتجات الحقيقية من لوحة الإدارة سيظهر الكتالوج هنا تلقائياً." : "Categories are live. As soon as real products are added in Admin, this area will populate automatically using the Stitch product cards.",
    all: isFa ? "همه محصولات" : isTr ? "Tüm ürünler" : isAr ? "كل المنتجات" : "All products",
    viewAll: isFa ? "مشاهده همه" : isTr ? "Tümünü gör" : isAr ? "عرض الكل" : "View all",
    guarantee: isFa ? "خدمات ویژه هایپر دکتر" : isTr ? "Hyper Doctor güvencesi" : isAr ? "مزايا Hyper Doctor" : "Hyper Doctor assurance",
  };
}

export async function ShopContent({
  categorySlug,
  sort,
  search,
}: {
  categorySlug?: string;
  sort?: ProductSort;
  search?: string;
}) {
  const locale = await getLocale();
  const t = await getTranslations("shop");
  const text = copy(locale);

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug, sort, search }),
  ]);

  return (
    <main className="flex-1 bg-[#f7fafd] pb-24 md:pb-0">
      <Container className="pt-5 sm:pt-8">
        {/* Desktop Stitch 03 / 46 hero, compacted responsively for mobile */}
        <section className="relative overflow-hidden rounded-[1.6rem] border border-[#c4c6d0]/60 bg-[#001736] shadow-[0_22px_60px_rgba(0,23,54,.14)]">
          <Image
            src={stitchMedicalHero}
            alt=""
            fill
            priority
            className="object-cover opacity-30"
            sizes="(min-width: 1024px) 1280px, 100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,23,54,.98)_0%,rgba(0,43,91,.90)_48%,rgba(0,23,54,.30)_100%)] rtl:bg-[linear-gradient(270deg,rgba(0,23,54,.98)_0%,rgba(0,43,91,.90)_48%,rgba(0,23,54,.30)_100%)]" />
          <div className="relative z-10 grid min-h-[290px] items-center gap-8 px-6 py-9 sm:px-10 lg:grid-cols-[1fr_.75fr] lg:px-14 lg:py-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold tracking-wide text-[#a9c7ff] backdrop-blur">
                <ShieldCheck className="h-4 w-4" />
                {text.heroEyebrow}
              </div>
              <h1 className="mt-5 text-3xl font-black leading-[1.35] text-white sm:text-4xl lg:text-5xl">
                {categorySlug
                  ? localizedName(locale, categories.find((cat) => cat.slug === categorySlug) ?? { nameFa: text.heroTitle, nameEn: text.heroTitle })
                  : text.heroTitle}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#d6e3ff]/85 sm:text-base">
                {text.heroBody}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/shop" className="vitalis-focus inline-flex min-h-12 items-center justify-center rounded-xl bg-[#ba0036] px-6 text-sm font-black text-white shadow-[0_10px_24px_rgba(186,0,54,.25)] hover:bg-[#e80346]">
                  {text.all}
                </Link>
                <Link href="/services" className="vitalis-focus inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur hover:bg-white/15">
                  {locale === "fa" ? "خدمات تخصصی" : locale === "tr" ? "Uzman hizmetler" : locale === "ar" ? "الخدمات المتخصصة" : "Specialist services"}
                </Link>
              </div>
            </div>
            <div className="hidden justify-end lg:flex">
              <div className="relative h-48 w-full max-w-[390px] overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-2xl">
                <Image src={stitchSaleBanner} alt="Hyper Doctor medical equipment" fill className="object-cover" sizes="390px" />
              </div>
            </div>
          </div>
        </section>

        {/* Search + quick chips. Mirrors the mobile Stitch 16 interaction model. */}
        <section className="mt-5 rounded-3xl border border-[#c4c6d0]/70 bg-white/90 p-4 shadow-[0_14px_40px_rgba(0,23,54,.06)] backdrop-blur sm:p-5">
          <form action={`/${locale}/shop`} method="get" className="flex flex-col gap-3 md:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">{t("title")}</span>
              <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#747780]" aria-hidden="true" />
              <input
                name="q"
                defaultValue={search ?? ""}
                placeholder={locale === "fa" ? "جستجوی تجهیزات پزشکی..." : locale === "tr" ? "Medikal ekipman ara..." : locale === "ar" ? "ابحث عن المعدات الطبية..." : "Search medical equipment..."}
                className="vitalis-focus h-13 w-full rounded-2xl border border-[#c4c6d0] bg-[#f7fafd] ps-12 pe-4 text-sm font-medium text-[#181c1e] placeholder:text-[#747780]"
              />
            </label>
            <button className="vitalis-focus h-13 rounded-2xl bg-[#001736] px-7 text-sm font-black text-white hover:bg-[#002b5b]">
              {locale === "fa" ? "جستجو" : locale === "tr" ? "Ara" : locale === "ar" ? "بحث" : "Search"}
            </button>
          </form>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href="/shop"
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-xs font-black transition",
                !categorySlug ? "border-[#001736] bg-[#001736] text-white" : "border-[#c4c6d0] bg-white text-[#43474f]",
              )}
            >
              {text.all}
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop/${cat.slug}`}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition",
                  categorySlug === cat.slug ? "border-[#001736] bg-[#001736] text-white" : "border-[#c4c6d0] bg-white text-[#43474f] hover:border-[#009dd8]",
                )}
              >
                {localizedName(locale, cat)}
              </Link>
            ))}
          </div>
        </section>

        {/* Category grid */}
        <section className="py-11 sm:py-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#ba0036]">Hyper Doctor Store</p>
              <h2 className="mt-2 text-2xl font-black text-[#001736] sm:text-3xl">{text.categories}</h2>
            </div>
            <span className="hidden text-xs font-medium text-[#747780] sm:block">{categories.length} categories</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((cat, index) => {
              const Icon = categoryIcons[index % categoryIcons.length];
              return (
                <Link
                  key={cat.id}
                  href={`/shop/${cat.slug}`}
                  className={cn(
                    "group vitalis-interactive flex min-h-36 flex-col items-center justify-center rounded-2xl border bg-white p-4 text-center shadow-[0_10px_28px_rgba(0,23,54,.045)]",
                    categorySlug === cat.slug ? "border-[#009dd8] ring-2 ring-[#009dd8]/10" : "border-[#e0e3e6]",
                  )}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#001736] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.12)] transition group-hover:bg-[#ba0036]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <strong className="mt-3 line-clamp-2 text-sm leading-6 text-[#181c1e]">{localizedName(locale, cat)}</strong>
                  <span className="mt-1 text-[11px] text-[#747780]">{cat._count.products} {locale === "fa" ? "کالا" : "items"}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Stitch brand rail */}
        <section className="rounded-2xl border border-[#e0e3e6] bg-white px-5 py-5 shadow-[0_8px_25px_rgba(0,23,54,.035)] sm:px-8">
          <p className="mb-4 text-center text-xs font-bold text-[#747780]">{text.brands}</p>
          <div className="grid grid-cols-3 items-center gap-5 text-center text-xl font-black tracking-tight text-[#001736]/65 sm:grid-cols-6 sm:text-2xl">
            {['B.Well', 'Brisk', 'JTS', 'ResMed', 'PHILIPS', 'Löwenstein'].map((brand) => (
              <span key={brand}>{brand}</span>
            ))}
          </div>
        </section>

        {/* Products */}
        <section className="py-11 sm:py-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffdada] text-[#ba0036]">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-black text-[#001736] sm:text-3xl">{categorySlug ? localizedName(locale, categories.find((cat) => cat.slug === categorySlug) ?? { nameFa: text.latest, nameEn: text.latest }) : text.latest}</h2>
                <p className="mt-1 text-xs text-[#747780]">{products.length} {locale === "fa" ? "محصول" : "products"}</p>
              </div>
            </div>
            <SortSelect />
          </div>

          {products.length === 0 ? (
            <div className="grid overflow-hidden rounded-3xl border border-[#dfe4ea] bg-white shadow-[0_18px_50px_rgba(0,23,54,.055)] lg:grid-cols-[.85fr_1.15fr]">
              <div className="relative min-h-64 overflow-hidden bg-[#001736]">
                <Image src={stitchSaleBanner} alt="" fill className="object-cover opacity-75" sizes="(min-width: 1024px) 40vw, 100vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001736]/80 to-transparent" />
              </div>
              <div className="flex min-h-64 flex-col justify-center p-7 sm:p-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d6e3ff] text-[#001736]">
                  <PackageSearch className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-black text-[#001736] sm:text-2xl">{text.emptyTitle}</h3>
                <p className="mt-3 max-w-xl text-sm leading-7 text-[#43474f]">{text.emptyBody}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>

        {/* Trust/service strip from Stitch 03 */}
        <section className="mb-12 overflow-hidden rounded-3xl bg-[#001736] px-5 py-8 text-white sm:px-8 lg:px-10">
          <div className="mb-6 flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-[#82cfff]" />
            <h2 className="text-xl font-black sm:text-2xl">{text.guarantee}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              [ShieldCheck, locale === "fa" ? "تضمین اصالت کالا" : "Authenticity guarantee"],
              [ShoppingCart, locale === "fa" ? "خرید و پرداخت امن" : "Secure purchase"],
              [Stethoscope, locale === "fa" ? "مشاوره تخصصی" : "Specialist guidance"],
            ].map(([Icon, label]) => {
              const TrustIcon = Icon as typeof ShieldCheck;
              return (
                <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/8 p-5 backdrop-blur">
                  <TrustIcon className="h-5 w-5 text-[#82cfff]" />
                  <p className="mt-3 text-sm font-bold">{String(label)}</p>
                </div>
              );
            })}
          </div>
        </section>
      </Container>

      {/* Mobile bottom navigation inspired directly by Stitch 16. */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#e0e3e6] bg-white/95 px-2 py-2 shadow-[0_-10px_35px_rgba(0,23,54,.08)] backdrop-blur md:hidden" aria-label="Shop mobile navigation">
        <Link href="/" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-bold text-[#43474f]"><Home className="h-5 w-5" /><span>Home</span></Link>
        <Link href="/shop" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-black text-[#ba0036]"><LayoutGrid className="h-5 w-5" /><span>Categories</span></Link>
        <Link href="/services" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-bold text-[#43474f]"><Wind className="h-5 w-5" /><span>Services</span></Link>
        <Link href="/" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-bold text-[#43474f]"><UserRound className="h-5 w-5" /><span>Profile</span></Link>
      </nav>
    </main>
  );
}
