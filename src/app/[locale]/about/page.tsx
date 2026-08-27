import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Activity, HeartHandshake, Microscope, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { Container } from "@/components/ui/container";

export default async function AboutPage() {
  const locale = await getLocale();
  const copy = locale === "fa"
    ? {
        eyebrow: "Hyper Doctor · VITALIS Group",
        title: "پیشرو در مراقبت‌های تنفسی. تعالی در خدمات درمانی.",
        body: "Hyper Doctor با تکیه بر تجربه تخصصی در حوزه تجهیزات پزشکی و خدمات سلامت، راهکارهای تنفسی، مراقبت در منزل، توانبخشی و پشتیبانی تجهیزات را با رویکردی دقیق، کاربردی و انسان‌محور ارائه می‌کند.",
        mission: "ماموریت ما",
        missionBody: "هدف ما ایجاد یک تجربه یکپارچه از انتخاب تجهیزات تا دریافت خدمت، پشتیبانی، گارانتی و پیگیری است؛ به شکلی که اطلاعات محصول و خدمت شفاف، فرآیندها قابل پیگیری و تصمیم‌گیری برای بیمار و متخصص ساده‌تر باشد.",
        values: "ارزش‌های محوری ما",
        valuesSub: "مهندسی دقیق، خدمات قابل اتکا و طراحی انسان‌محور، پایه تجربه Hyper Doctor است.",
        cta: "مشاهده خدمات تخصصی",
        valuesList: [
          ["دقت بالینی", "اطلاعات، مشخصات و فرآیندهای خدماتی باید روشن، قابل پیگیری و متناسب با نیاز واقعی سلامت باشند.", "clinical"],
          ["انسان‌محوری", "تجربه بیمار، خانواده و متخصص در مرکز طراحی خدمات، رابط کاربری و فرآیند پشتیبانی قرار دارد.", "human"],
          ["پیشرفت تکنولوژیک", "از زیرساخت فروش و رزرو تا مدیریت داده و خدمات پس از فروش، فناوری برای کاهش اصطکاک و افزایش کیفیت استفاده می‌شود.", "tech"],
          ["اصالت و مسئولیت", "محصول، گارانتی، موجودی و خدمات باید بر پایه داده واقعی و تعهد روشن به مشتری ارائه شوند.", "trust"],
        ],
      }
    : locale === "tr"
      ? {
          eyebrow: "Hyper Doctor · VITALIS Group", title: "Solunum bakımında öncü. Sağlık hizmetlerinde mükemmellik.", body: "Hyper Doctor; medikal cihazlar, solunum çözümleri, evde bakım, rehabilitasyon ve cihaz desteğini hassas, pratik ve insan odaklı bir yaklaşımla sunar.", mission: "Misyonumuz", missionBody: "Cihaz seçiminden hizmet, destek, garanti ve takibe kadar şeffaf ve izlenebilir bir sağlık deneyimi oluşturmak.", values: "Temel değerlerimiz", valuesSub: "Hassas mühendislik, güvenilir hizmet ve insan odaklı tasarım Hyper Doctor deneyiminin temelidir.", cta: "Uzman hizmetleri gör", valuesList: [["Klinik doğruluk", "Ürün bilgileri ve hizmet süreçleri açık, izlenebilir ve gerçek ihtiyaca uygun olmalıdır.", "clinical"], ["İnsan odaklılık", "Hasta, aile ve uzman deneyimi tasarımın merkezindedir.", "human"], ["Teknolojik ilerleme", "Teknoloji satış, rezervasyon, veri ve satış sonrası süreçlerde kaliteyi artırır.", "tech"], ["Özgünlük ve sorumluluk", "Ürün, garanti, stok ve hizmetler gerçek verilere dayanmalıdır.", "trust"]],
        }
      : locale === "ar"
        ? {
            eyebrow: "Hyper Doctor · VITALIS Group", title: "ريادة في رعاية الجهاز التنفسي. تميز في الخدمات الصحية.", body: "تقدم Hyper Doctor حلول المعدات الطبية والتنفسية والرعاية المنزلية وإعادة التأهيل ودعم الأجهزة بمنهج دقيق وعملي وإنساني.", mission: "مهمتنا", missionBody: "بناء تجربة متكاملة وشفافة من اختيار المعدات إلى الخدمة والدعم والضمان والمتابعة.", values: "قيمنا الأساسية", valuesSub: "الدقة والخدمة الموثوقة والتصميم المتمحور حول الإنسان هي أساس تجربة Hyper Doctor.", cta: "عرض الخدمات المتخصصة", valuesList: [["الدقة السريرية", "يجب أن تكون معلومات المنتجات والخدمات واضحة وقابلة للتتبع ومناسبة للاحتياج الحقيقي.", "clinical"], ["الإنسان أولاً", "تجربة المريض والأسرة والمتخصص في صميم تصميم خدماتنا.", "human"], ["التقدم التقني", "نستخدم التكنولوجيا لتحسين البيع والحجز والبيانات وخدمات ما بعد البيع.", "tech"], ["الأصالة والمسؤولية", "المنتجات والضمان والمخزون والخدمات يجب أن تستند إلى بيانات حقيقية.", "trust"]],
          }
        : {
            eyebrow: "Hyper Doctor · VITALIS Group", title: "Leading respiratory care. Excellence in health services.", body: "Hyper Doctor delivers medical equipment, respiratory solutions, home care, rehabilitation and device support with a precise, practical and human-centered approach.", mission: "Our mission", missionBody: "Build one transparent and traceable experience from equipment selection through service, support, warranty and follow-up.", values: "Our core values", valuesSub: "Precision, dependable service and human-centered design are the foundation of the Hyper Doctor experience.", cta: "Explore specialist services", valuesList: [["Clinical precision", "Product information and service processes should be clear, traceable and matched to real healthcare needs.", "clinical"], ["Human centered", "Patient, family and clinician experience stays at the center of our service design.", "human"], ["Technology progress", "Technology improves commerce, booking, data and after-sales workflows.", "tech"], ["Authenticity & responsibility", "Products, warranty, stock and services should be grounded in real data.", "trust"]],
          };

  const iconFor = (key: string) => key === "clinical" ? Stethoscope : key === "human" ? HeartHandshake : key === "tech" ? Microscope : ShieldCheck;

  return (
    <main className="flex-1 bg-[#f5f8fb] pb-16 pt-6 sm:pt-10">
      <Container>
        <section className="relative min-h-[480px] overflow-hidden rounded-[2rem] bg-[#001736] px-6 py-12 text-white shadow-[0_26px_70px_rgba(0,23,54,.18)] sm:px-10 lg:flex lg:items-center lg:px-14 lg:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_35%,rgba(0,157,216,.34),transparent_35%),radial-gradient(circle_at_78%_50%,rgba(255,255,255,.08),transparent_50%)] rtl:bg-[radial-gradient(circle_at_20%_35%,rgba(0,157,216,.34),transparent_35%),radial-gradient(circle_at_22%_50%,rgba(255,255,255,.08),transparent_50%)]" />
          <div className="absolute end-10 top-1/2 hidden h-64 w-64 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur lg:flex">
            <Activity className="h-28 w-28 text-[#82cfff]" strokeWidth={1} />
          </div>
          <div className="relative z-10 max-w-3xl lg:max-w-[62%]">
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#82cfff]">{copy.eyebrow}</p>
            <h1 className="mt-5 text-3xl font-black leading-[1.35] drop-shadow-lg sm:text-5xl">{copy.title}</h1>
            <p className="mt-6 max-w-2xl text-sm leading-8 text-[#d6e3ff]/85 sm:text-base">{copy.body}</p>
            <Link href="/services" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#ba0036] px-6 text-sm font-black text-white shadow-[0_12px_28px_rgba(186,0,54,.22)] hover:bg-[#e80346]"><Sparkles className="h-4 w-4" />{copy.cta}</Link>
          </div>
        </section>

        <section className="py-10 sm:py-14">
          <div className="grid gap-6 rounded-3xl border border-[#dfe4ea] bg-white p-6 shadow-[0_16px_45px_rgba(0,23,54,.05)] sm:p-9 lg:grid-cols-[.7fr_1.3fr] lg:items-center">
            <div><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#001736] text-white"><ShieldCheck className="h-6 w-6" /></span><h2 className="mt-5 text-2xl font-black text-[#001736] sm:text-3xl">{copy.mission}</h2></div>
            <p className="text-sm leading-8 text-[#5f6570] sm:text-base">{copy.missionBody}</p>
          </div>
        </section>

        <section>
          <div className="mb-7 max-w-3xl"><h2 className="text-2xl font-black text-[#001736] sm:text-3xl">{copy.values}</h2><p className="mt-3 text-sm leading-7 text-[#5f6570]">{copy.valuesSub}</p></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {copy.valuesList.map(([title, body, key]) => {
              const Icon = iconFor(key);
              return <article key={title} className="rounded-3xl border border-[#dfe4ea] bg-white p-6 shadow-[0_14px_38px_rgba(0,23,54,.045)]"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d6e3ff] text-[#002b5b]"><Icon className="h-5 w-5" /></span><h3 className="mt-5 text-lg font-black text-[#001736]">{title}</h3><p className="mt-3 text-sm leading-7 text-[#5f6570]">{body}</p></article>;
            })}
          </div>
        </section>

        <section className="mt-10 rounded-3xl bg-[#001736] px-6 py-8 text-white sm:px-10">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#82cfff]">VITALIS Group</p><p className="mt-2 max-w-2xl text-sm leading-7 text-[#d6e3ff]/80">Hyper Doctor combines commerce, specialist services and after-sales workflows in one evolving healthcare ecosystem.</p></div><Link href="/contact" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-[#001736]"><Stethoscope className="h-4 w-4" />Hyper Doctor</Link></div>
        </section>
      </Container>
    </main>
  );
}
