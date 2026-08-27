"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { customerRpc } from "@/lib/customer-auth";

export async function replyTicketAction(locale:string,id:string,formData:FormData){
  const body=String(formData.get("body")||"").trim();
  if(body.length<2) return;
  await customerRpc("customer_reply_ticket",{p_id:id,p_body:body});
  revalidatePath(`/${locale}/account/support/${id}`);
  revalidatePath(`/${locale}/account`);
  redirect(`/${locale}/account/support/${id}?sent=1`);
}
