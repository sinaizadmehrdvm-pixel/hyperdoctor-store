"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";

export async function createBuilderPreview(pageId:string,formData:FormData){
  const requested=Number(formData.get("minutes")||60);
  const minutes=[15,60,1440,10080].includes(requested)?requested:60;
  const result=await adminRpc<{id:string;token:string;expiresAt:string}>("admin_builder_preview_create",{p_page_id:pageId,p_minutes:minutes});
  revalidatePath(`/admin/editor/${pageId}/preview`);
  redirect(`/admin/editor/${pageId}/preview?token=${encodeURIComponent(result.token)}&expires=${encodeURIComponent(result.expiresAt)}`);
}

export async function revokeBuilderPreview(pageId:string,previewId:string){
  await adminRpc<boolean>("admin_builder_preview_revoke",{p_preview_id:previewId});
  revalidatePath(`/admin/editor/${pageId}/preview`);
}
