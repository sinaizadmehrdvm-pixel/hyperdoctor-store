import { PageForm } from "@/components/admin/page-form";
import { currentAdminLocale } from "@/lib/admin-locale-server";
const title={fa:"صفحه جدید",ar:"صفحة جديدة",en:"New page",tr:"Yeni sayfa"} as const;
export default async function NewPagePage() {const locale=await currentAdminLocale();return <div><h1 className="mb-6 text-xl font-bold text-foreground">{title[locale]}</h1><PageForm locale={locale}/></div>}
