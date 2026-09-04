"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminRpc } from "@/lib/admin-data";

function bool(v:FormDataEntryValue|null){return v==="on"||v==="true"}
export async function saveAttributeDefinition(formData:FormData){
  const id=String(formData.get("id")||"").trim();
  const options=String(formData.get("options")||"").split(/\r?\n|,/).map(x=>x.trim()).filter(Boolean).slice(0,100);
  await adminRpc("admin_upsert_attribute_definition",{p_data:{
    id:id||undefined,code:String(formData.get("code")||"").trim(),dataType:String(formData.get("dataType")||"TEXT"),unit:String(formData.get("unit")||"").trim(),options,
    nameFa:String(formData.get("nameFa")||"").trim(),nameTr:String(formData.get("nameTr")||"").trim(),nameEn:String(formData.get("nameEn")||"").trim(),nameAr:String(formData.get("nameAr")||"").trim(),
    groupFa:String(formData.get("groupFa")||"").trim(),groupTr:String(formData.get("groupTr")||"").trim(),groupEn:String(formData.get("groupEn")||"").trim(),groupAr:String(formData.get("groupAr")||"").trim(),
    isComparable:bool(formData.get("isComparable")),isFilterable:bool(formData.get("isFilterable")),isPublished:bool(formData.get("isPublished")),sortOrder:Number(formData.get("sortOrder")||0)
  }});
  revalidatePath("/admin/attributes"); redirect("/admin/attributes?saved=1");
}
export async function archiveAttributeDefinition(formData:FormData){const id=String(formData.get("id")||"").trim();if(id)await adminRpc("admin_archive_attribute_definition",{p_id:id});revalidatePath("/admin/attributes");}
