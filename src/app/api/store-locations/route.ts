import { NextResponse } from "next/server";
import { supabaseRpc } from "@/lib/supabase-rest";

export async function GET(){
  try{
    const branches=await supabaseRpc<any[]>("public_checkout_locations",{});
    return NextResponse.json({branches:Array.isArray(branches)?branches:[]},{headers:{"cache-control":"public, max-age=60, s-maxage=300","x-content-type-options":"nosniff"}});
  }catch(error){
    console.error("[store-locations] read failed",error);
    return NextResponse.json({branches:[]},{status:500,headers:{"cache-control":"no-store"}});
  }
}
