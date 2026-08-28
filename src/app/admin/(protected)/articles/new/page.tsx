import { ArticleForm } from "@/components/admin/article-form";
import { currentAdminLocale } from "@/lib/admin-locale-server";
const title={fa:"مقاله جدید",ar:"مقالة جديدة",en:"New article",tr:"Yeni makale"} as const;
export default async function NewArticlePage(){const locale=await currentAdminLocale();return <div><h1 className="mb-6 text-xl font-bold text-foreground">{title[locale]}</h1><ArticleForm locale={locale}/></div>}
