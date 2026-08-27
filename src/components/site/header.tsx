import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getNavPages, getSiteSettings } from "@/lib/site-data";
import { HyperDoctorLogo } from "./logo";
import { LocaleSwitcher } from "./locale-switcher";
import { CartBadge } from "./cart-badge";
import { MobileNav } from "./mobile-nav";

function localizedPageTitle(
  page: { titleFa: string; titleTr?: string | null; titleEn: string; titleAr?: string | null },
  locale: string,
) {
  if (locale === "tr") return page.titleTr || page.titleEn || page.titleFa;
  if (locale === "ar") return page.titleAr || page.titleFa || page.titleEn;
  if (locale === "en") return page.titleEn || page.titleFa;
  return page.titleFa || page.titleEn;
}

export async function Header() {
  const locale = await getLocale();
  const t = await getTranslations("nav");
  const brandT = await getTranslations("brand");
  const [pages, settings] = await Promise.all([getNavPages(), getSiteSettings()]);

  const navItems = [
    { href: "/", label: t("home") },
    { href: "/shop", label: t("shop") },
    { href: "/services", label: t("services") },
    ...pages.map((p) => ({
      href: `/${p.slug}`,
      label: localizedPageTitle(p, locale),
    })),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy/95 text-navy-foreground shadow-[0_10px_35px_rgba(0,23,54,0.12)] backdrop-blur-xl">
      <div className="vitalis-container flex min-h-18 items-center justify-between gap-3 py-3">
        <Link href="/" className="shrink-0 rounded-xl vitalis-focus">
          <HyperDoctorLogo
            tagline={brandT("tagline")}
            name={settings.subBrandName}
            logoUrl={settings.subBrandLogoUrl}
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-h-11 flex items-center px-4 rounded-full text-sm font-medium text-navy-muted hover:text-white hover:bg-white/8 transition-colors vitalis-focus"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher className="hidden md:flex" />
          <CartBadge />
          <MobileNav items={navItems} />
        </div>
      </div>
    </header>
  );
}
