import {NextResponse} from "next/server";
import {z} from "zod";
import {supabaseRpc} from "@/lib/supabase-rest";

const schema=z.object({rentalRequestId:z.string().trim().min(8).max(160),phone:z.string().trim().min(8).max(24).regex(/^[+0-9()\s-]+$/)}).strict();
function json(body:unknown,status=200){return NextResponse.json(body,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"}})}
export async function POST(request:Request){
 const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return json({error:"Invalid rental tracking data"},400);
 try{const result=await supabaseRpc<Record<string,unknown>|null>("public_rental_request_status",{p_rental_request_id:parsed.data.rentalRequestId,p_phone:parsed.data.phone});if(!result)return json({error:"Rental request not found"},404);return json(result)}catch(error){console.error("[rental-tracking] failed",error);return json({error:"Rental tracking is temporarily unavailable"},503)}
}
