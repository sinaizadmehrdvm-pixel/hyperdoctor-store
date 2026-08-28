import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requestZarinpalPayment } from "@/lib/payments/zarinpal";
import { supabaseRpc } from "@/lib/supabase-rest";
import { getCustomerToken } from "@/lib/customer-auth";

const lineSchema = z.object({ type:z.enum(["product","service"]), id:z.string().trim().min(1).max(160), quantity:z.number().int().min(1).max(50), preferredDate:z.string().trim().max(80).optional() }).strict();
const checkoutSchema = z.object({ locale:z.enum(["fa","tr","en","ar"]), customerName:z.string().trim().min(2).max(120), phone:z.string().trim().min(8).max(24), email:z.string().trim().email().optional().or(z.literal("")), address:z.string().trim().min(5).max(500), province:z.string().trim().max(120).optional(), city:z.string().trim().min(2).max(120), country:z.string().trim().max(120).optional(), postalCode:z.string().trim().max(20).optional(), notes:z.string().trim().max(1000).optional(), lines:z.array(lineSchema).min(1).max(100) }).strict();
type CreatedOrder={orderId:string;orderNumber:string;total:number;checkoutToken:string;resultToken:string;status:string};

function expectedPaymentHost(){ return process.env.ZARINPAL_SANDBOX === "false" ? "payment.zarinpal.com" : "sandbox.zarinpal.com"; }
function isSafePaymentRedirect(value:unknown):value is string{
  if(typeof value!=="string"||value.length>2048)return false;
  try{ const url=new URL(value); return url.protocol==="https:" && url.hostname.toLowerCase()===expectedPaymentHost() && url.port===""; }catch{return false;}
}
function jsonError(error:string,status:number){return NextResponse.json({error},{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});}

export async function POST(request:Request){
  let raw:unknown;try{raw=await request.json();}catch{return jsonError("Invalid checkout payload",400);}
  const parsed=checkoutSchema.safeParse(raw);if(!parsed.success)return jsonError("Invalid checkout payload",400);
  const body=parsed.data;let order:CreatedOrder|null=null;
  try{
    order=await supabaseRpc<CreatedOrder>("create_guest_order",{p_request_token:randomUUID(),p_customer_name:body.customerName,p_phone:body.phone,p_email:body.email||null,p_address:body.address,p_province:body.province||"",p_city:body.city,p_country:body.country||"",p_postal_code:body.postalCode||null,p_notes:body.notes||"",p_locale:body.locale,p_lines:body.lines});
    if(!order?.orderNumber||!order.checkoutToken||!Number.isInteger(order.total)||order.total<=0)throw new Error("Order could not be created");
    const customerToken=await getCustomerToken();if(customerToken)await supabaseRpc<boolean>("attach_order_customer",{p_order_number:order.orderNumber,p_checkout_token:order.checkoutToken,p_customer_token:customerToken}).catch(()=>false);
    const payment=await requestZarinpalPayment({amountToman:order.total,description:`Hyper Doctor order ${order.orderNumber}`,orderNumber:order.orderNumber,checkoutToken:order.checkoutToken,mobile:body.phone,email:body.email||undefined});
    if(!payment.authority||!isSafePaymentRedirect(payment.redirectUrl))throw new Error("Invalid payment session response");
    const attached=await supabaseRpc<boolean>("attach_order_payment_authority",{p_order_number:order.orderNumber,p_checkout_token:order.checkoutToken,p_authority:payment.authority});
    if(!attached)throw new Error("Payment session could not be attached to the order");
    return NextResponse.json({redirectUrl:payment.redirectUrl,orderNumber:order.orderNumber},{headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
  }catch(error){
    if(order?.orderNumber&&order.checkoutToken)await supabaseRpc<boolean>("cancel_guest_order",{p_order_number:order.orderNumber,p_checkout_token:order.checkoutToken}).catch(()=>false);
    const message=error instanceof Error?error.message:"Checkout failed";const clientMessage=/stock|quantity|unavailable|booking|total/i.test(message)?message:"Checkout could not be completed";
    console.error("[checkout] failed",error);return jsonError(clientMessage,502);
  }
}
