import { UserRound } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSiteSettings } from "@/lib/site-data";
import { getCustomerSession } from "@/lib/customer-auth";
import { HyperDoctorLogo } from "./logo";
import { LocaleSwitcher } from "./locale-switcher";
import { BranchSwitcher } from "./branch-switcher";
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
    { href: "/services", label: t("services") },
    { href: "/club", label: l(locale, "باشگاه مشتریان", "Customer Club", "Müşteri Kulübü", "نادي العملاء") },
    { href: "/articles", label: l(locale, "مقالات", "Articles", "Makaleler", "المقالات") },
    { href: "/about", label: t("about") },
  ];

  const mobileItems = [
    ...navItems,
    { href: "/order-tracking", label: l(locale, "رهگیری سفارش", "Track order", "Sipariş takibi", "تتبع الطلب") },
    {
      href: customer ? "/account" : "/account/login",
      label: customer
        ? l(locale, "حساب من", "My account", "Hesabım", "حسابي")
        : l(locale, "ورود / ثبت‌نام", "Sign in / Register", "Giriş / Kayıt", "دخول / تسجيل"),
    },
  ];

  const primaryNavLabel = l(locale, "ناوبری اصلی", "Primary navigation", "Ana gezinme", "التنقل الرئيسي");
  const accountLabel = customer
    ? l(locale, "حساب کاربری", "Account", "Hesap", "الحساب")
    : l(locale, "ورود", "Sign in", "Giriş", "تسجيل الدخول");

  return (
    <header className="sticky top-0 z-50 border-b border-[#c4c6d0]/35 bg-white/88 text-[#001736] shadow-[0_6px_24px_rgba(0,23,54,0.06)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/78">
      <div className="vitalis-container flex min-h-18 items-center justify-between gap-2 py-2.5 xl:gap-3">
        <Link href="/" className="vitalis-focus shrink-0 rounded-xl" aria-label={settings.subBrandName || "Hyper Doctor"}>
          <HyperDoctorLogo tagline={brandT("tagline")} name={settings.subBrandName} logoUrl={settings.subBrandLogoUrl} />
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:flex" aria-label={primaryNavLabel}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="vitalis-focus flex min-h-10 min-w-0 items-center rounded-full px-2.5 text-[11px] font-bold text-[#43474f] transition-colors hover:bg-[#f1f4f7] hover:text-[#001736] 2xl:px-3 2xl:text-xs"
            >
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <BranchSwitcher />
          <Link
            href="/contact"
            className="vitalis-focus hidden min-h-10 items-center rounded-full border border-[#c4c6d0]/60 bg-white px-3 text-xs font-bold text-[#001736] shadow-sm transition hover:border-[#9aa0aa] hover:bg-[#f1f4f7] 2xl:flex"
          >
            {l(locale, "مشاوره تخصصی", "Specialist advice", "Uzman danışmanlık", "استشارة متخصصة")}
          </Link>
          <Link
            href={customer ? "/account" : "/account/login"}
            aria-label={accountLabel}
            className="vitalis-focus hidden h-10 items-center gap-2 rounded-full border border-[#c4c6d0]/60 bg-white px-3 text-xs font-black text-[#001736] shadow-sm transition hover:border-[#9aa0aa] hover:bg-[#f1f4f7] sm:flex"
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
            {customer ? (
              <span className="hidden max-w-28 truncate 2xl:inline">{customer.fullName}</span>
            ) : (
              <span className="hidden 2xl:inline">{l(locale, "ورود", "Sign in", "Giriş", "دخول")}</span>
            )}
          </Link>
          <LocaleSwitcher className="hidden md:flex" />
          <CartBadge />
          <MobileNav items={mobileItems} />
        </div>
      </div>
    </header>
  );
}
