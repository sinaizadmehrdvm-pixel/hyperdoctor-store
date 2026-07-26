import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { auth, signOut } from "@/auth";
import { AdminSidebar } from "@/components/admin/sidebar";
import { HyperDoctorLogo } from "@/components/site/logo";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-e border-border bg-card md:block">
        <div className="flex h-16 items-center px-5">
          <HyperDoctorLogo />
        </div>
        <AdminSidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-5">
          <span className="text-sm font-medium text-muted">
            {session.user?.name ?? session.user?.email}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button
              type="submit"
              className="flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted hover:bg-muted-bg cursor-pointer"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              خروج
            </button>
          </form>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
