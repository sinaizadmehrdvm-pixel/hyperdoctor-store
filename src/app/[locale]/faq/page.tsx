import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Headphones, LifeBuoy, MoonStar, ShoppingBag, Stethoscope, Wrench } from "lucide-react";
import { Container } from "@/components/ui/container";

export default async function FaqPage() {
  const locale = await getLocale();

  const fa = {
    eyebrow: "Hyper Doctor Help Center",
    title: "چگونه می‌توانیم به شما کمک کنیم؟",
    subtitle: "پاسخ سوالات متداول خود را در زمینه تجهیزات پزشکی، خدمات تنفسی و پشتیبانی فنی در اینجا بیابید.",
    helpTitle: "همچنان به کمک نیاز دارید؟",
    helpBody: "تیم پشتیبانی تخصصی ما برای راهنمایی خرید، خدمات تنفسی، گارانتی و مشکلات فنی در دسترس شماست.",
    contact: "ارسال پیام",
    support: "ثبت درخواست پشتیبانی",
    groups: [
      { title: "خرید تجهیزات", icon: "shop", items: [
        ["چه روش‌های پرداختی را می‌پذیرید؟", "روش‌های پرداخت فعال متناسب با کشور، درگاه و نوع سفارش در مرحله تسویه‌حساب نمایش داده می‌شوند. سفارش و مبلغ قبل از پرداخت مجدداً در سرور اعتبارسنجی می‌شود."],
        ["آیا دستگاه‌های بالینی دارای گارانتی هستند؟", "مدت و شرایط گارانتی برای هر محصول به‌صورت جداگانه در صفحه همان محصول نمایش داده می‌شود. اطلاعات گارانتی واقعی از مشخصات محصول و ثبت گارانتی دریافت می‌شود."],
        ["ارسال سفارشات چقدر زمان می‌برد؟", "زمان ارسال به موجودی، مقصد، نوع کالا و روش حمل بستگی دارد. زمان نهایی پس از ثبت سفارش و هماهنگی توسط تیم فروش اعلام می‌شود."],
      ]},
      { title: "خدمات تنفسی", icon: "resp", items: [
        ["چگونه نوبت خدمت تنفسی را رزرو کنم؟", "از صفحه خدمات، خدمت مورد نظر را انتخاب کنید و وارد رزرو آنلاین شوید. تاریخ، بازه زمانی و اطلاعات تماس شما مستقیماً در سیستم ثبت می‌شود و تیم Hyper Doctor برای تأیید نهایی تماس می‌گیرد."],
        ["اگر دستگاه تنفسی هشدار داد چه کار کنم؟", "راهنمای دستگاه و شرایط ایمنی آن را بررسی کنید. اگر بیمار وابسته به دستگاه است یا وضعیت تنفسی نامناسب دارد، موضوع را فوری و از مسیر خدمات اورژانسی درمانی پیگیری کنید؛ برای بررسی فنی دستگاه نیز درخواست پشتیبانی ثبت کنید."],
      ]},
      { title: "تست خواب", icon: "sleep", items: [
        ["چگونه برای تست خواب در منزل آماده شوم؟", "پس از ثبت رزرو، دستورالعمل متناسب با نوع تست و دستگاه برای شما ارائه می‌شود. برنامه خواب معمول خود را حفظ کنید و تجهیزات را دقیقاً طبق راهنمای تیم استفاده کنید."],
        ["نتایج تست چه زمانی آماده می‌شود؟", "زمان آماده‌شدن نتیجه به نوع تست، فرآیند تحلیل و مرکز یا متخصص بررسی‌کننده بستگی دارد. زمان تقریبی هنگام هماهنگی نهایی به شما اعلام می‌شود."],
      ]},
      { title: "پشتیبانی فنی", icon: "tech", items: [
        ["چگونه نرم‌افزار یا فریم‌ور دستگاه را به‌روزرسانی کنم؟", "فقط بر اساس راهنمای سازنده و مدل دقیق دستگاه اقدام کنید. در صورت ابهام، مدل و شماره سریال را در درخواست پشتیبانی وارد کنید تا تیم فنی راهنمایی کند."],
        ["اگر دستگاه روشن نشد چه اقدامی لازم است؟", "منبع تغذیه، کابل و اتصالات قابل مشاهده را بدون بازکردن دستگاه بررسی کنید. اگر مشکل ادامه داشت، دستگاه را دستکاری نکنید و درخواست سرویس فنی ثبت کنید."],
      ]},
    ],
  };

  const en = {
    eyebrow: "Hyper Doctor Help Center", title: "How can we help?", subtitle: "Find answers about medical equipment, respiratory services and technical support.", helpTitle: "Still need help?", helpBody: "Our specialist support team can assist with purchasing, respiratory services, warranty and technical issues.", contact: "Send a message", support: "Create support request",
    groups: [
      { title: "Equipment purchasing", icon: "shop", items: [["Which payment methods are accepted?", "Available payment methods depend on country, gateway and order type and are shown during checkout. Order totals are revalidated on the server before payment."], ["Do clinical devices include warranty?", "Warranty terms are displayed per product and use the actual product/warranty information stored in the system."], ["How long does shipping take?", "Delivery time depends on stock, destination, product type and shipping method. The sales team confirms the final estimate after ordering."]]},
      { title: "Respiratory services", icon: "resp", items: [["How do I book a respiratory service?", "Choose the service and use online booking. Your date, time window and contact information are stored directly in the system for team confirmation."], ["What should I do if a respiratory device alarms?", "Follow the device safety instructions. If a patient is device-dependent or clinically unstable, seek urgent medical help; for device inspection, register a technical support request."]]},
      { title: "Sleep testing", icon: "sleep", items: [["How should I prepare for an at-home sleep test?", "Instructions depend on the test and device and are provided after booking. Keep your usual sleep routine and follow the supplied setup instructions."], ["When will results be ready?", "Timing depends on test type, analysis workflow and reviewing specialist. An estimate is provided during final coordination."]]},
      { title: "Technical support", icon: "tech", items: [["How do I update device firmware?", "Only follow the manufacturer's instructions for the exact device model. If unsure, include model and serial number in a support request."], ["What if the device does not power on?", "Check visible power sources, cables and connections without opening the device. If it still fails, stop troubleshooting and register a service request."]]},
    ],
  };

  const tr = { ...en, title: "Size nasıl yardımcı olabiliriz?", subtitle: "Medikal cihazlar, solunum hizmetleri ve teknik destek hakkında sık sorulan sorular.", helpTitle: "Hâlâ yardıma mı ihtiyacınız var?", helpBody: "Uzman destek ekibimiz satın alma, solunum hizmetleri, garanti ve teknik konularda yardımcı olur.", contact: "Mesaj gönder", support: "Destek talebi oluştur" };
  const ar = { ...en, title: "كيف يمكننا مساعدتك؟", subtitle: "إجابات عن الأسئلة الشائعة حول المعدات الطبية وخدمات التنفس والدعم الفني.", helpTitle: "هل ما زلت بحاجة إلى مساعدة؟", helpBody: "فريق الدعم المتخصص متاح للمساعدة في الشراء وخدمات التنفس والضمان والمشكلات الفنية.", contact: "إرسال رسالة", support: "تسجيل طلب دعم" };
  const copy = locale === "fa" ? fa : locale === "tr" ? tr : locale === "ar" ? ar : en;

  function icon(kind: string) {
    if (kind === "shop") return ShoppingBag;
    if (kind === "resp") return Stethoscope;
    if (kind === "sleep") return MoonStar;
    return Wrench;
  }

  return (
    <main className="flex-1 bg-[#f5f8fb] pb-16 pt-6 sm:pt-10">
      <Container>
        <section className="relative overflow-hidden rounded-[2rem] bg-[#001736] px-6 py-10 text-center text-white shadow-[0_24px_65px_rgba(0,23,54,.16)] sm:px-10 lg:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,157,216,.26),transparent_55%)]" />
          <div className="relative z-10 mx-auto max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#82cfff]">{copy.eyebrow}</p>
            <h1 className="mt-4 text-3xl font-black leading-[1.3] sm:text-5xl">{copy.title}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-[#d6e3ff]/85 sm:text-base">{copy.subtitle}</p>
          </div>
        </section>

        <section className="py-9 sm:py-12">
          <div className="grid gap-5 lg:grid-cols-2">
            {copy.groups.map((group) => {
              const Icon = icon(group.icon);
              return (
                <article key={group.title} className="rounded-3xl border border-[#dfe4ea] bg-white p-5 shadow-[0_14px_38px_rgba(0,23,54,.045)] sm:p-7">
                  <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#001736] text-white"><Icon className="h-5 w-5" /></span><h2 className="text-xl font-black text-[#001736]">{group.title}</h2></div>
                  <div className="mt-5 divide-y divide-[#e0e3e6]">
                    {group.items.map(([question, answer]) => (
                      <details key={question} className="group py-1 first:pt-0" open={false}>
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-black leading-6 text-[#001736] marker:hidden">
                          <span>{question}</span><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f1f4f7] text-lg font-medium text-[#002b5b] transition group-open:rotate-45">+</span>
                        </summary>
                        <p className="pb-5 pe-10 text-sm leading-7 text-[#5f6570]">{answer}</p>
                      </details>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl bg-[#001736] px-6 py-9 text-white shadow-[0_20px_55px_rgba(0,23,54,.14)] sm:px-10">
          <div className="absolute end-0 top-0 h-48 w-48 rounded-full bg-[#009dd8]/15 blur-3xl" />
          <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl"><LifeBuoy className="h-7 w-7 text-[#82cfff]" /><h2 className="mt-4 text-2xl font-black">{copy.helpTitle}</h2><p className="mt-3 text-sm leading-7 text-[#d6e3ff]/80">{copy.helpBody}</p></div>
            <div className="flex flex-wrap gap-3"><Link href="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#001736]"><Headphones className="h-4 w-4" />{copy.contact}</Link><Link href="/support" className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#ba0036] px-5 text-sm font-black text-white hover:bg-[#e80346]"><LifeBuoy className="h-4 w-4" />{copy.support}</Link></div>
          </div>
        </section>
      </Container>
    </main>
  );
}
