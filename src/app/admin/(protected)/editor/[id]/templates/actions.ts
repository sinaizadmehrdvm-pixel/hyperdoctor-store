"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";
import type { BuilderBundle, BuilderDocument } from "@/lib/page-builder";

export async function saveCurrentDraftAsTemplate(pageId:string,formData:FormData){
  const name=String(formData.get("name")||"").trim();
  const description=String(formData.get("description")||"").trim();
  const bundle=await adminRpc<BuilderBundle|null>("admin_page_builder_get",{p_page_id:pageId});
  if(!bundle)throw new Error("page_not_found");
  await adminRpc("admin_builder_template_save",{p_id:null,p_name:name,p_description:description,p_document:bundle.draft});
  revalidatePath(`/admin/editor/${pageId}/templates`);
}

export async function applyBuilderTemplate(pageId:string,templateId:string){
  await adminRpc<BuilderDocument>("admin_builder_template_apply",{p_page_id:pageId,p_template_id:templateId});
  revalidatePath(`/admin/editor/${pageId}`);
  redirect(`/admin/editor/${pageId}`);
}

export async function deleteBuilderTemplate(pageId:string,templateId:string){
  await adminRpc<boolean>("admin_builder_template_delete",{p_id:templateId});
  revalidatePath(`/admin/editor/${pageId}/templates`);
}
