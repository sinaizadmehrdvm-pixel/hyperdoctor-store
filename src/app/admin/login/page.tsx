import { redirect } from "next/navigation";
import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { HyperDoctorLogo } from "@/components/site/logo";
import { adminBootstrapStatus, getAdminSession, loginAdmin } from "@/lib/admin-auth";

async function loginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  try {
    const session = await loginAdmin(email, password);
    if (!session) redirect("/admin/login?error=1");
  } catch {
    redirect("/admin/login?error=1");
  }
  redirect("/admin");
}

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [session, bootstrap, query] = await Promise.all([
    getAdminSession(),
    adminBootstrapStatus().catch(() => ({ initialized: true })),
    searchParams,
  ]);
  if (session) redirect("/admin");
  if (!bootstrap.initialized) redirect("/admin/setup");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#001736] p-5" dir="rtl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,157,216,.28),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(186,0,54,.18),transparent_32%)]" />
      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-[0_35px_100px_rgba(0,0,0,.28)] lg:grid-cols-[.9fr_1.1fr]">
        <section className="hidden flex-col justify-between bg-[#001736] p-10 text-white lg:flex">
          <div>
            <span className="inline-flex rounded-2xl bg-white p-2.5 text-[#001736]"><HyperDoctorLogo /></span>
            <p className="mt-10 text-xs font-black uppercase tracking-[.18em] text-[#82cfff]">VITALIS MEDTECH ADMIN</p>
            <h1 className="mt-4 text-4xl font-black leading-[1.35]">مرکز فرماندهی Hyper Doctor</h1>
            <p className="mt-5 max-w-md text-sm leading-8 text-[#d6e3ff]/78">مدیریت محصولات، سفارش‌ها، خدمات، موجودی، پشتیبانی، گارانتی و محتوای سایت در یک پنل امن.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"><div className="flex items-center gap-2 text-xs font-black text-[#82cfff]"><ShieldCheck className="h-4 w-4" />Secure admin session</div><p className="mt-2 text-xs leading-6 text-white/65">نشست مدیریت در کوکی HttpOnly نگهداری می‌شود و Hash رمز عبور از دیتابیس خارج نمی‌شود.</p></div>
        </section>

        <section className="p-7 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-md">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d6e3ff] text-[#002b5b]"><LockKeyhole className="h-6 w-6" /></span>
            <h2 className="mt-6 text-3xl font-black text-[#001736]">ورود مدیر</h2>
            <p className="mt-2 text-sm leading-7 text-[#747780]">برای ورود، ایمیل و رمز حساب مدیریت را وارد کنید.</p>

            <form action={loginAction} className="mt-7 space-y-4">
              <label className="flex flex-col gap-1.5"><span className="text-xs font-black text-[#5f6570]">ایمیل</span><input name="email" type="email" dir="ltr" autoComplete="username" required className="h-12 rounded-xl border border-[#c4c6d0] bg-[#f7fafd] px-3.5 text-sm text-[#001736] outline-none focus:border-[#009dd8] focus:ring-2 focus:ring-[#009dd8]/10" /></label>
              <label className="flex flex-col gap-1.5"><span className="text-xs font-black text-[#5f6570]">رمز عبور</span><input name="password" type="password" dir="ltr" autoComplete="current-password" required className="h-12 rounded-xl border border-[#c4c6d0] bg-[#f7fafd] px-3.5 text-sm text-[#001736] outline-none focus:border-[#009dd8] focus:ring-2 focus:ring-[#009dd8]/10" /></label>
              {query.error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">ایمیل یا رمز عبور صحیح نیست، یا ورود موقتاً محدود شده است.</div> : null}
              <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#002b5b] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(0,43,91,.18)] transition hover:bg-[#001736]"><KeyRound className="h-4 w-4" />ورود امن</button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
