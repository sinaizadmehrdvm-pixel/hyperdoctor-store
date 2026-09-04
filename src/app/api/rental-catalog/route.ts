import { NextResponse } from "next/server";
import { supabaseRpc } from "@/lib/supabase-rest";

export async function GET(request:Request){
  const url=new URL(request.url),productId=url.searchParams.get("productId")?.trim()||null;
  if(productId&&productId.length>120)return NextResponse.json({products:[]},{status:400});
  try{
    const products=await supabaseRpc<any[]>("public_rental_catalog",{p_product_id:productId});
    return NextResponse.json({products:Array.isArray(products)?products:[]},{headers:{"cache-control":"public, max-age=60, s-maxage=300"}});
  }catch(error){console.error("[rental-catalog] read failed",error);return NextResponse.json({products:[]},{status:500});}
}
