"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";
import { localDateTimeToISO } from "@/lib/calendar";

function scheduleValue(formData: FormData, name: string) {
  const raw = String(formData.get(name) || "");
  if (!raw) return "";
  const iso = localDateTimeToISO(raw);
  if (!iso) throw new Error(`Invalid ${name} date/time`);
  return iso;
}

export async function upsertBanner(formData:FormData){
  const startsAt = scheduleValue(formData, "startsAt");
  const endsAt = scheduleValue(formData, "endsAt");
  if (startsAt && endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    throw new Error("Banner end time must be after start time");
  }
  await adminRpc<string>("admin_upsert_banner",{p_data:{
    id:String(formData.get("id")||""),
    key:String(formData.get("key")||"hero"),
    titleFa:String(formData.get("titleFa")||""),titleTr:String(formData.get("titleTr")||""),titleEn:String(formData.get("titleEn")||""),titleAr:String(formData.get("titleAr")||""),
    subtitleFa:String(formData.get("subtitleFa")||""),subtitleTr:String(formData.get("subtitleTr")||""),subtitleEn:String(formData.get("subtitleEn")||""),subtitleAr:String(formData.get("subtitleAr")||""),
    imageUrl:String(formData.get("imageUrl")||""),mobileImageUrl:String(formData.get("mobileImageUrl")||""),linkUrl:String(formData.get("linkUrl")||""),
    isPublished:formData.get("isPublished")==="on",order:Number(formData.get("order")||0),startsAt,endsAt
  }});
  revalidatePath("/admin/banners"); revalidatePath("/","layout");
}
export async function deleteBanner(id:string){await adminRpc<boolean>("admin_delete_banner",{p_id:id});revalidatePath("/admin/banners");revalidatePath("/","layout");}
