import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseRpc } from "@/lib/supabase-rest";

const schema=z.object({orderNumber:z.string().trim().min(4).max(80),phone:z.string().trim().min(8).max(24)});
type Tracking={orderNumber:string;status:string;total:number;currency:string;shippingMethod:string;trackingCode:string;createdAt:string;shippedAt?:string|null;completedAt?:string|null;items:Array<{name:string;quantity:number}>};

export async function POST(request:Request){
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid tracking data"},{status:400});
  try{
    const result=await supabaseRpc<Tracking|null>("track_order_public",{p_order_number:parsed.data.orderNumber,p_phone:parsed.data.phone});
    if(!result)return NextResponse.json({error:"Order not found"},{status:404});
    return NextResponse.json(result);
  }catch(error){console.error("[order-tracking] failed",error);return NextResponse.json({error:"Tracking is temporarily unavailable"},{status:503});}
}
