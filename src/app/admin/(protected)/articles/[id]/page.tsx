import { notFound } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";
import { ArticleForm } from "@/components/admin/article-form";

type Article={id:string;slug:string;titleFa:string;titleTr:string;titleEn:string;titleAr:string;excerptFa:string;excerptTr:string;excerptEn:string;excerptAr:string;contentFa:string;contentTr:string;contentEn:string;contentAr:string;coverImage:string;category:string;tags:string;isPublished:boolean};
export default async function EditArticlePage({params}:{params:Promise<{id:string}>}){const {id}=await params;const article=await adminRpc<Article|null>("admin_article_detail",{p_id:id});if(!article)notFound();return <div><h1 className="mb-6 text-xl font-bold text-foreground">ویرایش مقاله</h1><ArticleForm article={article}/></div>}
