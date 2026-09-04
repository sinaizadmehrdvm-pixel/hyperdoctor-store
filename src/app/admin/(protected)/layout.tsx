import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Bell, LogOut, Search, ShieldCheck } from "lucide-react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminMobileNav } from "@/components/admin/mobile-nav";
import { AdminLocaleSwitcher, type AdminLocale } from "@/components/admin/locale-switcher";
import { HyperDoctorLogo } from "@/components/site/logo";
import { logoutAdmin, requireAdminSession } from "@/lib/admin-auth";
import { adminRoleLabels } from "@/lib/admin-permissions";

const copy = {
  fa: { site: "مشاهده سایت", search: "جستجو در محصولات، سفارش‌ها، مشتریان و محتوا", alerts: "اعلان‌ها", logout: "خروج" },
  ar: { site: "عرض الموقع", search: "البحث في المنتجات والطلبات والعملاء والمحتوى", alerts: "الإشعارات", logout: "تسجيل الخروج" },
  en: { site: "View site", search: "Search products, orders, customers and content", alerts: "Notifications", logout: "Logout" },
  tr: { site: "Siteyi görüntüle", search: "Ürün, sipariş, müşteri ve içerik ara", alerts: "Bildirimler", logout: "Çıkış" },
} as const;

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const [session, cookieStore] = await Promise.all([requireAdminSession(), cookies()]);
  const raw = cookieStore.get("hd_admin_locale")?.value || "fa";
  const locale: AdminLocale = raw === "ar" || raw === "en" || raw === "tr" ? raw : "fa";
  const rtl = locale === "fa" || locale === "ar";
  const t = copy[locale];

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#001736]" dir={rtl ? "rtl" : "ltr"}>
      <aside className={`fixed inset-y-0 z-40 hidden w-[246px] bg-white shadow-[0_0_35px_rgba(0,23,54,.035)] lg:flex lg:flex-col ${rtl ? "right-0 border-l border-[#e4e8ed]" : "left-0 border-r border-[#e4e8ed]"}`}>
        <div className="flex h-[82px] items-center justify-center border-b border-[#edf0f2] px-5"><div className="rounded-xl bg-white text-[#001736]"><HyperDoctorLogo /></div></div>
        <div className="flex-1 overflow-y-auto py-2"><AdminSidebar locale={locale} role={session.role} /></div>
        <div className="border-t border-[#edf0f2] p-4"><Link href={`/${locale}`} className="flex min-h-10 items-center justify-center rounded-xl bg-[#f1f4f7] px-3 text-xs font-black text-[#5f6570] transition hover:bg-[#e8edf3] hover:text-[#001736]">{t.site}</Link></div>
      </aside>

      <div className={`min-h-screen ${rtl ? "lg:mr-[246px]" : "lg:ml-[246px]"}`}>
        <header className="sticky top-0 z-30 border-b border-[#e4e8ed] bg-white/95 backdrop-blur-xl">
          <div className="flex min-h-[82px] items-center gap-3 px-4 sm:px-6 xl:px-8">
            <AdminMobileNav locale={locale} role={session.role} />
            <div className="hidden min-w-0 flex-1 md:block"><form action="/admin/search" className="relative block max-w-md"><Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9da5]" /><input name="q" minLength={2} maxLength={100} aria-label={t.search} placeholder={t.search} className="h-11 w-full rounded-full border border-[#e0e3e6] bg-[#f7fafd] ps-10 pe-4 text-xs text-[#5f6570] outline-none transition focus:border-[#009dd8] focus:bg-white" /></form></div>
            <div className="me-auto flex items-center gap-2 md:me-0">
              <AdminLocaleSwitcher locale={locale} />
              <Link href="/admin/alerts" aria-label={t.alerts} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#e0e3e6] bg-white text-[#5f6570] transition hover:border-[#009dd8]/40 hover:text-[#002b5b]"><Bell className="h-4 w-4" /></Link>
              <div className="hidden h-10 w-px bg-[#edf0f2] sm:block" />
              <div className="hidden min-w-0 sm:block"><div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[.14em] text-[#009dd8]"><ShieldCheck className="h-3.5 w-3.5" />Hyper Doctor Admin</div><p className="mt-1 max-w-[220px] truncate text-xs font-black text-[#001736]">{session.name || session.email}</p></div>
              <span className="hidden rounded-full border border-[#e0e3e6] bg-[#f7fafd] px-3 py-1.5 text-[10px] font-black text-[#747780] xl:inline-flex">{adminRoleLabels[locale][session.role]}</span>
              <form action={async () => { "use server"; await logoutAdmin(); redirect("/admin/login"); }}><button type="submit" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e0e3e6] bg-white px-3 text-xs font-black text-[#747780] transition hover:border-[#e80346]/30 hover:text-[#e80346]"><LogOut className="h-4 w-4" />{t.logout}</button></form>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 xl:p-8">{children}</main>
      </div>
    </div>
  );
}
