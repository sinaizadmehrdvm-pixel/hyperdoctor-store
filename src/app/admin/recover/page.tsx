import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { loginAdmin, recoverAdminPassword } from "@/lib/admin-auth";

async function recoverAction(formData: FormData) {
  "use server";
  const token = String(formData.get("token") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!token || password !== confirm || password.length < 12) {
    redirect(`/admin/recover?token=${encodeURIComponent(token)}&error=password`);
  }

  try {
    await recoverAdminPassword({ token, email, password });
    const session = await loginAdmin(email, password);
    if (!session) redirect("/admin/login?error=1");
  } catch {
    redirect(`/admin/recover?token=${encodeURIComponent(token)}&error=token`);
  }

  redirect("/admin");
}

export default async function RecoverPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const q = await searchParams;
  const token = q.token || "";
  const error = q.error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#001736] p-5" dir="rtl">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
        <h1 className="text-3xl font-black text-[#001736]">بازیابی امن پنل مدیریت</h1>
        <p className="mt-2 text-sm leading-6 text-[#747780]">
          رمز جدید را برای حساب Super Admin تعیین کنید. کد بازیابی یک‌بارمصرف است و پس از استفاده، نشست‌های قبلی باطل می‌شوند.
        </p>

        <form action={recoverAction} className="mt-7 space-y-4">
          <input name="token" type="hidden" value={token} />

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-black">ایمیل مدیر</span>
            <input
              name="email"
              type="email"
              dir="ltr"
              autoComplete="username"
              required
              className="h-12 rounded-xl border bg-[#f7fafd] px-3.5"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-black">رمز عبور جدید</span>
            <input
              name="password"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              minLength={12}
              required
              className="h-12 rounded-xl border bg-[#f7fafd] px-3.5"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-black">تکرار رمز عبور جدید</span>
            <input
              name="confirm"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              minLength={12}
              required
              className="h-12 rounded-xl border bg-[#f7fafd] px-3.5"
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
              {error === "password"
                ? "رمزها باید یکسان و حداقل ۱۲ کاراکتر باشند."
                : "کد بازیابی نامعتبر یا منقضی شده است، یا اطلاعات حساب صحیح نیست."}
            </div>
          ) : null}

          {!token ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">
              لینک بازیابی معتبر نیست.
            </div>
          ) : null}

          <button
            disabled={!token}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#ba0036] text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <KeyRound className="h-4 w-4" />
            ثبت رمز جدید و ورود
          </button>
        </form>
      </div>
    </main>
  );
}
