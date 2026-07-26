import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, auth } from "@/auth";
import { HyperDoctorLogo } from "@/components/site/logo";

async function loginAction(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/admin/login?error=1");
    }
    throw error;
  }
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex justify-center">
          <HyperDoctorLogo />
        </div>
        <h1 className="mt-6 text-center text-lg font-bold text-foreground">
          ورود به پنل مدیریت
        </h1>

        <form action={loginAction} className="mt-6 space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">ایمیل</span>
            <input
              name="email"
              type="email"
              dir="ltr"
              required
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">رمز عبور</span>
            <input
              name="password"
              type="password"
              dir="ltr"
              required
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </label>

          {error ? (
            <p className="text-sm text-accent">ایمیل یا رمز عبور اشتباه است.</p>
          ) : null}

          <button
            type="submit"
            className="min-h-11 w-full cursor-pointer rounded-lg bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            ورود
          </button>
        </form>
      </div>
    </main>
  );
}
