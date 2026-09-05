"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

const VALID_STATUSES = ["PENDING_PAYMENT","FAILED","PROCESSING","SHIPPED","COMPLETED","CANCELLED"] as const;
const REVIEW_RESOLUTIONS = ["FULFILL", "REFUNDED"] as const;
const FULFILMENT_STATUSES=["PAID","PROCESSING","SHIPPED","COMPLETED"] as const;

function refreshOrder(orderId: string) {revalidatePath(`/admin/orders/${orderId}`);revalidatePath(`/admin/orders/${orderId}/fulfilment`);revalidatePath("/admin/orders");revalidatePath("/admin");}
export async function updateOrderStatus(orderId:string,formData:FormData){const status=String(formData.get("status"));if(!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number]))return;await adminRpc<boolean>("admin_update_order_status",{p_id:orderId,p_status:status});refreshOrder(orderId);}
export async function resolvePaymentReview(orderId:string,formData:FormData){const resolution=String(formData.get("resolution")||"").trim().toUpperCase();if(!REVIEW_RESOLUTIONS.includes(resolution as (typeof REVIEW_RESOLUTIONS)[number]))return;const note=String(formData.get("note")||"").trim().slice(0,500);if(resolution==="REFUNDED"&&!note)return;await adminRpc("admin_resolve_payment_review_v2",{p_id:orderId,p_resolution:resolution,p_note:note||null});refreshOrder(orderId);}
export async function updateOrderFulfilment(orderId:string,formData:FormData){const status=String(formData.get("status")||"").trim().toUpperCase();if(!FULFILMENT_STATUSES.includes(status as (typeof FULFILMENT_STATUSES)[number]))return;const shippingMethod=String(formData.get("shippingMethod")||"").trim().slice(0,120),trackingCode=String(formData.get("trackingCode")||"").trim().slice(0,120);if((status==="SHIPPED"||status==="COMPLETED")&&!shippingMethod)return;await adminRpc("admin_update_order_fulfilment",{p_id:orderId,p_shipping_method:shippingMethod,p_tracking_code:trackingCode,p_status:status});refreshOrder(orderId);}
