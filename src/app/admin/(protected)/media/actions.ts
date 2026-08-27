"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

export async function addMedia(formData: FormData){
  const url=String(formData.get("url")||"").trim();
  if(!url) return;
  await adminRpc<string>("admin_add_media",{p_url:url,p_alt_fa:String(formData.get("altFa")||"")});
  revalidatePath("/admin/media");
}

export async function deleteMedia(id:string){
  await adminRpc<boolean>("admin_delete_media",{p_id:id});
  revalidatePath("/admin/media");
}
