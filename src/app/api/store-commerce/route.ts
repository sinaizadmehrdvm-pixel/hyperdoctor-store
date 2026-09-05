import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseRpc } from "@/lib/supabase-rest";

export async function GET(){
  const branchId=(await cookies()).get("hd_branch")?.value?.trim()||null;
  try{
    const commerce=await supabaseRpc<any>("public_store_commerce",{p_branch_id:branchId});
    return NextResponse.json({commerce},{headers:{"Cache-Control":"private, max-age=0, must-revalidate","X-Content-Type-Options":"nosniff"}});
  }catch(error){console.error("[store-commerce] read failed",error);return NextResponse.json({commerce:null},{status:503,headers:{"Cache-Control":"no-store"}})}
}
