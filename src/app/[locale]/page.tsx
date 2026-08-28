import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Award,
  BedDouble,
  BookOpen,
  HeartPulse,
  Home,
  Moon,
  PackageCheck,
  PhoneCall,
  ShieldCheck,
  Stethoscope,
  Wind,
  Wrench,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/site/product-card";
import { getCategories, getFeaturedProducts, getServices } from "@/lib/queries";
import { localizedName } from "@/lib/i18n-content";

const heroImages = [
  "https://lh3.googleusercontent.com/aida/AEtjO1VC6t4iFUrfae_7NcCqB0TIqQbzLSZ6nODmcWW2GVJVmSFEGhPKcuMDYU2k9gqq3IGuZ12wjOSyucMDakW_DtSniZBAAozoWfSSeFI20ymMmDT7oCasm2obDDxLtZPw4syLsu5lUSHWIm-8p_aMLFrbe25_3kqdSEs1oWQ5B0_8Dy_5Rvnxhbq3J8iC-VStAyQ5PEXw1Y-NSl4F6w_BpLsq3oya711hWgA1UDtKRR3rbimDfLS-evOl_G5P",
  "https://lh3.googleusercontent.com/aida/AEtjO1VZXQaHxq0cucYGjO2aJMCwei5iB6U7BygzHS58LaeLzkQaJoSlHSVLzbm1fkkoI--I57i4aFUKtXtK0CtxYBu6e0esQSs9BbRFv-fEo2rH9rQT7s7vootAhGJpBkhAT-ZykKUYspzU29S8ufSbrOLxIVO3tH4-HFaorv37SrRivm8cmvakTQea5qq0eKFAioDtrm-T2Kykpb3MdJHMdZp8q6zQD-50a8GQ2SbWVYEtWa-ciHPxrDsiZTTS",
  "https://lh3.googleusercontent.com/aida/AEtjO1UfB6MtDGxXHaUnu5Ii0FuGEb-310oZGVU9-PYgkTcYmo4OzsO1ZDXJvseXHRYGMwSPiGCEa8Uk4y4Fps4nh2iq-qPXQJgQ8giWKBiCwf6X9ypYszQ8YYLGDZ_5S15X2S-M9vIqHHAKJhXac01wDZLcklvdasVYxV22YeE84MsmwE-taQZk4GWufDl71nmxm0iKe6KnpvfGCA04ExxDYYrJnnfa0SrA03s_a6vkw5-3DNuqlXKtUqSz50sB",
  "https://lh3.googleusercontent.com/aida/AEtjO1XL82opuiRfYpqdSJZZszPpuLu_lbCzuwV4hs3iAW9wU8pdyGWRupF40lKhv_0cupTCKXRQWtriWjnNpcpenEpPW-mS0HFMsQtX_0lcHDoofE7bxyQRiGk3mkimr0EL13QIK_Q5aLW6MbApiir4m9NS7avLz7xvCT-1SZXsdVmJUIqGzy-DELZgSJrHi1SgRQ9qDS4yh00cL2LOfbAEfInUpuaZBKTxQnHT-aGZ1_Ak7zwucaGLuicjPY_D",
  "https://lh3.googleusercontent.com/aida/AEtjO1U09zDbEBU1WmeRCi5oaVl66sSBkZuzm4cvBY6ihNfp64UHr3CgcD46PFRsYLoGC6C2gkiorB2lmqxJ_KCnulgF7EnasPwIl5IwfDDXBI-g5Nh-dUlc1lTkmSPd_w9NyUDCjlGVFiFIWTqcElB_mvUo4kPLefAbHj1XolU0WhP9-AbWqvIztzU1-CF6pP_YIjHm9Toz4u0btBF08ElVrTy59gQXpnLHX0YWmNhllPdkMgxLKdb2X7VolmRq",
  "https://lh3.googleusercontent.com/aida/AEtjO1U1Zzri1WAPPMaApZwWUjBtEJW5tGj5LaUw6tMiH5OTgSYg8ZfC4gJTbkxWExkAYdo8Ut5lmTeyjYP4hCyF80ZFXKpNPsLqMrvI1e8xxrMV3W3pTwzZIwRkH28eyFZsAcTSKYVihv1z2qxCiHZlLj0IiOrUCKbiD3B7iaN_FLz4zPvLuAg2hZrJ2gvgqG1RGfzce79WnG0OA6gwCRMZ8PXjXsrId6L-BN0_e8LSABBuzpopv_4NLQnNiPVC",
];

