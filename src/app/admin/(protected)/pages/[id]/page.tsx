import { notFound } from "next/navigation";
import { PageForm } from "@/components/admin/page-form";
import { adminRpc } from "@/lib/admin-data";

type PageValue={id:string;slug:string;titleFa:string;titleTr:string;titleEn:string;titleAr:string;contentFa:string;contentTr:string;contentEn:string;contentAr:string;template:string;isPublished:boolean;showInNav:boolean;navOrder:number};

export default async function EditPagePage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const page=await adminRpc<PageValue|null>("admin_page_detail",{p_id:id});
  if(!page) notFound();
  return <div><h1 className="mb-6 text-xl font-bold text-foreground">ویرایش صفحه</h1><PageForm page={page}/></div>;
}
