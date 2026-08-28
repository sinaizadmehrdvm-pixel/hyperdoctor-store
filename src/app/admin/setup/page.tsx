import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { adminBootstrapStatus } from "@/lib/admin-auth";
import { getAdminLocale,type AdminLocale } from "@/lib/admin-i18n";
import { AdminSetupForm } from "./setup-form";
const c:Record<AdminLocale,{title:string;desc:string}>={fa:{title:"راه‌اندازی مدیر",desc:"اولین حساب مدیر هایپر دکتر را ایجاد کنید."},ar:{title:"إعداد المدير",desc:"أنشئ أول حساب مدير لهايبر دكتور."},en:{title:"Admin setup",desc:"Create the first Hyper Doctor administrator account."},tr:{title:"Yönetici kurulumu",desc:"İlk Hyper Doctor yönetici hesabını oluşturun."}};
export default async function AdminSetupPage(){const status=await adminBootstrapStatus();if(status.initialized)redirect("/admin/login");const cs=await cookies();const l=getAdminLocale(cs.get("hd_admin_locale")?.value);return <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] p-6"><div className="w-full max-w-md rounded-[1.75rem] border border-[#e2e6eb] bg-white p-7 shadow-xl"><h1 className="text-2xl font-black text-[#001736]">{c[l].title}</h1><p className="mt-2 text-sm text-[#747780]">{c[l].desc}</p><AdminSetupForm/></div></main>}
