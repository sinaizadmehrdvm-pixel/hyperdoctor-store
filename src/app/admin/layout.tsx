import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";

const vazirmatn = localFont({
  src: "../../fonts/Vazirmatn-Variable.ttf",
  variable: "--font-vazirmatn",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "پنل مدیریت | هایپر دکتر",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full antialiased`}>
      <body className="min-h-full bg-muted-bg text-foreground" style={{ fontFamily: "var(--font-vazirmatn), system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
