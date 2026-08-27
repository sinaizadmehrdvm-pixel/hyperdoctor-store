import { redirect } from "next/navigation";
import { KeyRound, ShieldCheck, UserRoundPlus } from "lucide-react";
import { HyperDoctorLogo } from "@/components/site/logo";
import { adminBootstrapStatus, bootstrapFirstAdmin, loginAdmin } from "@/lib/admin-auth";

async function setupAction(formData: FormData) {
  "use server";
  const token = String(formData.get("token") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");
  if (password !== confirm || password.length < 12) redirect("/admin/setup?error=password");
  try {
    await bootstrapFirstAdmin({ token, email, password, name });
    const session = await loginAdmin(email, password);
    if (!session) redirect("/admin/login");
  } catch {
    redirect("/admin/setup?error=token");
  }
  redirect("/admin");
}

export default async function AdminSetupPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const [status, query] = await Promise.all([adminBootstrapStatus(), searchParams]);
  if (status.initialized) redirect("/admin/login");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#001736] p-5" dir="rtl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(0,157,216,.30),transparent_30%),radial-gradient(circle_at_80%_85%,rgba(186,0,54,.16),transparent_35%)]" />
      <div className="relative z-10 w-full max-w-xl rounded-[2rem] border border-white/10 bg-white p-7 shadow-[0_35px_100px_rgba(0,0,0,.28)] sm:p-10">
        <div className="flex items-center justify-between gap-4"><span className="rounded-2xl bg-[#f1f4f7] p-2"><HyperDoctorLogo /></span><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d6e3ff] text-[#002b5b]"><UserRoundPlus className="h-5 w-5" /></span></div>
        <p className="mt-7 text-xs font-black uppercase tracking-[.18em] text-[#009dd8]">ONE-TIME ADMIN INITIALIZATION</p>
        <h1 className="mt-3 text-3xl font-black text-[#001736]">ساخت اولین مدیر</h1>
        <p className="mt-3 text-sm leading-7 text-[#5f6570]">این صفحه فقط تا قبل از ساخته‌شدن اولین مدیر فعال است. کد راه‌اندازی یک‌بارمصرف است و پس از ایجاد حساب دیگر قابل استفاده نخواهد بود.</p>

        <form action={setupAction} className="mt-7 space-y-4">
          <label className="flex flex-col gap-1.5"><span className="text-xs font-black text-[#5f6570]">کد راه‌اندازی یک‌بارمصرف</span><input name="token" defaultValue={query.token || ""} required dir="ltr" autoComplete="off" className="h-12 rounded-xl border border-[#c4c6d0] bg-[#f7fafd] px-3.5 font-mono text-xs text-[#001736] outline-none focus:border-[#009dd8]" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-xs font-black text-[#5f6570]">نام مدیر</span><input name="name" required minLength={2} maxLength={120} autoComplete="name" className="h-12 rounded-xl border border-[#c4c6d0] bg-[#f7fafd] px-3.5 text-sm text-[#001736] outline-none focus:border-[#009dd8]" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-xs font-black text-[#5f6570]">ایمیل</span><input name="email" type="email" required dir="ltr" autoComplete="email" className="h-12 rounded-xl border border-[#c4c6d0] bg-[#f7fafd] px-3.5 text-sm text-[#001736] outline-none focus:border-[#009dd8]" /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="flex flex-col gap-1.5"><span className="text-xs font-black text-[#5f6570]">رمز عبور</span><input name="password" type="password" required minLength={12} autoComplete="new-password" dir="ltr" className="h-12 rounded-xl border border-[#c4c6d0] bg-[#f7fafd] px-3.5 text-sm text-[#001736] outline-none focus:border-[#009dd8]" /></label><label className="flex flex-col gap-1.5"><span className="text-xs font-black text-[#5f6570]">تکرار رمز</span><input name="confirm" type="password" required minLength={12} autoComplete="new-password" dir="ltr" className="h-12 rounded-xl border border-[#c4c6d0] bg-[#f7fafd] px-3.5 text-sm text-[#001736] outline-none focus:border-[#009dd8]" /></label></div>
          {query.error === "password" ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">رمزها باید یکسان و حداقل ۱۲ کاراکتر باشند.</div> : null}
          {query.error === "token" ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">کد راه‌اندازی نامعتبر یا منقضی شده است.</div> : null}
          <div className="rounded-xl border border-[#d9e6f8] bg-[#f5f9ff] p-3 text-xs leading-6 text-[#34506f]"><ShieldCheck className="me-2 inline h-4 w-4 text-[#009dd8]" />رمز با bcrypt در PostgreSQL Hash می‌شود و در پاسخ API یا Session نمایش داده نمی‌شود.</div>
          <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#ba0036] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(186,0,54,.18)] hover:bg-[#e80346]"><KeyRound className="h-4 w-4" />ایجاد Super Admin</button>
        </form>
      </div>
    </main>
  );
}
