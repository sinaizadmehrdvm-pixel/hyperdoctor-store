"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";
import type { BuilderDocument } from "@/lib/page-builder";

type PublishResult={published:BuilderDocument;publishedRevision:number;publishedAt?:string;quality?:unknown};

export async function publishQualityChecked(pageId:string){
  await adminRpc<PublishResult>("admin_page_builder_publish",{p_page_id:pageId});
  revalidatePath(`/admin/editor/${pageId}`);
  revalidatePath(`/admin/editor/${pageId}/quality`);
  revalidatePath("/","layout");
  redirect(`/admin/editor/${pageId}/quality?published=1`);
}
