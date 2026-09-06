import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { routing } from "@/i18n/routing";
import { CartProvider } from "@/lib/cart-context";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import "../globals.css";

// Locale pages depend on live PostgreSQL data through the shared Header/Footer.
// Keep them dynamic so a temporary database/auth issue never makes the Vercel
// build fail during static prerendering. Database access now happens at request time.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const vazirmatn = localFont({
  src: "../../fonts/Vazirmatn-Variable.ttf",
  variable: "--font-vazirmatn",
  display: "swap",
  weight: "100 900",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function siteOrigin(){const raw=process.env.NEXT_PUBLIC_SITE_URL||"https://hyperdoctor-store.vercel.app";try{return new URL(raw).origin}catch{return "https://hyperdoctor-store.vercel.app"}}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "brand" });
  const base=siteOrigin();
  return {
    metadataBase:new URL(base),
    title: `${t("subBrand")} | ${t("holding")}`,
    description: t("tagline"),
    alternates:{canonical:`/${locale}`,languages:{fa:"/fa",tr:"/tr",en:"/en",ar:"/ar","x-default":"/fa"}},
    robots:{index:true,follow:true},
    openGraph:{type:"website",url:`/${locale}`,title:`${t("subBrand")} | ${t("holding")}`,description:t("tagline"),siteName:t("subBrand"),locale},
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const dir = locale === "fa" || locale === "ar" ? "rtl" : "ltr";
  const skip=locale==="fa"?"رفتن به محتوای اصلی":locale==="ar"?"الانتقال إلى المحتوى الرئيسي":locale==="tr"?"Ana içeriğe geç":"Skip to main content";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${vazirmatn.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="fixed start-3 top-3 z-[9999] -translate-y-24 rounded-xl bg-[#001736] px-4 py-3 text-sm font-black text-white shadow-xl transition focus:translate-y-0">{skip}</a>
        <NextIntlClientProvider>
          <CartProvider>
            <Header />
            <div id="main-content" tabIndex={-1} className="contents">{children}</div>
            <Footer />
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
