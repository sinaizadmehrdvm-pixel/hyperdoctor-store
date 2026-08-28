import { UserRound } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSiteSettings } from "@/lib/site-data";
import { getCustomerSession } from "@/lib/customer-auth";
import { HyperDoctorLogo } from "./logo";
import { LocaleSwitcher } from "./locale-switcher";
import { CartBadge } from "./cart-badge";
import { MobileNav } from "./mobile-nav";

function l(locale: string, fa: string, en: string, tr: string, ar: string) {
  if (locale === "en") return en;
  if (locale === "tr") return tr;
  if (locale === "ar") return ar;
  return fa;
}

export async function Header() {
  const locale = await getLocale();
  const t = await getTranslations("nav");
  const brandT = await getTranslations("brand");
  const [settings, customer] = await Promise.all([getSiteSettings(), getCustomerSession()]);

  const navItems = [
    { href: "/", label: t("home") },
    { href: "/shop", label: t("shop") },
    { href: "/shop/respiratory-sleep", label: l(locale, "تجهیزات تخصصی", "Specialist Equipment", "Uzman Ekipman", "معدات متخصصة") },
    { href: "/services", label: t("services") },
    { href: "/club", label: l(locale, "باشگاه مشتریان", "Customer Club", "Müşteri Kulübü", "نادي العملاء") },
    { href: "/articles", label: l(locale, "مقالات", "Articles", "Makaleler", "المقالات") },
    { href: "/about", label: t("about") },
  ];
  const mobileItems=[...navItems,
    {href:"/order-tracking",label:l(locale,"رهگیری سفارش","Track order","Sipariş takibi","تتبع الطلب")},
    {href:customer?"/account":"/account/login",label:customer?l(locale,"حساب من","My account","Hesabım","حسابي"):l(locale,"ورود / ثبت‌نام","Sign in / Register","Giriş / Kayıt","دخول / تسجيل")}
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#c4c6d0]/35 bg-white/85 text-[#001736] shadow-[0_6px_24px_rgba(0,23,54,0.06)] backdrop-blur-xl">
      <div className="vitalis-container flex min-h-18 items-center justify-between gap-3 py-2.5">
        <Link href="/" className="shrink-0 rounded-xl vitalis-focus"><HyperDoctorLogo tagline={brandT("tagline")} name={settings.subBrandName} logoUrl={settings.subBrandLogoUrl}/></Link>
        <nav className="hidden 2xl:flex items-center gap-0.5" aria-label="Primary navigation">
          {navItems.map((item) => <Link key={item.href} href={item.href} className="min-h-10 flex items-center rounded-full px-3 text-xs font-bold text-[#43474f] transition-colors hover:bg-[#f1f4f7] hover:text-[#001736] vitalis-focus">{item.label}</Link>)}
        </nav>
        <div className="flex items-center gap-1.5">
          <Link href="/contact" className="hidden min-h-10 items-center rounded-full border border-[#c4c6d0]/60 bg-white px-3 text-xs font-bold text-[#001736] transition hover:bg-[#f1f4f7] xl:flex">{l(locale, "مشاوره رایگان", "Free consultation", "Ücretsiz danışmanlık", "استشارة مجانية")}</Link>
          <Link href={customer?"/account":"/account/login"} aria-label={customer?"Account":"Login"} className="hidden h-10 items-center gap-2 rounded-full border border-[#c4c6d0]/60 bg-white px-3 text-xs font-black text-[#001736] transition hover:bg-[#f1f4f7] sm:flex"><UserRound className="h-4 w-4"/>{customer?<span className="hidden lg:inline">{customer.fullName}</span>:<span className="hidden lg:inline">{l(locale,"ورود","Sign in","Giriş","دخول")}</span>}</Link>
          <LocaleSwitcher className="hidden md:flex" />
          <CartBadge />
          <MobileNav items={mobileItems} />
        </div>
      </div>
    </header>
  );
}
