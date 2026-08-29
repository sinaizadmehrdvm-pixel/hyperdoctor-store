"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";
import { localDateTimeToISO } from "@/lib/calendar";
import { getBusinessTimeZone } from "@/lib/site-data";
import { slugify } from "@/lib/slug";

export async function upsertArticle(formData:FormData){
  const id=String(formData.get("id")||"");
  const isPublished=formData.get("isPublished")==="on";
  const rawPublishedAt=String(formData.get("publishedAt")||"").trim();
  const timeZone=await getBusinessTimeZone();
  const publishedAt=rawPublishedAt?localDateTimeToISO(rawPublishedAt,timeZone):"";
  if(rawPublishedAt&&!publishedAt)throw new Error("Invalid article publication date/time");

  await adminRpc<string>("admin_upsert_article",{p_data:{
    id,
    slug:slugify(String(formData.get("slug")||formData.get("titleEn")||formData.get("titleFa"))),
    titleFa:String(formData.get("titleFa")||""),titleTr:String(formData.get("titleTr")||""),titleEn:String(formData.get("titleEn")||""),titleAr:String(formData.get("titleAr")||""),
    excerptFa:String(formData.get("excerptFa")||""),excerptTr:String(formData.get("excerptTr")||""),excerptEn:String(formData.get("excerptEn")||""),excerptAr:String(formData.get("excerptAr")||""),
    contentFa:String(formData.get("contentFa")||""),contentTr:String(formData.get("contentTr")||""),contentEn:String(formData.get("contentEn")||""),contentAr:String(formData.get("contentAr")||""),
    coverImage:String(formData.get("coverImage")||""),category:String(formData.get("category")||""),tags:String(formData.get("tags")||"[]"),isPublished,publishedAt
  }});
  revalidatePath("/admin/articles"); revalidatePath("/","layout"); redirect("/admin/articles");
}
export async function deleteArticle(id:string){await adminRpc<boolean>("admin_delete_article",{p_id:id});revalidatePath("/admin/articles");revalidatePath("/","layout");}
