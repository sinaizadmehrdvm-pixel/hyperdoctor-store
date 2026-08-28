import { getLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Mail, MapPin, PhoneCall, Siren } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/site/contact-form";
import { getSiteSettings } from "@/lib/site-data";

const MAP_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuA4AzZ_8KQoJaiRX3OnTgQrd_RRnMB5jgX2ciyNIB3AX5wSvasagAsk_SxTn1EsOVDf4ZepMM1GKKCHZYgO6Mykg3PliWpjlxv2iwV56uaBy01cZEU1a4oZdJf4rmpqUH5t8tQoB9haHthHqW4xg0COdbL1ECCqwm4pCS-lFiDtdi0TMwBcQKJDPltH1iF_Q0NE9IVGdn82WRkxwemZ3wMnx_MoebDgBqajarb2Q6HRotnI8PArRCdXtA";

export default async function ContactPage() {
  const [locale, settings] = await Promise.all([getLocale(), getSiteSettings()]);
  const fa = { title:"ارتباط با ما", body:"ما در Hyper Doctor متعهد به ارائه بهترین خدمات و تجهیزات پزشکی هستیم. در صورت داشتن هرگونه سوال یا نیاز به پشتیبانی فنی، تیم متخصص ما آماده پاسخگویی است.", phone:"تلفن دفتر", email:"ایمیل سازمانی", emergency:"اورژانس فنی", emergencyBody:"برای قطعی دستگاه‌های تنفسی یا تجهیزات حیاتی درخواست فوری ثبت کنید.", emergencyCta:"درخواست فوری", office:"دفتر مرکزی", officeBody:"آدرس دفتر ثبت‌شده در سیستم", message:"ارسال پیام مستقیم" };
  const en = { title:"Contact us", body:"Hyper Doctor is committed to dependable medical equipment and specialist services. For consultation, purchasing, warranty or technical support, contact our team directly.", phone:"Office phone", email:"Support email", emergency:"Technical emergency", emergencyBody:"Register an urgent request for critical respiratory or medical-equipment failures.", emergencyCta:"Urgent request", office:"Head office", officeBody:"Registered office address", message:"Send a direct message" };
  const tr = { ...en, title:"Bize ulaşın", phone:"Ofis telefonu", email:"Destek e-postası", emergency:"Teknik acil destek", emergencyCta:"Acil talep", office:"Merkez ofis", message:"Doğrudan mesaj gönder" };
  const ar = { ...en, title:"تواصل معنا", phone:"هاتف المكتب", email:"البريد الإلكتروني", emergency:"طوارئ فنية", emergencyCta:"طلب عاجل", office:"المكتب الرئيسي", message:"إرسال رسالة مباشرة" };
  const c = locale === "fa" ? fa : locale === "tr" ? tr : locale === "ar" ? ar : en;

  return <main className="flex-1 bg-[#f3f6fa] pb-16 pt-10 sm:pt-14">
    <Container>
      <header className="mx-auto max-w-3xl text-center"><h1 className="text-4xl font-black text-[#001736] sm:text-5xl">{c.title}</h1><p className="mt-5 text-sm leading-8 text-[#5f6570] sm:text-base">{c.body}</p></header>

      <section className="mt-10 grid gap-6 lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#dfe4ea] bg-white p-5 shadow-[0_14px_34px_rgba(0,23,54,.05)]"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d7e9ff] text-[#001736]"><PhoneCall className="h-5 w-5" /></span><div><p className="text-[11px] font-black text-[#747780]">{c.phone}</p><p dir="ltr" className="mt-1 text-lg font-black text-[#001736]">{settings.contactPhone || "—"}</p></div></div></div>
          <div className="rounded-2xl border border-[#dfe4ea] bg-white p-5 shadow-[0_14px_34px_rgba(0,23,54,.05)]"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d7e9ff] text-[#001736]"><Mail className="h-5 w-5" /></span><div><p className="text-[11px] font-black text-[#747780]">{c.email}</p><p dir="ltr" className="mt-1 break-all text-sm font-black text-[#001736]">{settings.contactEmail || "—"}</p></div></div></div>
          <div className="rounded-2xl bg-[#ef0b4f] p-6 text-white shadow-[0_18px_40px_rgba(239,11,79,.18)]"><Siren className="h-9 w-9" /><h2 className="mt-5 text-2xl font-black">{c.emergency}</h2><p className="mt-3 text-sm leading-7 text-white/80">{c.emergencyBody}</p><Link href="/support" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-white px-5 text-xs font-black text-[#ba0036]">{c.emergencyCta}</Link></div>
        </div>

        <div className="relative min-h-[390px] overflow-hidden rounded-2xl border border-[#dfe4ea] bg-white shadow-[0_16px_42px_rgba(0,23,54,.06)]">
          <Image src={MAP_IMAGE} alt={c.office} fill className="object-cover" sizes="(min-width:1024px) 70vw, 100vw" />
          <div className="absolute inset-x-5 bottom-5 flex items-center gap-4 rounded-2xl border border-white/50 bg-white/90 p-5 shadow-xl backdrop-blur-md"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#001736] text-white"><MapPin className="h-5 w-5" /></span><div><h2 className="text-xl font-black text-[#001736]">{c.office}</h2><p className="mt-1 text-sm text-[#5f6570]">{settings.address || c.officeBody}</p></div></div>
        </div>
      </section>

      <section className="relative mx-auto mt-14 max-w-4xl overflow-hidden rounded-3xl border border-[#e0e5eb] bg-white p-6 shadow-[0_24px_60px_rgba(0,23,54,.08)] sm:p-9"><h2 className="mb-6 text-center text-3xl font-black text-[#001736]">{c.message}</h2><ContactForm /></section>
    </Container>
  </main>;
}