function l(locale: string, fa: string, en: string, tr: string, ar: string) {
  if (locale === "en") return en;
  if (locale === "tr") return tr;
  if (locale === "ar") return ar;
  return fa;
}

const equipmentIcons = [Activity, HeartPulse, Wind, Home, BedDouble, Stethoscope];
const serviceIcons = [Moon, Wind, Wrench, PhoneCall];

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations("home");
  const Arrow = locale === "fa" || locale === "ar" ? ArrowLeft : ArrowRight;
  const [categories, featured, services] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
    getServices(),
  ]);

  const heroSlides = [
    {
      title: l(locale, "هایپر دکتر", "Hyper Doctor", "Hyper Doctor", "هايبر دكتور"),
      accent: l(locale, "تکنولوژی در خدمت سلامت", "Technology serving health", "Sağlık için teknoloji", "التكنولوجيا في خدمة الصحة"),
      body: l(locale, "ارائه‌دهنده تجهیزات پزشکی و خدمات تخصصی تنفسی با استانداردهای حرفه‌ای.", "Professional medical equipment and respiratory-care solutions.", "Profesyonel medikal ekipman ve solunum çözümleri.", "حلول احترافية للمعدات الطبية والعناية التنفسية."),
      primary: l(locale, "دریافت مشاوره", "Get consultation", "Danışmanlık al", "احصل على استشارة"),
      secondary: t("heroCtaShop"),
      primaryHref: "/contact",
      secondaryHref: "/shop",
    },
    {
      title: l(locale, "فروشگاه", "Medical store", "Medikal mağaza", "المتجر الطبي"),
      accent: l(locale, "تجهیزات پزشکی", "Medical Equipment", "Medikal Ekipman", "المعدات الطبية"),
      body: l(locale, "مجموعه‌ای کامل از تجهیزات پایش سلامت، مراقبت در منزل و تجهیزات تخصصی.", "A complete collection of monitoring, home-care and specialist equipment.", "Takip, evde bakım ve uzman ekipmanlardan oluşan kapsamlı koleksiyon.", "مجموعة متكاملة من معدات المراقبة والرعاية المنزلية والتخصصية."),
      primary: l(locale, "مشاهده فروشگاه", "Explore shop", "Mağazayı keşfet", "تصفح المتجر"),
      secondary: l(locale, "مشاوره تخصصی", "Specialist advice", "Uzman danışmanlık", "استشارة متخصصة"),
      primaryHref: "/shop",
      secondaryHref: "/contact",
    },
    {
      title: l(locale, "تجهیزات تخصصی", "Specialist", "Uzman", "معدات"),
      accent: l(locale, "تنفسی پیشرفته", "Respiratory Equipment", "Solunum Ekipmanları", "تنفسية متقدمة"),
      body: l(locale, "CPAP، BiPAP، اکسیژن‌ساز و تجهیزات تنفسی برای خانه و مراکز درمانی.", "CPAP, BiPAP, oxygen concentrators and respiratory devices for home and clinic.", "Ev ve klinik için CPAP, BiPAP, oksijen konsantratörleri ve solunum cihazları.", "أجهزة CPAP وBiPAP ومكثفات الأكسجين للاستخدام المنزلي والسريري."),
      primary: t("heroCtaShop"),
      secondary: t("heroCtaServices"),
      primaryHref: "/shop/respiratory",
      secondaryHref: "/booking",
    },
    {
      title: l(locale, "خدمات تخصصی", "Specialist", "Uzman", "خدمات"),
      accent: l(locale, "خواب و تنفس", "Sleep & Respiratory Services", "Uyku ve Solunum Hizmetleri", "النوم والتنفس"),
      body: l(locale, "تست خواب، تیتراسیون، اکسیژن‌درمانی و پشتیبانی تخصصی با فرآیند استاندارد.", "Sleep testing, titration, oxygen therapy and specialist support.", "Uyku testi, titrasyon, oksijen tedavisi ve uzman desteği.", "اختبارات النوم والمعايرة والعلاج بالأكسجين والدعم المتخصص."),
      primary: t("heroCtaServices"),
      secondary: l(locale, "مشاهده خدمات", "View services", "Hizmetleri gör", "عرض الخدمات"),
      primaryHref: "/booking",
      secondaryHref: "/services",
    },
    {
      title: l(locale, "مقالات علمی", "Scientific", "Bilimsel", "مقالات"),
      accent: l(locale, "دانش سلامت", "Health Knowledge", "Sağlık Bilgisi", "المعرفة الصحية"),
      body: l(locale, "راهنمای تجهیزات، مراقبت تنفسی و مطالب علمی کاربردی برای تصمیم‌گیری بهتر.", "Equipment guides, respiratory-care knowledge and practical clinical articles.", "Ekipman rehberleri, solunum bakımı bilgisi ve pratik klinik içerikler.", "أدلة المعدات ومعرفة الرعاية التنفسية والمحتوى السريري العملي."),
      primary: l(locale, "مطالعه مقالات", "Read articles", "Makaleleri oku", "اقرأ المقالات"),
      secondary: l(locale, "دانش سلامت", "Health library", "Sağlık kütüphanesi", "مكتبة الصحة"),
      primaryHref: "/articles",
      secondaryHref: "/articles",
    },
    {
      title: l(locale, "درباره ما", "About", "Hakkımızda", "من نحن"),
      accent: l(locale, "تعهد به سلامت شما", "Committed to your care", "Sağlığınıza bağlıyız", "ملتزمون برعايتكم"),
      body: l(locale, "تجربه تخصصی در توزیع تجهیزات پزشکی و ارائه خدمات حرفه‌ای سلامت.", "Specialist experience in medical-equipment distribution and healthcare services.", "Medikal ekipman dağıtımı ve sağlık hizmetlerinde uzman deneyim.", "خبرة متخصصة في توزيع المعدات الطبية وخدمات الرعاية الصحية."),
      primary: l(locale, "آشنایی با ما", "About Hyper Doctor", "Hyper Doctor'ı tanıyın", "تعرف علينا"),
      secondary: l(locale, "تماس با ما", "Contact us", "Bize ulaşın", "اتصل بنا"),
      primaryHref: "/about",
      secondaryHref: "/contact",
    },
  ];

  const articleCards = [
    l(locale, "راهنمای انتخاب تجهیزات تنفسی مناسب", "Choosing the right respiratory equipment", "Doğru solunum ekipmanını seçme rehberi", "دليل اختيار معدات التنفس المناسبة"),
    l(locale, "اهمیت تست خواب در تشخیص اختلالات تنفسی", "Why sleep testing matters in respiratory diagnosis", "Solunum tanısında uyku testinin önemi", "أهمية اختبار النوم في تشخيص اضطرابات التنفس"),
    l(locale, "مراقبت و نگهداری صحیح از تجهیزات پزشکی", "How to maintain medical equipment correctly", "Medikal ekipmanların doğru bakımı", "الصيانة الصحيحة للمعدات الطبية"),
  ];

  const faqs = [
    l(locale, "چگونه برای خرید تجهیزات مشاوره بگیرم؟", "How can I get purchasing advice?", "Satın alma danışmanlığı nasıl alabilirim?", "كيف أحصل على استشارة للشراء؟"),
    l(locale, "شرایط گارانتی و خدمات پس از فروش چگونه است؟", "How do warranty and after-sales services work?", "Garanti ve satış sonrası hizmetler nasıl çalışır?", "كيف تعمل خدمات الضمان وما بعد البيع؟"),
    l(locale, "آیا خدمات خواب و تنفس نیاز به رزرو دارد؟", "Do sleep and respiratory services require booking?", "Uyku ve solunum hizmetleri için rezervasyon gerekir mi?", "هل تتطلب خدمات النوم والتنفس حجزاً؟"),
    l(locale, "چطور مناسب‌ترین دستگاه را انتخاب کنم؟", "How do I choose the right device?", "En uygun cihazı nasıl seçerim?", "كيف أختار الجهاز الأنسب؟"),
  ];

  return (
    <main className="stitch-page-shell flex-1 pb-16">
      <Container className="pt-5 sm:pt-8">
        <section className="stitch-home-stage relative mb-14 h-[58vh] min-h-[440px] overflow-hidden rounded-3xl border border-white/40 bg-black/5 shadow-xl sm:mb-20 sm:h-[65vh]">
          {heroSlides.map((slide, index) => (
            <div key={slide.accent} className={`stitch-hero-slide stitch-slide-${index + 1}`} style={{ backgroundImage: `url('${heroImages[index]}')`, opacity: index === 0 ? 1 : 0 }}>
              <div className="stitch-hero-overlay" />
              <div className="absolute inset-0 z-10 flex items-center justify-center px-5 text-center sm:px-10">
                <div className="max-w-2xl rounded-3xl p-4 text-white sm:p-8">
                  <h1 className="text-4xl font-black leading-tight sm:text-5xl">{slide.title}<br /><span className="text-[#82cfff]">{slide.accent}</span></h1>
                  <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/90 sm:text-lg sm:leading-8">{slide.body}</p>
                  <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link href={slide.primaryHref} className="stitch-button stitch-button-primary">{slide.primary}<Arrow className="h-4 w-4" /></Link>
                    <Link href={slide.secondaryHref} className="stitch-button stitch-button-ghost">{slide.secondary}</Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="stitch-logo-strip mb-14 sm:mb-20" aria-label="Brands">
          <div className="stitch-logo-track text-sm font-black tracking-wide text-[#43474f]">{["B.Well", "JTS", "BRISK", "Ehyagostar", "Hooshmand", "B.Well", "JTS", "BRISK", "Ehyagostar", "Hooshmand"].map((brand, i) => <span key={`${brand}-${i}`} className="min-w-24 text-center opacity-75">{brand}</span>)}</div>
        </section>

        <section className="mb-16 sm:mb-20">
          <h2 className="stitch-section-title">{l(locale, "تجهیزات پزشکی", "Medical Equipment", "Medikal Ekipman", "المعدات الطبية")}</h2>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category, index) => { const Icon = equipmentIcons[index % equipmentIcons.length]; return <Link key={category.id} href={`/shop/${category.slug}`} className="stitch-soft-card group flex min-h-32 flex-col items-center justify-center gap-3 p-4 text-center"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d6e3ff] text-[#001736] group-hover:bg-[#001736] group-hover:text-white"><Icon className="h-5 w-5" /></span><span className="text-xs font-bold leading-6 text-[#181c1e] sm:text-sm">{localizedName(locale, category)}</span></Link>; })}
          </div>
        </section>

        <section className="mb-16 sm:mb-20" id="services">
          <h2 className="stitch-section-title">{l(locale, "خدمات تخصصی", "Specialist Services", "Uzman Hizmetler", "الخدمات المتخصصة")}</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.slice(0, 4).map((service, index) => { const Icon = serviceIcons[index % serviceIcons.length]; return <Link key={service.id} href={`/services/${service.slug}`} className="stitch-soft-card overflow-hidden"><div className="relative h-36 bg-gradient-to-br from-[#d6e3ff] via-[#f1f4f7] to-[#c6e7ff]"><div className="absolute inset-0 flex items-center justify-center"><Icon className="h-12 w-12 text-[#002b5b]" /></div></div><div className="p-5"><h3 className="font-black text-[#181c1e]">{localizedName(locale, service)}</h3><p className="mt-2 line-clamp-2 text-xs leading-6 text-[#43474f]">{l(locale, "ارائه خدمت تخصصی با فرآیند استاندارد و پشتیبانی تیم هایپر دکتر.", "Specialist care with a standardized workflow and Hyper Doctor support.", "Standart süreç ve Hyper Doctor desteğiyle uzman hizmet.", "رعاية متخصصة بمسار معياري ودعم فريق هايبر دكتور.")}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#002b5b]">{l(locale, "جزئیات بیشتر", "Learn more", "Detaylar", "المزيد")}<Arrow className="h-3.5 w-3.5" /></span></div></Link>; })}
          </div>
        </section>

        {featured.length > 0 ? <section className="mb-16 sm:mb-20"><div className="flex items-end justify-between gap-4"><h2 className="stitch-section-title text-start">{t("featuredTitle")}</h2><Link href="/shop" className="text-sm font-bold text-[#002b5b]">{t("heroCtaShop")}</Link></div><div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div></section> : null}

        <section className="stitch-dark-feature mb-16 grid overflow-hidden lg:grid-cols-2 lg:items-stretch sm:mb-20" id="about">
          <div className="order-2 p-7 sm:p-10 lg:order-1 lg:p-14"><span className="inline-flex rounded-full bg-[#e80346] px-3 py-1 text-xs font-bold text-white">{l(locale, "درباره هایپر دکتر", "About Hyper Doctor", "Hyper Doctor hakkında", "عن هايبر دكتور")}</span><h2 className="mt-5 text-2xl font-black sm:text-3xl">{l(locale, "تکنولوژی پزشکی، تجربه و مراقبت حرفه‌ای", "Medical technology, experience and professional care", "Medikal teknoloji, deneyim ve profesyonel bakım", "تقنية طبية وخبرة ورعاية احترافية")}</h2><p className="mt-5 text-sm leading-8 text-white/75">{l(locale, "هایپر دکتر با تمرکز بر تجهیزات پزشکی، مراقبت تنفسی و خدمات تخصصی، مسیر انتخاب تا پشتیبانی را در یک تجربه یکپارچه ارائه می‌کند.", "Hyper Doctor brings medical equipment, respiratory care and specialist services into one continuous experience from selection to support.", "Hyper Doctor; medikal ekipman, solunum bakımı ve uzman hizmetleri seçimden desteğe tek bir deneyimde birleştirir.", "يجمع هايبر دكتور المعدات الطبية والرعاية التنفسية والخدمات المتخصصة في تجربة متكاملة من الاختيار حتى الدعم.")}</p><div className="mt-7 flex items-center gap-4"><span className="text-4xl font-black text-[#82cfff]">15+</span><span className="text-xs leading-6 text-white/70">{l(locale, "سال تجربه در حوزه تجهیزات و خدمات سلامت", "years of healthcare equipment and service experience", "yıllık sağlık ekipmanı ve hizmet deneyimi", "سنة من الخبرة في المعدات والخدمات الصحية")}</span></div></div>
          <div className="order-1 min-h-64 bg-[radial-gradient(circle_at_50%_40%,rgba(0,157,216,.35),transparent_45%),linear-gradient(135deg,#002f44,#001736)] lg:order-2"><div className="flex h-full min-h-64 items-center justify-center"><Stethoscope className="h-24 w-24 text-[#82cfff]" /></div></div>
        </section>

        <section className="mb-16 sm:mb-20"><h2 className="stitch-section-title">{l(locale, "تضمین کیفیت و اصالت تجهیزات", "Quality & Authenticity Assurance", "Kalite ve Orijinallik Güvencesi", "ضمان الجودة والأصالة")}</h2><p className="mx-auto mt-2 max-w-2xl text-center text-sm text-[#747780]">{l(locale, "استانداردهای حرفه‌ای برای انتخاب، تحویل و پشتیبانی تجهیزات پزشکی", "Professional standards for equipment selection, delivery and support", "Ekipman seçimi, teslimat ve destek için profesyonel standartlar", "معايير احترافية لاختيار المعدات وتسليمها ودعمها")}</p><div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">{[[ShieldCheck,l(locale,"اصالت و کنترل کیفیت","Authenticity & quality","Orijinallik ve kalite","الأصالة والجودة")],[Award,l(locale,"گارانتی معتبر","Valid warranty","Geçerli garanti","ضمان معتمد")],[PackageCheck,l(locale,"تحویل ایمن","Safe delivery","Güvenli teslimat","توصيل آمن")],[Wrench,l(locale,"پشتیبانی تخصصی","Specialist support","Uzman destek","دعم متخصص")]].map(([Icon,label])=>{const QualityIcon=Icon as typeof ShieldCheck;return <div key={String(label)} className="stitch-soft-card flex flex-col items-center gap-3 p-6 text-center"><QualityIcon className="h-7 w-7 text-[#002b5b]"/><strong className="text-sm">{label as string}</strong></div>;})}</div></section>

        <section className="mb-16 sm:mb-20" id="articles"><h2 className="stitch-section-title">{l(locale, "مقالات علمی و تخصصی", "Scientific & Specialist Articles", "Bilimsel ve Uzman Makaleler", "مقالات علمية ومتخصصة")}</h2><div className="mt-7 grid gap-4 md:grid-cols-3">{articleCards.map((title)=><Link href="/articles" key={title} className="stitch-soft-card overflow-hidden"><div className="flex h-36 items-center justify-center bg-gradient-to-br from-[#e5e8eb] to-[#d6e3ff]"><BookOpen className="h-10 w-10 text-[#002b5b]"/></div><div className="p-5"><span className="text-[11px] font-bold text-[#ba0036]">HYPER DOCTOR JOURNAL</span><h3 className="mt-2 font-black leading-7">{title}</h3><p className="mt-3 text-xs leading-6 text-[#747780]">{l(locale, "مطالب آموزشی و علمی برای استفاده بهتر و ایمن‌تر از تجهیزات و خدمات سلامت.", "Practical clinical knowledge for safer, better use of healthcare equipment and services.", "Sağlık ekipmanı ve hizmetlerini daha güvenli kullanmak için pratik klinik bilgi.", "معرفة سريرية عملية لاستخدام أكثر أماناً وفعالية للمعدات والخدمات الصحية.")}</p></div></Link>)}</div></section>

        <section className="stitch-dark-feature mb-16 flex flex-col items-center justify-between gap-6 p-7 text-center sm:flex-row sm:p-10 sm:text-start sm:mb-20"><div><span className="text-xs font-bold text-[#82cfff]">VITALIS • HYPER DOCTOR</span><h2 className="mt-2 text-xl font-black sm:text-2xl">{l(locale,"باشگاه مشتریان هایپر دکتر","Hyper Doctor Customer Club","Hyper Doctor Müşteri Kulübü","نادي عملاء هايبر دكتور")}</h2><p className="mt-2 text-sm text-white/70">{l(locale,"خدمات، پیگیری و مزایای اختصاصی را در یک مسیر یکپارچه مدیریت کنید.","Manage services, follow-up and member benefits in one place.","Hizmetleri, takibi ve üye avantajlarını tek yerde yönetin.","أدر الخدمات والمتابعة ومزايا العضوية في مكان واحد.")}</p></div><Link href="/club" className="stitch-button stitch-button-primary shrink-0">{l(locale,"ورود به باشگاه","Open customer club","Müşteri kulübünü aç","دخول نادي العملاء")}<Arrow className="h-4 w-4"/></Link></section>

        <section className="mb-4" id="faq"><h2 className="stitch-section-title">{l(locale,"سوالات متداول","Frequently Asked Questions","Sık Sorulan Sorular","الأسئلة الشائعة")}</h2><p className="mx-auto mt-2 max-w-xl text-center text-sm text-[#747780]">{l(locale,"پاسخ به رایج‌ترین سوالات درباره تجهیزات و خدمات هایپر دکتر","Common questions about Hyper Doctor equipment and services","Hyper Doctor ekipman ve hizmetleri hakkında sık sorulanlar","أسئلة شائعة حول معدات وخدمات هايبر دكتور")}</p><div className="mx-auto mt-7 max-w-3xl space-y-3">{faqs.map((question,index)=><details key={question} className="stitch-glass-card rounded-xl px-5 py-4 open:bg-white"><summary className="cursor-pointer list-none text-sm font-bold text-[#181c1e]">{question}</summary><p className="mt-3 border-t border-[#c4c6d0]/40 pt-3 text-xs leading-6 text-[#43474f]">{index===0?l(locale,"از طریق بخش تماس یا رزرو مشاوره، درخواست خود را ثبت کنید تا کارشناس بر اساس نیاز شما راهنمایی کند.","Use contact or consultation booking and our specialist will guide you based on your needs.","İletişim veya danışmanlık rezervasyonu üzerinden talebinizi iletin; uzmanımız ihtiyacınıza göre yönlendirsin.","أرسل طلبك عبر التواصل أو حجز الاستشارة وسيقوم المختص بإرشادك وفق احتياجاتك."):l(locale,"جزئیات این خدمت بر اساس نوع تجهیزات یا درخواست شما توسط تیم پشتیبانی اعلام می‌شود.","Details are confirmed by our support team based on the equipment or service requested.","Ayrıntılar ekipman veya hizmet talebinize göre destek ekibimizce doğrulanır.","يؤكد فريق الدعم التفاصيل وفق نوع المعدات أو الخدمة المطلوبة.")}</p></details>)}</div></section>
      </Container>
    </main>
  );
}
