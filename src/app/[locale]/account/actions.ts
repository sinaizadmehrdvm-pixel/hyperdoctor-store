"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { customerRpc, loginCustomer, logoutCustomer, registerCustomer } from "@/lib/customer-auth";
import { supabaseRpc } from "@/lib/supabase-rest";

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
  const fullName=String(formData.get("fullName")||"").trim();
  const email=String(formData.get("email")||"").trim();
  const phone=String(formData.get("phone")||"").trim();
  const password=String(formData.get("password")||"");
  const confirm=String(formData.get("confirmPassword")||"");
  if(password!==confirm) redirect(`/${locale}/account/register?error=password_mismatch`);
  try{await registerCustomer({fullName,email,phone,password,locale});}catch(error){const msg=String(error);redirect(`/${locale}/account/register?error=${msg.includes("account_exists")?"exists":msg.includes("password_too_short")?"short":"failed"}`)}
  redirect(`/${locale}/account`);
}

export async function logoutAction(locale:string){await logoutCustomer();redirect(`/${safeLocale(locale)}/account/login`);}

export async function updateProfileAction(locale:string,formData:FormData){
  locale=safeLocale(locale);
  await customerRpc("customer_update_profile",{p_full_name:String(formData.get("fullName")||""),p_phone:String(formData.get("phone")||""),p_marketing:formData.get("marketingConsent")==="on",p_locale:locale});
  revalidatePath(`/${locale}/account`); redirect(`/${locale}/account?saved=1`);
}

type ResetResult={found:boolean;email?:string|null;phone?:string|null;token?:string;name?:string};
export async function forgotPasswordAction(locale:string,formData:FormData){
  locale=safeLocale(locale); const identifier=String(formData.get("identifier")||"").trim();
  if(!identifier) redirect(`/${locale}/account/forgot-password?status=sent`);
  const result=await supabaseRpc<ResetResult>("customer_create_password_reset",{p_identifier:identifier}).catch(()=>({found:false}));
  if(result.found&&result.email&&result.token){
    const h=await headers(); const host=h.get("x-forwarded-host")||h.get("host")||"hyperdoctor-store.vercel.app"; const proto=h.get("x-forwarded-proto")||"https";
    const resetUrl=`${proto}://${host}/${locale}/account/reset-password?token=${encodeURIComponent(result.token)}`;
    const sent=await sendResetEmail(result.email,result.name||"",resetUrl,locale);
    if(!sent) redirect(`/${locale}/account/forgot-password?status=support`);
  }
  redirect(`/${locale}/account/forgot-password?status=sent`);
}

export async function resetPasswordAction(locale:string,formData:FormData){
  locale=safeLocale(locale); const token=String(formData.get("token")||""); const password=String(formData.get("password")||""); const confirm=String(formData.get("confirmPassword")||"");
  if(password!==confirm) redirect(`/${locale}/account/reset-password?token=${encodeURIComponent(token)}&error=mismatch`);
  const ok=await supabaseRpc<boolean>("customer_reset_password",{p_token:token,p_password:password}).catch(()=>false);
  if(!ok) redirect(`/${locale}/account/reset-password?error=invalid`);
  redirect(`/${locale}/account/login?reset=1`);
}

async function sendResetEmail(to:string,name:string,url:string,locale:string){
  const key=process.env.RESEND_API_KEY; const from=process.env.RESEND_FROM_EMAIL;
  if(!key||!from) return false;
  const subject=locale==="fa"?"بازیابی رمز عبور Hyper Doctor":locale==="tr"?"Hyper Doctor şifre sıfırlama":locale==="ar"?"إعادة تعيين كلمة مرور Hyper Doctor":"Reset your Hyper Doctor password";
  const intro=locale==="fa"?`سلام ${name}، برای تعیین رمز جدید روی لینک زیر کلیک کنید.`:locale==="tr"?`Merhaba ${name}, yeni şifrenizi belirlemek için aşağıdaki bağlantıyı açın.`:locale==="ar"?`مرحباً ${name}، افتح الرابط أدناه لتعيين كلمة مرور جديدة.`:`Hi ${name}, open the link below to set a new password.`;
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({from,to,subject,html:`<div style="font-family:Arial,sans-serif;line-height:1.8"><p>${intro}</p><p><a href="${url}">${url}</a></p><p>This link expires in 30 minutes.</p></div>`})});
  return response.ok;
}
