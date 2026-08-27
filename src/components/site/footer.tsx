import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Phone, Mail, MapPin } from "lucide-react";
import { getNavPages, getSiteSettings } from "@/lib/site-data";
import { HyperDoctorLogo, VetrixMark } from "./logo";

function l(locale:string,fa:string,en:string,tr:string,ar:string){if(locale==="en")return en;if(locale==="tr")return tr;if(locale==="ar")return ar;return fa;}

export async function Footer() {
  const locale = await getLocale();
  const t = await getTranslations("footer");
  const navT = await getTranslations("nav");
  const brandT = await getTranslations("brand");
  const [pages, settings] = await Promise.all([getNavPages(), getSiteSettings()]);

  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 grid gap-10 md:grid-cols-3">
        <div>
          <HyperDoctorLogo tagline={brandT("tagline")} name={settings.subBrandName} logoUrl={settings.subBrandLogoUrl}/>
          <p className="mt-4 max-w-sm text-sm leading-7 text-navy-muted">{t("about")}</p>
          <div className="mt-6 flex items-center gap-2 text-xs text-navy-muted">
            <span>{l(locale,"زیرمجموعه","Part of","Bir parçası","جزء من")}</span>
            <VetrixMark className="h-5 w-5" logoUrl={settings.holdingLogoUrl} name={settings.holdingName} />
            <span className="font-semibold text-navy-foreground">{settings.holdingName}</span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-4">{t("quickLinks")}</h3>
          <ul className="space-y-2.5 text-sm text-navy-muted">
            <li><Link href="/shop" className="hover:text-white transition-colors">{navT("shop")}</Link></li>
            <li><Link href="/services" className="hover:text-white transition-colors">{navT("services")}</Link></li>
            <li><Link href="/club" className="hover:text-white transition-colors">{l(locale,"باشگاه مشتریان","Customer Club","Müşteri Kulübü","نادي العملاء")}</Link></li>
            <li><Link href="/order-tracking" className="hover:text-white transition-colors">{l(locale,"رهگیری سفارش","Order Tracking","Sipariş Takibi","تتبع الطلب")}</Link></li>
            <li><Link href="/support" className="hover:text-white transition-colors">{l(locale,"پشتیبانی","Support","Destek","الدعم")}</Link></li>
            {pages.map((p) => (
              <li key={p.slug}><Link href={`/${p.slug}`} className="hover:text-white transition-colors">{locale === "fa" ? p.titleFa : locale==="tr"?p.titleTr:locale==="ar"?p.titleAr:p.titleEn}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-4">{t("contactTitle")}</h3>
          <ul className="space-y-3 text-sm text-navy-muted">
            {settings.contactPhone ? <li className="flex items-center gap-2.5"><Phone className="h-4 w-4 shrink-0"/><span dir="ltr">{settings.contactPhone}</span></li> : null}
            {settings.contactEmail ? <li className="flex items-center gap-2.5"><Mail className="h-4 w-4 shrink-0"/><span dir="ltr">{settings.contactEmail}</span></li> : null}
            {settings.address ? <li className="flex items-start gap-2.5"><MapPin className="h-4 w-4 shrink-0 mt-0.5"/><span>{settings.address}</span></li> : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-border"><p className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 text-xs text-navy-muted">© {new Date().getFullYear()} {brandT("subBrand")} — {t("rights")}</p></div>
    </footer>
  );
}
