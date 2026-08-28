import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Mail, MapPin, Phone, ShieldCheck, Stethoscope, Truck, Camera, BriefcaseBusiness, MessageCircle } from "lucide-react";
import { getNavPages, getSiteSettings } from "@/lib/site-data";
import { HyperDoctorLogo, VetrixMark } from "./logo";

function l(locale:string,fa:string,en:string,tr:string,ar:string){if(locale==="en")return en;if(locale==="tr")return tr;if(locale==="ar")return ar;return fa;}

export async function Footer() {
  const locale = await getLocale();
  const t = await getTranslations("footer");
  const navT = await getTranslations("nav");
  const brandT = await getTranslations("brand");
  const [pages, settings] = await Promise.all([getNavPages(), getSiteSettings()]);
  const hasContactDetails = Boolean(settings.contactPhone || settings.contactEmail || settings.address);

  return (
    <footer className="mt-auto rounded-t-[2rem] bg-[#001736] text-white shadow-[0_-16px_50px_rgba(0,23,54,.08)] sm:rounded-t-[2.6rem]">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pt-14 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_.85fr_.85fr_1fr]">
          <div>
            <div className="inline-flex rounded-2xl bg-white px-3 py-2 text-[#001736]"><HyperDoctorLogo tagline={brandT("tagline")} name={settings.subBrandName} logoUrl={settings.subBrandLogoUrl}/></div>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/65">{t("about")}</p>
            <div className="mt-5 flex items-center gap-2 text-xs text-white/55"><span>{l(locale,"عضو اکوسیستم","Part of","Bir parçası","جزء من")}</span><VetrixMark className="h-5 w-5" logoUrl={settings.holdingLogoUrl} name={settings.holdingName}/><strong className="text-white/85">{settings.holdingName}</strong></div>
            <div className="mt-6 flex gap-2">{[Camera,BriefcaseBusiness,MessageCircle].map((Icon,index)=><span key={index} aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/7 text-white/70"><Icon className="h-4 w-4"/></span>)}</div>
          </div>

          <div><h3 className="mb-4 text-sm font-black text-white">{t("quickLinks")}</h3><ul className="space-y-3 text-sm text-white/58"><li><Link href="/shop" className="transition hover:text-white">{navT("shop")}</Link></li><li><Link href="/services" className="transition hover:text-white">{navT("services")}</Link></li><li><Link href="/articles" className="transition hover:text-white">{l(locale,"مجله علمی","Journal","Bilimsel dergi","المجلة العلمية")}</Link></li><li><Link href="/about" className="transition hover:text-white">{navT("about")}</Link></li><li><Link href="/contact" className="transition hover:text-white">{navT("contact")}</Link></li>{pages.slice(0,3).map((p)=><li key={p.slug}><Link href={`/${p.slug}`} className="transition hover:text-white">{locale==="fa"?p.titleFa:locale==="tr"?p.titleTr:locale==="ar"?p.titleAr:p.titleEn}</Link></li>)}</ul></div>

          <div><h3 className="mb-4 text-sm font-black text-white">{l(locale,"خدمات مشتریان","Customer care","Müşteri hizmetleri","خدمة العملاء")}</h3><ul className="space-y-3 text-sm text-white/58"><li><Link href="/club" className="transition hover:text-white">{l(locale,"باشگاه مشتریان","Customer Club","Müşteri Kulübü","نادي العملاء")}</Link></li><li><Link href="/order-tracking" className="transition hover:text-white">{l(locale,"رهگیری سفارش","Order Tracking","Sipariş Takibi","تتبع الطلب")}</Link></li><li><Link href="/support" className="transition hover:text-white">{l(locale,"مرکز پشتیبانی","Support Center","Destek Merkezi","مركز الدعم")}</Link></li><li><Link href="/warranty" className="transition hover:text-white">{l(locale,"گارانتی و خدمات پس از فروش","Warranty & After-sales","Garanti ve satış sonrası","الضمان وما بعد البيع")}</Link></li><li><Link href="/faq" className="transition hover:text-white">{l(locale,"سوالات متداول","FAQ","SSS","الأسئلة الشائعة")}</Link></li></ul></div>

          <div><h3 className="mb-4 text-sm font-black text-white">{t("contactTitle")}</h3><ul className="space-y-4 text-sm text-white/62">{settings.contactPhone?<li className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/8 text-[#82cfff]"><Phone className="h-4 w-4"/></span><span dir="ltr">{settings.contactPhone}</span></li>:null}{settings.contactEmail?<li className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/8 text-[#82cfff]"><Mail className="h-4 w-4"/></span><span dir="ltr" className="break-all">{settings.contactEmail}</span></li>:null}{settings.address?<li className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/8 text-[#82cfff]"><MapPin className="h-4 w-4"/></span><span className="leading-6">{settings.address}</span></li>:null}{!hasContactDetails?<li><p className="text-xs leading-6 text-white/55">{l(locale,"اطلاعات تماس پس از ثبت در تنظیمات سایت اینجا نمایش داده می‌شود. برای ارتباط مستقیم از صفحه تماس استفاده کنید.","Verified contact details will appear here once configured. Use the contact page to reach our team now.","Doğrulanmış iletişim bilgileri ayarlanınca burada görünür. Şimdilik iletişim sayfasını kullanabilirsiniz.","ستظهر بيانات التواصل الموثقة هنا بعد إعدادها. استخدم صفحة التواصل حالياً للوصول إلى الفريق.")}</p><Link href="/contact" className="mt-3 inline-flex rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-xs font-black text-white transition hover:bg-white/14">{navT("contact")}</Link></li>:null}</ul></div>
        </div>

        <div className="mt-10 grid gap-3 border-t border-white/10 pt-7 sm:grid-cols-3">{[[ShieldCheck,l(locale,"تضمین اصالت تجهیزات","Authenticity assurance","Orijinallik güvencesi","ضمان الأصالة")],[Truck,l(locale,"تحویل ایمن و مطمئن","Safe delivery","Güvenli teslimat","توصيل آمن")],[Stethoscope,l(locale,"مشاوره و پشتیبانی تخصصی","Specialist support","Uzman destek","دعم متخصص")]].map(([Icon,label])=>{const I=Icon as typeof ShieldCheck;return <div key={String(label)} className="flex items-center gap-3 rounded-xl bg-white/[.045] px-4 py-3 text-xs font-bold text-white/68"><I className="h-4 w-4 shrink-0 text-[#82cfff]"/>{label as string}</div>;})}</div>
      </div>
      <div className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-[11px] text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><p>© {new Date().getFullYear()} {brandT("subBrand")} — {t("rights")}</p><p>VITALIS MedTech System</p></div></div>
    </footer>
  );
}
