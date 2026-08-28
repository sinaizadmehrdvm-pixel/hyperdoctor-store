"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { customerRpc, loginCustomer, logoutCustomer, registerCustomer } from "@/lib/customer-auth";

const locales=new Set(["fa","tr","en","ar"]);
const safeLocale=(value:string)=>locales.has(value)?value:"fa";

export async function loginAction(locale:string,formData:FormData){
  locale=safeLocale(locale);
  const identifier=String(formData.get("identifier")||"").trim();
  const password=String(formData.get("password")||"");
  if(!identifier||!password) redirect(`/${locale}/account/login?error=required`);
  const user=await loginCustomer(identifier,password).catch(()=>null);
  if(!user) redirect(`/${locale}/account/login?error=invalid`);
  redirect(`/${locale}/account`);
}

export async function registerAction(locale:string,formData:FormData){
  locale=safeLocale(locale);
  const firstName=String(formData.get("firstName")||"").trim();
  const lastName=String(formData.get("lastName")||"").trim();
  const legacyFullName=String(formData.get("fullName")||"").trim();
  const fullName=[firstName,lastName].filter(Boolean).join(" ").trim()||legacyFullName;
  const email=String(formData.get("email")||"").trim();
  const phone=String(formData.get("phone")||"").trim();
  const password=String(formData.get("password")||"");
  const confirm=String(formData.get("confirmPassword")||"");
  if(fullName.length<2) redirect(`/${locale}/account/register?error=required`);
  if(!email&&!phone) redirect(`/${locale}/account/register?error=contact_required`);
  if(password!==confirm) redirect(`/${locale}/account/register?error=password_mismatch`);
  try{await registerCustomer({fullName,email,phone,password,locale});}catch(error){const msg=String(error);redirect(`/${locale}/account/register?error=${msg.includes("account_exists")?"exists":msg.includes("invalid_password")?"short":"failed"}`)}
  redirect(`/${locale}/account`);
}

export async function logoutAction(locale:string){await logoutCustomer();redirect(`/${safeLocale(locale)}/account/login`);}

export async function updateProfileAction(locale:string,formData:FormData){
  locale=safeLocale(locale);
  await customerRpc("customer_update_profile",{p_full_name:String(formData.get("fullName")||""),p_phone:String(formData.get("phone")||""),p_marketing:formData.get("marketingConsent")==="on",p_locale:locale});
  revalidatePath(`/${locale}/account`); redirect(`/${locale}/account?saved=1`);
}

export async function changePasswordAction(locale:string,formData:FormData){
  locale=safeLocale(locale);
  const current=String(formData.get("currentPassword")||"");
  const next=String(formData.get("newPassword")||"");
  const confirm=String(formData.get("confirmPassword")||"");
  if(next!==confirm) redirect(`/${locale}/account/security?status=mismatch`);
  if(next.length<8||next.length>128) redirect(`/${locale}/account/security?status=short`);
  const ok=await customerRpc<boolean>("customer_change_password",{p_current_password:current,p_new_password:next}).catch(()=>false);
  redirect(`/${locale}/account/security?status=${ok?"changed":"invalid"}`);
}

export async function forgotPasswordAction(locale:string,_formData:FormData){
  redirect(`/${safeLocale(locale)}/account/forgot-password?status=support`);
}

export async function resetPasswordAction(locale:string,_formData:FormData){
  redirect(`/${safeLocale(locale)}/account/forgot-password?status=support`);
}
