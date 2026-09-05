import { NextResponse } from "next/server";
import { supabaseSelect } from "@/lib/supabase-rest";
import { applyVariantInventory, getStoreInventory } from "@/lib/store-inventory";

type Variant={id:string;name:string;sku:string;price:number|null;compareAtPrice:number|null;stock:number;attributes:string};

export async function GET(request:Request){
  const id=new URL(request.url).searchParams.get("id")?.trim()||"";
  if(!id||id.length>160)return NextResponse.json({variants:[]},{status:400,headers:{"Cache-Control":"no-store"}});
  try{
    const[rawVariants,snapshot]=await Promise.all([
      supabaseSelect<Variant>("ProductVariant",{select:"id,name,sku,price,compareAtPrice,stock,attributes",productId:`eq.${id}`,isPublished:"eq.true",order:"createdAt.asc"}),
      getStoreInventory(),
    ]);
    const variants=applyVariantInventory(rawVariants,snapshot);
    return NextResponse.json({variants,branchId:snapshot?.branchId??null},{headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Vary":"Cookie"}});
  }catch(error){
    console.error("[product-variants] read failed",error);
    return NextResponse.json({variants:[]},{status:500,headers:{"Cache-Control":"no-store"}});
  }
}
