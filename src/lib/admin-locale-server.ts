import { cookies } from "next/headers";
import { getAdminLocale } from "@/lib/admin-i18n";
export async function currentAdminLocale(){const store=await cookies();return getAdminLocale(store.get("hd_admin_locale")?.value);}
