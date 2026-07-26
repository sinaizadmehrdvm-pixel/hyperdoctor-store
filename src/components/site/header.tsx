import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getNavPages, getSiteSettings } from "@/lib/site-data";
import { HyperDoctorLogo } from "./logo";
import { LocaleSwitcher } from "./locale-switcher";
import { CartBadge } from "./cart-badge";
import { MobileNav } from "./mobile-nav";

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
      label: locale === "fa" ? p.titleFa : p.titleEn,
    })),
  ];

  return (
    <header className="relative z-40 bg-navy text-navy-foreground">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <HyperDoctorLogo
            tagline={brandT("tagline")}
            name={settings.subBrandName}
            logoUrl={settings.subBrandLogoUrl}
          />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-h-11 flex items-center px-4 rounded-full text-sm font-medium text-navy-muted hover:text-white hover:bg-white/5 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher className="hidden sm:flex" />
          <CartBadge />
          <MobileNav items={navItems} />
        </div>
      </div>
    </header>
  );
}
