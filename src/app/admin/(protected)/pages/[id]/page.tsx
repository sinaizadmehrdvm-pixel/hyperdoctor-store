import { notFound } from "next/navigation";
import { PageForm } from "@/components/admin/page-form";
import { adminRpc } from "@/lib/admin-data";
import { currentAdminLocale } from "@/lib/admin-locale-server";

type PageValue={id:string;slug:string;titleFa:string;titleTr:string;titleEn:string;titleAr:string;contentFa:string;contentTr:string;contentEn:string;contentAr:string;template:string;isPublished:boolean;showInNav:boolean;navOrder:number};
const title={fa:"ویرایش صفحه",ar:"تعديل الصفحة",en:"Edit page",tr:"Sayfayı düzenle"} as const;
export default async function EditPagePage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const [page,locale]=await Promise.all([adminRpc<PageValue|null>("admin_page_detail",{p_id:id}),currentAdminLocale()]);
  if(!page) notFound();
  return <div><h1 className="mb-6 text-xl font-bold text-foreground">{title[locale]}</h1><PageForm page={page} locale={locale}/></div>;
}
