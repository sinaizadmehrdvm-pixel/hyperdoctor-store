import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { supabaseRpc } from "@/lib/supabase-rest";

const lineSchema=z.object({key:z.string().trim().max(420),type:z.enum(["product","service"]),id:z.string().trim().min(1).max(160),variantId:z.string().trim().max(160).optional(),quantity:z.number().int().min(1).max(50)}).strict();
const bodySchema=z.object({locale:z.enum(["fa","tr","en","ar"]),branchId:z.string().trim().max(160).optional(),lines:z.array(lineSchema).max(100)}).strict();

export async function POST(request:Request){
  let raw:unknown;
  try{raw=await request.json()}catch{return NextResponse.json({error:"INVALID_PAYLOAD"},{status:400,headers:{"Cache-Control":"no-store"}})}
  const parsed=bodySchema.safeParse(raw);
  if(!parsed.success)return NextResponse.json({error:"INVALID_PAYLOAD"},{status:400,headers:{"Cache-Control":"no-store"}});
  const cookieBranch=(await cookies()).get("hd_branch")?.value?.trim()||null,claimed=parsed.data.branchId?.trim()||null;
  if(cookieBranch&&claimed&&cookieBranch!==claimed)return NextResponse.json({error:"BRANCH_CHANGED"},{status:409,headers:{"Cache-Control":"no-store"}});
  try{
    const result=await supabaseRpc("public_validate_cart_v1",{p_lines:parsed.data.lines,p_branch_id:claimed||cookieBranch,p_locale:parsed.data.locale});
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Vary":"Cookie"}});
  }catch(error){console.error("[cart-validation] failed",error);return NextResponse.json({error:"VALIDATION_UNAVAILABLE"},{status:503,headers:{"Cache-Control":"no-store"}})}
}
