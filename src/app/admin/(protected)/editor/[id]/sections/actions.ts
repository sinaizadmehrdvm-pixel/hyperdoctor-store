"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";
import type { BuilderBundle, BuilderSection } from "@/lib/page-builder";

type SectionPreset={id:string;name:string;description:string;section:BuilderSection;createdAt:string;updatedAt:string};

export async function saveDraftSectionAsPreset(pageId:string,sectionId:string,formData:FormData){
  const bundle=await adminRpc<BuilderBundle|null>("admin_page_builder_get",{p_page_id:pageId});
  if(!bundle)throw new Error("page_not_found");
  const section=bundle.draft.sections.find(item=>item.id===sectionId);
  if(!section)throw new Error("section_not_found");
  await adminRpc<SectionPreset>("admin_builder_section_save",{
    p_id:"",
    p_name:String(formData.get("name")||"").trim(),
    p_description:String(formData.get("description")||"").trim(),
    p_section:section,
  });
  revalidatePath(`/admin/editor/${pageId}/sections`);
}

export async function insertSectionPreset(pageId:string,presetId:string){
  await adminRpc<{draft:unknown;insertedSectionId:string}>("admin_builder_section_apply",{p_page_id:pageId,p_section_id:presetId});
  revalidatePath(`/admin/editor/${pageId}`);
  revalidatePath(`/admin/editor/${pageId}/sections`);
}

export async function deleteSectionPreset(pageId:string,presetId:string){
  await adminRpc<boolean>("admin_builder_section_delete",{p_id:presetId});
  revalidatePath(`/admin/editor/${pageId}/sections`);
}
