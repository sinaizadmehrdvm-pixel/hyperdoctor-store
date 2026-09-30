"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
async function requireAdmin(){ if(!(await auth())) redirect("/admin/login"); }
export async function upsertBrand(formData: FormData){
  await requireAdmin();
  const id=String(formData.get("id")||"");
  const data={slug:slugify(String(formData.get("slug")||formData.get("nameEn"))),nameFa:String(formData.get("nameFa")||""),nameEn:String(formData.get("nameEn")||""),logoUrl:String(formData.get("logoUrl")||"")||null,websiteUrl:String(formData.get("websiteUrl")||""),descriptionFa:String(formData.get("descriptionFa")||""),descriptionEn:String(formData.get("descriptionEn")||""),order:Number(formData.get("order")||0)};
  if(id) await prisma.brand.update({where:{id},data}); else await prisma.brand.create({data});
  revalidatePath("/admin/brands"); redirect("/admin/brands");
}
export async function deleteBrand(id:string){
  await requireAdmin();
  const brand=await prisma.brand.findUnique({where:{id},select:{_count:{select:{products:true}}}});
  if(!brand) return;
  if(brand._count.products>0) throw new Error("Brand must be unused before deletion.");
  await prisma.brand.delete({where:{id}}); revalidatePath("/admin/brands");
}