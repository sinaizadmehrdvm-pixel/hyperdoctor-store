import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Headphones, LifeBuoy, MoonStar, ShoppingBag, Stethoscope, Wrench } from "lucide-react";
import { Container } from "@/components/ui/container";

type FaqGroup = {
  title: string;
  icon: "shop" | "resp" | "sleep" | "tech";
  items: [string, string][];
};

type FaqCopy = {
  title: string;
  subtitle: string;
  helpTitle: string;
  helpBody: string;
  contact: string;
  support: string;
  groups: FaqGroup[];
};

export default async function FaqPage() {
  const locale = await getLocale();

  const fa: FaqCopy = {
    title: "چگونه می‌توانیم به شما کمک کنیم؟",
    subtitle: "پاسخ سوالات متداول خود را در زمینه تجهیزات پزشکی، خدمات تنفسی و پشتیبانی فنی در اینجا بیابید.",
    helpTitle: "همچنان به کمک نیاز دارید؟",
    helpBody: "تیم پشتیبانی تخصصی برای پاسخگویی به سوالات بالینی و فنی شما در دسترس است.",
    contact: "تماس با ما",
    support: "مرکز پشتیبانی",
    groups: [
      {
        title: "خرید تجهیزات",
        icon: "shop",
        items: [
          ["چه روش‌های پرداختی را می‌پذیرید؟", "روش‌های فعال در مرحله تسویه‌حساب نمایش داده می‌شوند."],
          ["آیا دستگاه‌های بالینی دارای گارانتی هستند؟", "شرایط و مدت گارانتی در صفحه محصول و سامانه گارانتی نمایش داده می‌شود."],
          ["ارسال سفارشات چقدر زمان می‌برد؟", "زمان ارسال به موجودی، مقصد و روش حمل بستگی دارد."],
        ],
      },
      {
        title: "خدمات تنفسی",
        icon: "resp",
        items: [
          ["چگونه نوبت تحویل اکسیژن را رزرو کنم؟", "از صفحه رزرو، خدمت، تاریخ و زمان را ثبت کنید."],
          ["در صورت هشدار دستگاه اکسیژن‌ساز چه باید کرد؟", "راهنمای سازنده را بررسی کنید و در صورت نیاز درخواست پشتیبانی ثبت کنید."],
        ],
      },
      {
        title: "تست خواب",
        icon: "sleep",
        items: [
          ["چگونه برای تست خواب در منزل آماده شوم؟", "پس از رزرو، راهنمای متناسب با نوع تست برای شما ارسال می‌شود."],
          ["نتایج تست چه زمانی آماده می‌شود؟", "بسته به نوع تست و فرآیند تحلیل، زمان تحویل متفاوت است."],
        ],
      },
      {
        title: "پشتیبانی فنی",
        icon: "tech",
        items: [
          ["چگونه فریم‌ور دستگاه را به‌روزرسانی کنم؟", "فقط مطابق راهنمای سازنده و مدل دقیق دستگاه اقدام کنید."],
          ["اگر دستگاه روشن نشد چه اقدامی لازم است؟", "منبع تغذیه و کابل‌ها را بررسی کنید و دستگاه را باز نکنید."],
        ],
      },
    ],
  };

  const en: FaqCopy = {
    title: "How can we help?",
    subtitle: "Find answers about medical equipment, respiratory services and technical support.",
    helpTitle: "Still need help?",
    helpBody: "Our specialist support team is available for clinical and technical questions.",
    contact: "Contact us",
    support: "Support center",
    groups: [
      {
        title: "Equipment purchasing",
        icon: "shop",
        items: [
          ["Which payment methods are accepted?", "Available methods are shown during checkout."],
          ["Do clinical devices include warranty?", "Warranty terms are shown on the product and warranty pages."],
          ["How long does delivery take?", "Timing depends on stock, destination and shipping method."],
        ],
      },
      {
        title: "Respiratory services",
        icon: "resp",
        items: [
          ["How do I book oxygen delivery?", "Use online booking to select service, date and time."],
          ["What if an oxygen concentrator alarms?", "Follow the manufacturer guidance and create a support request if needed."],
        ],
      },
      {
        title: "Sleep testing",
        icon: "sleep",
        items: [
          ["How should I prepare for a home sleep test?", "Instructions are sent after booking based on the test type."],
          ["When are results ready?", "Timing depends on the test and analysis workflow."],
        ],
      },
      {
        title: "Technical support",
        icon: "tech",
        items: [
          ["How do I update firmware?", "Only use the manufacturer's instructions for the exact model."],
          ["What if the device will not power on?", "Check power and cables without opening the device."],
        ],
      },
    ],
  };

  const tr: FaqCopy = {
    title: "Size nasıl yardımcı olabiliriz?",
    subtitle: "Medikal cihazlar, solunum hizmetleri ve teknik destek hakkında sık sorulan soruların yanıtlarını burada bulabilirsiniz.",
    helpTitle: "Hâlâ yardıma mı ihtiyacınız var?",
    helpBody: "Uzman destek ekibimiz klinik ve teknik sorularınız için yanınızdadır.",
    contact: "Bize ulaşın",
    support: "Destek merkezi",
    groups: [
      {
        title: "Cihaz satın alma",
        icon: "shop",
        items: [
          ["Hangi ödeme yöntemlerini kabul ediyorsunuz?", "Aktif ödeme yöntemleri ödeme adımında gösterilir."],
          ["Klinik cihazların garantisi var mı?", "Garanti koşulları ve süresi ürün sayfasında ve garanti sisteminde gösterilir."],
          ["Sipariş teslimatı ne kadar sürer?", "Teslimat süresi stok durumuna, varış noktasına ve kargo yöntemine bağlıdır."],
        ],
      },
      {
        title: "Solunum hizmetleri",
        icon: "resp",
        items: [
          ["Oksijen teslimatı için nasıl randevu alabilirim?", "Rezervasyon sayfasından hizmeti, tarihi ve saati seçebilirsiniz."],
          ["Oksijen konsantratörü alarm verirse ne yapmalıyım?", "Üreticinin talimatlarını izleyin ve gerekirse destek talebi oluşturun."],
        ],
      },
      {
        title: "Uyku testi",
        icon: "sleep",
        items: [
          ["Evde uyku testine nasıl hazırlanmalıyım?", "Rezervasyon sonrasında test türüne uygun hazırlık talimatları size iletilir."],
          ["Sonuçlar ne zaman hazır olur?", "Teslim süresi test türüne ve analiz sürecine göre değişir."],
        ],
      },
      {
        title: "Teknik destek",
        icon: "tech",
        items: [
          ["Cihaz yazılımını nasıl güncellerim?", "Yalnızca tam cihaz modeline ait üretici talimatlarını izleyin."],
          ["Cihaz açılmazsa ne yapmalıyım?", "Güç kaynağını ve kabloları kontrol edin; cihazın kasasını açmayın."],
        ],
      },
    ],
  };

  const ar: FaqCopy = {
    title: "كيف يمكننا مساعدتك؟",
    subtitle: "اعثر هنا على إجابات للأسئلة الشائعة حول المعدات الطبية وخدمات التنفس والدعم الفني.",
    helpTitle: "هل ما زلت بحاجة إلى مساعدة؟",
    helpBody: "فريق الدعم المتخصص لدينا متاح للإجابة عن أسئلتك السريرية والفنية.",
    contact: "تواصل معنا",
    support: "مركز الدعم",
    groups: [
      {
        title: "شراء المعدات",
        icon: "shop",
        items: [
          ["ما طرق الدفع المقبولة؟", "تظهر طرق الدفع المتاحة أثناء إتمام الطلب."],
          ["هل تشمل الأجهزة السريرية ضماناً؟", "تظهر شروط الضمان ومدته في صفحة المنتج ونظام الضمان."],
          ["كم يستغرق توصيل الطلب؟", "تعتمد مدة التوصيل على المخزون والوجهة وطريقة الشحن."],
        ],
      },
      {
        title: "خدمات التنفس",
        icon: "resp",
        items: [
          ["كيف أحجز موعداً لتوصيل الأكسجين؟", "استخدم صفحة الحجز لاختيار الخدمة والتاريخ والوقت."],
          ["ماذا أفعل إذا أصدر جهاز تركيز الأكسجين إنذاراً؟", "اتبع إرشادات الشركة المصنعة وأنشئ طلب دعم عند الحاجة."],
        ],
      },
      {
        title: "اختبار النوم",
        icon: "sleep",
        items: [
          ["كيف أستعد لاختبار النوم المنزلي؟", "تُرسل إليك تعليمات مناسبة لنوع الاختبار بعد الحجز."],
          ["متى تصبح النتائج جاهزة؟", "تختلف المدة بحسب نوع الاختبار ومسار التحليل."],
        ],
      },
      {
        title: "الدعم الفني",
        icon: "tech",
        items: [
          ["كيف أحدّث البرنامج الثابت للجهاز؟", "اتبع فقط تعليمات الشركة المصنعة الخاصة بالطراز الدقيق."],
          ["ماذا أفعل إذا لم يعمل الجهاز؟", "تحقق من مصدر الطاقة والكابلات ولا تفتح الجهاز."],
        ],
      },
    ],
  };

  const c = locale === "fa" ? fa : locale === "tr" ? tr : locale === "ar" ? ar : en;
  const icon = (kind: FaqGroup["icon"]) =>
    kind === "shop" ? ShoppingBag : kind === "resp" ? Stethoscope : kind === "sleep" ? MoonStar : Wrench;

  return (
    <main className="flex-1 bg-[radial-gradient(circle_at_50%_10%,rgba(159,214,255,.22),transparent_35%),#eef3f7] pb-16 pt-14">
      <Container>
        <header className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-black leading-[1.35] text-[#001736] sm:text-6xl">{c.title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-[#5f6570] sm:text-base">{c.subtitle}</p>
        </header>

        <section className="mt-12 grid gap-5 lg:grid-cols-2">
          {c.groups.map((group) => {
            const Icon = icon(group.icon);
            return (
              <article key={group.title} className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-[0_16px_40px_rgba(0,23,54,.05)] backdrop-blur sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#003274] text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="text-2xl font-black text-[#001736]">{group.title}</h2>
                </div>
                <div className="mt-6 space-y-3">
                  {group.items.map(([q, a]) => (
                    <details key={q} className="group rounded-xl border border-[#dfe4ea] bg-white px-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-bold text-[#001736]">
                        <span>{q}</span>
                        <span className="text-xl text-[#64707c] transition group-open:rotate-45">+</span>
                      </summary>
                      <p className="pb-4 text-sm leading-7 text-[#5f6570]">{a}</p>
                    </details>
                  ))}
                </div>
              </article>
            );
          })}
        </section>

        <section className="mx-auto mt-14 max-w-4xl rounded-2xl border border-white/80 bg-white/90 p-8 text-center shadow-[0_18px_50px_rgba(0,23,54,.06)] backdrop-blur sm:p-10">
          <Headphones className="mx-auto h-16 w-16 text-[#d8dde3]" />
          <h2 className="mt-5 text-3xl font-black text-[#001736]">{c.helpTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#5f6570]">{c.helpBody}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#001736] px-6 text-sm font-black text-white">
              <LifeBuoy className="h-4 w-4" />
              {c.contact}
            </Link>
            <Link href="/support" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#ef0b4f] px-6 text-sm font-black text-white">
              <Headphones className="h-4 w-4" />
              {c.support}
            </Link>
          </div>
        </section>
      </Container>
    </main>
  );
}
