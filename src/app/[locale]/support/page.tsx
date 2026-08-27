import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Bot, CircleHelp, Headphones, LifeBuoy, Search, ShieldCheck, Wrench } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SupportForm } from "@/components/site/support-form";

export default async function SupportPage() {
  const locale = await getLocale();
  const copy = locale === "fa"
    ? { eyebrow: "Hyper Doctor Smart Support", title: "مرکز پشتیبانی هوشمند", body: "برای مشکلات فنی تجهیزات، گارانتی، خدمات تنفسی و نصب، درخواست خود را ثبت کنید. تیکت مستقیماً وارد سیستم پشتیبانی می‌شود و قابل پیگیری است.", faq: "جستجوی پاسخ‌های متداول", faqBody: "پیش از ثبت تیکت می‌توانید پاسخ بسیاری از سوالات رایج را در مرکز راهنما پیدا کنید.", warranty: "گارانتی و خدمات پس از فروش", warrantyBody: "ثبت و پیگیری اطلاعات گارانتی، سرویس و درخواست‌های مرتبط با تجهیزات.", track: "پیگیری تیکت", trackBody: "با شماره تیکت و شناسه امن، وضعیت آخرین درخواست خود را بررسی کنید.", openFaq: "مرکز راهنما", openWarranty: "مرکز گارانتی", trackCta: "پیگیری درخواست" }
    : locale === "tr"
      ? { eyebrow: "Hyper Doctor Smart Support", title: "Akıllı Destek Merkezi", body: "Teknik cihaz sorunları, garanti, solunum hizmetleri ve kurulum için talebinizi oluşturun. Kayıt doğrudan destek sistemine gider ve izlenebilir.", faq: "Sık sorulan yanıtları ara", faqBody: "Destek kaydı oluşturmadan önce yardım merkezinde yaygın soruların yanıtlarını bulabilirsiniz.", warranty: "Garanti ve satış sonrası", warrantyBody: "Garanti, servis ve cihaz destek kayıtlarını yönetin.", track: "Destek kaydı takibi", trackBody: "Kayıt numarası ve güvenli kimlikle talebinizin durumunu kontrol edin.", openFaq: "Yardım merkezi", openWarranty: "Garanti merkezi", trackCta: "Talebi takip et" }
      : locale === "ar"
        ? { eyebrow: "Hyper Doctor Smart Support", title: "مركز الدعم الذكي", body: "للمشكلات الفنية والضمان وخدمات التنفس والتركيب، سجّل طلبك ليصل مباشرة إلى نظام الدعم ويصبح قابلاً للمتابعة.", faq: "البحث في الأسئلة الشائعة", faqBody: "يمكنك العثور على إجابات للعديد من الأسئلة في مركز المساعدة قبل تسجيل التذكرة.", warranty: "الضمان وخدمات ما بعد البيع", warrantyBody: "تسجيل ومتابعة الضمان والصيانة ودعم الأجهزة.", track: "متابعة التذكرة", trackBody: "تحقق من حالة طلبك باستخدام رقم التذكرة والمعرف الآمن.", openFaq: "مركز المساعدة", openWarranty: "مركز الضمان", trackCta: "متابعة الطلب" }
        : { eyebrow: "Hyper Doctor Smart Support", title: "Smart Support Center", body: "For technical device issues, warranty, respiratory services and installation, create a request that goes directly into the support system and can be tracked.", faq: "Search common answers", faqBody: "Find answers to many common questions in the help center before creating a ticket.", warranty: "Warranty & after-sales", warrantyBody: "Register and track warranty, service and device-support workflows.", track: "Track a ticket", trackBody: "Check the latest status using your ticket number and secure identifier.", openFaq: "Help center", openWarranty: "Warranty center", trackCta: "Track request" };

  return (
    <main className="flex-1 bg-[#f5f8fb] pb-16 pt-6 sm:pt-10">
      <Container>
        <section className="relative overflow-hidden rounded-[2rem] bg-[#001736] px-6 py-10 text-white shadow-[0_24px_65px_rgba(0,23,54,.16)] sm:px-10 lg:px-14 lg:py-14">
          <div className="absolute inset-y-0 end-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(0,157,216,.30),transparent_62%)]" />
          <div className="relative z-10 max-w-3xl"><div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-white/15 bg-white/10"><Bot className="h-6 w-6 text-[#82cfff]" /></div><p className="mt-5 text-xs font-black uppercase tracking-[.18em] text-[#82cfff]">{copy.eyebrow}</p><h1 className="mt-3 text-3xl font-black leading-[1.3] sm:text-5xl">{copy.title}</h1><p className="mt-5 max-w-2xl text-sm leading-8 text-[#d6e3ff]/85 sm:text-base">{copy.body}</p></div>
        </section>

        <section className="py-7 sm:py-9"><div className="grid gap-4 md:grid-cols-3">
          <SupportCard icon={CircleHelp} title={copy.faq} body={copy.faqBody} href="/faq" cta={copy.openFaq} />
          <SupportCard icon={ShieldCheck} title={copy.warranty} body={copy.warrantyBody} href="/warranty" cta={copy.openWarranty} />
          <SupportCard icon={Search} title={copy.track} body={copy.trackBody} href="/support/status" cta={copy.trackCta} />
        </div></section>

        <section className="grid gap-7 lg:grid-cols-[.66fr_1.34fr] lg:items-start">
          <aside className="rounded-3xl bg-[#001736] p-6 text-white shadow-[0_18px_48px_rgba(0,23,54,.12)] sm:p-7"><Headphones className="h-7 w-7 text-[#82cfff]" /><h2 className="mt-5 text-xl font-black">Hyper Doctor Technical Care</h2><p className="mt-3 text-sm leading-7 text-[#d6e3ff]/80">Equipment model, serial number and a clear description help the technical team classify and resolve requests faster.</p><div className="mt-6 space-y-3 text-xs font-bold text-white/75"><div className="flex gap-2"><Wrench className="h-4 w-4 text-[#82cfff]" />Technical diagnostics & service</div><div className="flex gap-2"><LifeBuoy className="h-4 w-4 text-[#82cfff]" />Warranty & after-sales routing</div></div></aside>
          <SupportForm />
        </section>
      </Container>
    </main>
  );
}

function SupportCard({ icon: Icon, title, body, href, cta }: { icon: typeof Search; title:string; body:string; href:string; cta:string }) {
  return <article className="rounded-3xl border border-[#dfe4ea] bg-white p-5 shadow-[0_14px_38px_rgba(0,23,54,.045)]"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d6e3ff] text-[#002b5b]"><Icon className="h-5 w-5" /></span><h2 className="mt-4 text-lg font-black text-[#001736]">{title}</h2><p className="mt-2 min-h-16 text-sm leading-7 text-[#5f6570]">{body}</p><Link href={href} className="mt-4 inline-flex text-xs font-black text-[#ba0036]">{cta} →</Link></article>;
}
