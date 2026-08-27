import { redirect } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { HyperDoctorLogo } from "@/components/site/logo";
import { logoutAdmin, requireAdminSession } from "@/lib/admin-auth";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();

  return (
    <div className="flex min-h-screen bg-[#f5f8fb] text-[#001736]" dir="rtl">
      <aside className="hidden w-72 shrink-0 border-e border-white/10 bg-[#001736] text-white shadow-[12px_0_35px_rgba(0,23,54,.08)] md:block">
        <div className="flex h-20 items-center border-b border-white/10 px-5">
          <div className="rounded-2xl bg-white p-2 text-[#001736]"><HyperDoctorLogo /></div>
        </div>
        <div className="px-3 py-5"><AdminSidebar /></div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-4 border-b border-[#dfe4ea] bg-white/90 px-5 shadow-[0_8px_30px_rgba(0,23,54,.04)] backdrop-blur-xl sm:px-7">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-black text-[#009dd8]"><ShieldCheck className="h-4 w-4" />VITALIS · Hyper Doctor Admin</div>
            <p className="mt-1 truncate text-sm font-black text-[#001736]">{session.name || session.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-[#dfe4ea] bg-[#f7fafd] px-3 py-1.5 text-[11px] font-black text-[#5f6570] sm:inline-flex">{session.role}</span>
            <form action={async () => { "use server"; await logoutAdmin(); redirect("/admin/login"); }}>
              <button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#dfe4ea] bg-white px-3 text-xs font-black text-[#5f6570] transition hover:border-[#ba0036]/40 hover:text-[#ba0036]">
                <LogOut className="h-4 w-4" aria-hidden="true" />خروج
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
