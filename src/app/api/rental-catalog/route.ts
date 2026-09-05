import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseRpc } from "@/lib/supabase-rest";

export async function GET(request:Request){
  const url=new URL(request.url),productId=url.searchParams.get("productId")?.trim()||null;
  if(productId&&productId.length>120)return NextResponse.json({products:[]},{status:400});
  const branchId=(await cookies()).get("hd_branch")?.value?.trim()||null;
  try{
    const products=await supabaseRpc<any[]>("public_rental_catalog_v2",{p_product_id:productId,p_branch_id:branchId});
    return NextResponse.json({products:Array.isArray(products)?products:[]},{headers:{"cache-control":"private, max-age=0, must-revalidate"}});
  }catch(error){console.error("[rental-catalog] read failed",error);return NextResponse.json({products:[]},{status:500});}
}
