import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Headphones, Mail, MapPin, MessageCircle, PhoneCall, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/site/contact-form";
import { getSiteSettings } from "@/lib/site-data";

export default async function ContactPage() {
  const [locale, settings] = await Promise.all([getLocale(), getSiteSettings()]);
  const copy = locale === "fa"
    ? {
        eyebrow: "Hyper Doctor Support",
        title: "ارتباط با ما",
        body: "ما در Hyper Doctor متعهد به ارائه تجهیزات پزشکی و خدمات تخصصی قابل اتکا هستیم. برای مشاوره، خرید، خدمات تنفسی، گارانتی یا پشتیبانی فنی پیام خود را مستقیماً ثبت کنید.",
        direct: "ارسال پیام مستقیم",
        directBody: "پیام شما مستقیماً در سیستم پشتیبانی ثبت می‌شود و برای دپارتمان مربوطه قابل پیگیری خواهد بود.",
        contact: "راه‌های ارتباطی",
        phone: "تلفن",
        email: "ایمیل",
        address: "آدرس",
        notSet: "در پنل مدیریت ثبت نشده",
        urgent: "پشتیبانی خدمات تنفسی",
        urgentBody: "برای مشکلات فوری تجهیزات تنفسی، درخواست پشتیبانی ثبت کنید تا تیم مربوطه در سریع‌ترین زمان ممکن پیگیری کند.",
        urgentCta: "ثبت درخواست پشتیبانی",
      }
    : locale === "tr"
      ? {
          eyebrow: "Hyper Doctor Support", title: "Bize Ulaşın", body: "Danışmanlık, satın alma, solunum hizmetleri, garanti veya teknik destek için mesajınızı doğrudan Hyper Doctor sistemine kaydedin.", direct: "Doğrudan mesaj gönder", directBody: "Mesajınız destek sistemine kaydedilir ve ilgili ekip tarafından takip edilir.", contact: "İletişim kanalları", phone: "Telefon", email: "E-posta", address: "Adres", notSet: "Yönetim panelinde henüz tanımlanmadı", urgent: "Solunum hizmetleri desteği", urgentBody: "Acil solunum cihazı sorunları için destek talebi oluşturun.", urgentCta: "Destek talebi oluştur",
        }
      : locale === "ar"
        ? {
            eyebrow: "Hyper Doctor Support", title: "تواصل معنا", body: "للاستشارة أو الشراء أو خدمات التنفس أو الضمان أو الدعم الفني، سجّل رسالتك مباشرة في نظام Hyper Doctor.", direct: "إرسال رسالة مباشرة", directBody: "يتم تسجيل رسالتك في نظام الدعم ومتابعتها من قبل القسم المختص.", contact: "قنوات التواصل", phone: "الهاتف", email: "البريد الإلكتروني", address: "العنوان", notSet: "لم يتم تسجيله في لوحة الإدارة", urgent: "دعم خدمات التنفس", urgentBody: "للمشاكل العاجلة في أجهزة التنفس، سجّل طلب دعم ليتم متابعته بسرعة.", urgentCta: "تسجيل طلب دعم",
          }
        : {
            eyebrow: "Hyper Doctor Support", title: "Contact Us", body: "For consultation, purchasing, respiratory services, warranty or technical support, register your message directly in the Hyper Doctor system.", direct: "Send a direct message", directBody: "Your message is stored in the support system and routed for follow-up by the relevant department.", contact: "Contact channels", phone: "Phone", email: "Email", address: "Address", notSet: "Not configured in the admin panel", urgent: "Respiratory service support", urgentBody: "For urgent respiratory-equipment issues, register a support request for priority follow-up.", urgentCta: "Create support request",
          };

  const items = [
    { label: copy.phone, value: settings.contactPhone, icon: PhoneCall, dir: "ltr" as const },
    { label: copy.email, value: settings.contactEmail, icon: Mail, dir: "ltr" as const },
    { label: copy.address, value: settings.address, icon: MapPin, dir: undefined },
  ];

  return (
    <main className="flex-1 bg-[#f5f8fb] pb-16 pt-6 sm:pt-10">
      <Container>
        <section className="relative overflow-hidden rounded-[2rem] bg-[#001736] px-6 py-10 text-white shadow-[0_24px_65px_rgba(0,23,54,.16)] sm:px-10 lg:px-14 lg:py-14">
          <div className="absolute inset-y-0 end-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(0,157,216,.28),transparent_62%)]" />
          <div className="relative z-10 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#82cfff]">{copy.eyebrow}</p>
            <h1 className="mt-4 text-3xl font-black leading-[1.3] sm:text-5xl">{copy.title}</h1>
            <p className="mt-5 max-w-2xl text-sm leading-8 text-[#d6e3ff]/85 sm:text-base">{copy.body}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-7 lg:grid-cols-[.82fr_1.18fr]">
          <div className="space-y-5">
            <div className="rounded-3xl border border-[#dfe4ea] bg-white p-6 shadow-[0_14px_38px_rgba(0,23,54,.045)] sm:p-7">
              <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#001736] text-white"><Headphones className="h-5 w-5" /></span><h2 className="text-xl font-black text-[#001736]">{copy.contact}</h2></div>
              <div className="mt-6 space-y-3">
                {items.map(({ label, value, icon: Icon, dir }) => (
                  <div key={label} className="flex items-start gap-3 rounded-2xl border border-[#e0e3e6] bg-[#f9fbfd] p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d6e3ff] text-[#002b5b]"><Icon className="h-4 w-4" /></span>
                    <div><p className="text-[11px] font-black text-[#747780]">{label}</p><p dir={dir} className={`mt-1 text-sm font-bold ${value ? "text-[#001736]" : "text-[#9a9da5]"}`}>{value || copy.notSet}</p></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-[#001736] p-6 text-white shadow-[0_18px_48px_rgba(0,23,54,.12)] sm:p-7">
              <ShieldCheck className="h-6 w-6 text-[#82cfff]" />
              <h2 className="mt-4 text-xl font-black">{copy.urgent}</h2>
              <p className="mt-3 text-sm leading-7 text-[#d6e3ff]/80">{copy.urgentBody}</p>
              <Link href="/support" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#ba0036] px-4 text-xs font-black text-white hover:bg-[#e80346]"><MessageCircle className="h-4 w-4" />{copy.urgentCta}</Link>
            </div>
          </div>

          <div>
            <div className="mb-4 px-1"><h2 className="text-2xl font-black text-[#001736]">{copy.direct}</h2><p className="mt-2 text-sm leading-7 text-[#5f6570]">{copy.directBody}</p></div>
            <ContactForm />
          </div>
        </section>
      </Container>
    </main>
  );
}
