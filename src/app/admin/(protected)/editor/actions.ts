"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";
import type { BuilderDocument } from "@/lib/page-builder";

export async function saveBuilderDraft(pageId:string,document:BuilderDocument){
  const result=await adminRpc<{draft:BuilderDocument;draftUpdatedAt?:string;publishedRevision:number}>("admin_page_builder_save",{p_page_id:pageId,p_document:document});
  revalidatePath(`/admin/editor/${pageId}`);
  return result;
}

export async function publishBuilderDraft(pageId:string){
  const result=await adminRpc<{published:BuilderDocument;publishedRevision:number;publishedAt?:string}>("admin_page_builder_publish",{p_page_id:pageId});
  revalidatePath(`/admin/editor/${pageId}`);
  revalidatePath("/","layout");
  return result;
}

export async function restoreBuilderRevision(pageId:string,revision:number){
  const result=await adminRpc<BuilderDocument>("admin_page_builder_restore",{p_page_id:pageId,p_revision:revision});
  revalidatePath(`/admin/editor/${pageId}`);
  return result;
}
