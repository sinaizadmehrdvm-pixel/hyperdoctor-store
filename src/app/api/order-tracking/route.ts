import {NextResponse} from "next/server";
import {z} from "zod";
import {supabaseRpc} from "@/lib/supabase-rest";

const schema=z.object({
  orderNumber:z.string().trim().min(4).max(80).regex(/^[A-Za-z0-9-]+$/),
  phone:z.string().trim().min(8).max(24).regex(/^[+0-9()\s-]+$/)
}).strict();

type Tracking={
  orderNumber:string;
  status:string;
  shippingMethod:string;
  trackingCode:string;
  createdAt:string;
  shippedAt?:string|null;
  completedAt?:string|null;
  items:Array<{name:string;quantity:number}>;
};

const allowedStatuses=new Set(["PENDING_PAYMENT","PAYMENT_REVIEW","PAID","PROCESSING","SHIPPED","COMPLETED","FAILED","CANCELLED","REFUNDED"]);
function json(body:unknown,status=200){return NextResponse.json(body,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}})}
function normalizeOrderNumber(value:string){return value.trim().toUpperCase()}
function sanitize(result:Tracking):Tracking|null{
  if(!result||typeof result!=="object")return null;
  const orderNumber=String(result.orderNumber||"").trim().slice(0,80);
  const status=String(result.status||"").trim().toUpperCase();
  const shippingMethod=String(result.shippingMethod||"").trim().slice(0,120);
  const trackingCode=String(result.trackingCode||"").trim().slice(0,120);
  const createdAt=String(result.createdAt||"").trim();
  if(!orderNumber||!allowedStatuses.has(status)||!Number.isFinite(new Date(createdAt).getTime()))return null;
  const cleanItems=Array.isArray(result.items)?result.items.slice(0,100).map(item=>({name:String(item?.name||"").trim().slice(0,240),quantity:Number(item?.quantity)})).filter(item=>item.name&&Number.isInteger(item.quantity)&&item.quantity>0&&item.quantity<=50):[];
  const cleanDate=(v?:string|null)=>{if(!v)return null;const s=String(v).trim();return Number.isFinite(new Date(s).getTime())?s:null};
  return{orderNumber,status,shippingMethod,trackingCode,createdAt,shippedAt:cleanDate(result.shippedAt),completedAt:cleanDate(result.completedAt),items:cleanItems};
}

export async function POST(request:Request){
  let raw:unknown=null;
  try{raw=await request.json()}catch{return json({error:"Invalid tracking data"},400)}
  const parsed=schema.safeParse(raw);
  if(!parsed.success)return json({error:"Invalid tracking data"},400);
  const requestedOrderNumber=normalizeOrderNumber(parsed.data.orderNumber);
  try{
    const result=await supabaseRpc<Tracking|null>("track_order_public",{p_order_number:parsed.data.orderNumber,p_phone:parsed.data.phone});
    if(!result)return json({error:"Order not found"},404);
    const safe=sanitize(result);
    if(!safe){console.error("[order-tracking] invalid backend payload");return json({error:"Tracking is temporarily unavailable"},503)}
    if(normalizeOrderNumber(safe.orderNumber)!==requestedOrderNumber){
      console.error("[order-tracking] backend order mismatch");
      return json({error:"Tracking is temporarily unavailable"},503);
    }
    return json(safe);
  }catch(error){
    console.error("[order-tracking] failed",error);
    return json({error:"Tracking is temporarily unavailable"},503);
  }
}
