import { NextResponse } from "next/server";
import { verifyZarinpalPayment } from "@/lib/payments/zarinpal";
import { supabaseRpc } from "@/lib/supabase-rest";

type Locale = "fa" | "tr" | "en" | "ar";
type PaymentContext = { orderId:string; orderNumber:string; total:number; locale:Locale; status:string; resultToken:string };
type FinalizedOrder = { orderNumber:string; status:string; locale:Locale; resultToken:string };
const LOCALES = new Set<Locale>(["fa","tr","en","ar"]);
const SUCCESS_STATUSES=new Set(["PAID","PROCESSING","SHIPPED","COMPLETED"]);
const FAILURE_STATUSES=new Set(["FAILED","CANCELLED","REFUNDED"]);
const safe = (value:string|null,max:number) => typeof value === "string" ? value.trim().slice(0,max) : "";

function siteOrigin(requestUrl:URL){
  const configured=process.env.NEXT_PUBLIC_SITE_URL;
  try{const u=new URL(configured||requestUrl.origin);if(u.protocol!=="https:"&&u.hostname!=="localhost")throw new Error();return u.origin;}catch{return requestUrl.origin;}
}
function redirect(origin:string,locale:Locale,order:string,status:"success"|"fail"|"pending",token?:string){
  const target=new URL(`/${locale}/order/${encodeURIComponent(order)}/result`,origin);target.searchParams.set("status",status);if(token)target.searchParams.set("token",token);
  return NextResponse.redirect(target,{status:303,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
}
function stateFromFinalized(finalized:FinalizedOrder|null){
  if(!finalized?.resultToken)return "pending" as const;
  if(SUCCESS_STATUSES.has(finalized.status))return "success" as const;
  if(FAILURE_STATUSES.has(finalized.status))return "fail" as const;
  return "pending" as const;
}

export async function GET(request:Request){
  const url=new URL(request.url),origin=siteOrigin(url);
  const authority=safe(url.searchParams.get("Authority"),128),gatewayStatus=safe(url.searchParams.get("Status"),16).toUpperCase(),orderNumber=safe(url.searchParams.get("order"),160),checkoutToken=safe(url.searchParams.get("ct"),256);
  if(!authority||!orderNumber||!checkoutToken)return redirect(origin,"fa","unknown","fail");
  let context:PaymentContext|null=null;
  try{context=await supabaseRpc<PaymentContext|null>("get_order_payment_context",{p_order_number:orderNumber,p_checkout_token:checkoutToken,p_authority:authority});}catch(error){console.error("[zarinpal-callback] context lookup failed",error);}
  if(!context||!LOCALES.has(context.locale)||!context.orderNumber||!context.resultToken||!Number.isSafeInteger(context.total)||context.total<=0)return redirect(origin,"fa",orderNumber,"fail");
  const result=(status:"success"|"fail"|"pending",token=context!.resultToken)=>redirect(origin,context!.locale,context!.orderNumber,status,token);
  if(SUCCESS_STATUSES.has(context.status))return result("success");
  if(FAILURE_STATUSES.has(context.status))return result("fail");
  if(context.status!=="PENDING_PAYMENT")return result("pending");

  if(gatewayStatus!=="OK"){
    const finalized=await supabaseRpc<FinalizedOrder|null>("finalize_order_payment_v2",{p_order_number:orderNumber,p_checkout_token:checkoutToken,p_authority:authority,p_success:false,p_ref_id:null}).catch(error=>{console.error("[zarinpal-callback] failure finalization failed",error);return null;});
    const finalState=stateFromFinalized(finalized);
    return result(finalState,finalized?.resultToken||context.resultToken);
  }

  const verification=await verifyZarinpalPayment({amountToman:context.total,authority});
  if(verification.status==="unavailable")return result("pending");
  if(verification.status==="rejected"){
    const finalized=await supabaseRpc<FinalizedOrder|null>("finalize_order_payment_v2",{p_order_number:orderNumber,p_checkout_token:checkoutToken,p_authority:authority,p_success:false,p_ref_id:null}).catch(error=>{console.error("[zarinpal-callback] rejection finalization failed",error);return null;});
    const finalState=stateFromFinalized(finalized);
    return result(finalState,finalized?.resultToken||context.resultToken);
  }

  let finalized:FinalizedOrder|null=null;
  try{finalized=await supabaseRpc<FinalizedOrder|null>("finalize_order_payment_v2",{p_order_number:orderNumber,p_checkout_token:checkoutToken,p_authority:authority,p_success:true,p_ref_id:verification.refId});}catch(error){console.error("[zarinpal-callback] success finalization failed",error);return result("pending");}
  const finalState=stateFromFinalized(finalized);
  return result(finalState,finalized?.resultToken||context.resultToken);
}
