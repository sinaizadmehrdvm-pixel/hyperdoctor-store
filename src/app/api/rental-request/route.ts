import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { localISODate, parseISODateOnly } from "@/lib/calendar";
import { supabaseRpc } from "@/lib/supabase-rest";

const schema=z.object({
  requestToken:z.string().uuid(),
  productId:z.string().min(1).max(120),
  requestedQuantity:z.number().int().min(1).max(99).default(1),
  customerName:z.string().trim().min(2).max(120),
  phone:z.string().trim().min(8).max(24),
  email:z.string().trim().email().max(254).optional().or(z.literal("")),
  preferredStartDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  preferredEndDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  address:z.string().trim().max(700).optional().or(z.literal("")),
  notes:z.string().trim().max(1200).optional().or(z.literal("")),
  locale:z.enum(["fa","tr","en","ar"]),
});

export async function POST(request:Request){
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid rental request payload"},{status:400});
  const body=parsed.data,start=body.preferredStartDate||null,end=body.preferredEndDate||null,branchId=(await cookies()).get("hd_branch")?.value?.trim()||null;
  if(start&&(!parseISODateOnly(start)||start<localISODate()))return NextResponse.json({error:"Invalid rental start date"},{status:400});
  if(end&&(!parseISODateOnly(end)||(start&&end<start)))return NextResponse.json({error:"Invalid rental date range"},{status:400});
  try{
    const rentalRequestId=await supabaseRpc<string>("create_rental_request_v2",{
      p_request_token:body.requestToken,p_product_id:body.productId,p_customer_name:body.customerName,p_phone:body.phone,
      p_email:body.email||null,p_preferred_start_date:start,p_preferred_end_date:end,p_address:body.address||null,p_notes:body.notes||null,
      p_locale:body.locale,p_requested_quantity:body.requestedQuantity,p_branch_id:branchId,
    });
    return NextResponse.json({ok:true,rentalRequestId});
  }catch(error){
    const message=error instanceof Error?error.message:"";
    console.error("[rental-request] create failed",error);
    if(message.includes("unavailable")||message.includes("inventory")||message.includes("quantity")||message.includes("branch"))return NextResponse.json({error:"Rental inventory is not available for the selected quantity or dates"},{status:409});
    return NextResponse.json({error:"Rental request could not be registered"},{status:500});
  }
}
