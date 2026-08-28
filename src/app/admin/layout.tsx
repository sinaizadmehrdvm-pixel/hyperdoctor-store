import type { Metadata } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import "../globals.css";

const vazirmatn = localFont({
  src: "../../fonts/Vazirmatn-Variable.ttf",
  variable: "--font-vazirmatn",
  display: "swap",
  weight: "100 900",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const supported = new Set(["fa", "ar", "en", "tr"]);

export const metadata: Metadata = {
  title: "Hyper Doctor Admin",
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const raw = cookieStore.get("hd_admin_locale")?.value || "fa";
  const locale = supported.has(raw) ? raw : "fa";
  const dir = locale === "fa" || locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${vazirmatn.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-muted-bg text-foreground">
        {children}
      </body>
    </html>
  );
}
