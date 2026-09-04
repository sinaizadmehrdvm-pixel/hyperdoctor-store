import "server-only";

import { redirect } from "next/navigation";
import { getAdminSession, getAdminSessionToken } from "@/lib/admin-auth";
import { canAdminUseRpc } from "@/lib/admin-permissions";
import { supabaseRpc } from "@/lib/supabase-rest";

const auditedMutations = new Set([
  "admin_add_media","admin_adjust_stock","admin_archive_brand","admin_archive_product","admin_archive_service","admin_archive_taxonomy_term","admin_delete_article","admin_delete_banner","admin_delete_category","admin_delete_media","admin_delete_page","admin_delete_product_variant","admin_import_product_row","admin_resolve_payment_review","admin_set_product_brand","admin_set_product_catalog_links","admin_set_product_relations_and_flags","admin_update_booking_status","admin_update_contact_message","admin_update_customer","admin_update_order_status","admin_update_rental_request","admin_update_review","admin_update_site_settings","admin_update_support_ticket","admin_update_warranty","admin_upsert_article","admin_upsert_banner","admin_upsert_brand","admin_upsert_category","admin_upsert_coupon","admin_upsert_page","admin_upsert_product","admin_upsert_product_v2","admin_upsert_product_variant","admin_upsert_service","admin_upsert_taxonomy_term"
]);
const selfAudited=new Set(["admin_team_save","admin_team_revoke_sessions"]);
const sensitiveKeys=new Set(["p_token","p_password","password","passwordHash","token","checkoutToken","requestToken","resultToken","paymentAuthority"]);
function safeAuditDetails(payload:Record<string,unknown>){const clean:Record<string,unknown>={};for(const[key,value]of Object.entries(payload)){if(sensitiveKeys.has(key))continue;if(typeof value==="string")clean[key]=value.slice(0,300);else if(typeof value==="number"||typeof value==="boolean"||value==null)clean[key]=value;else if(Array.isArray(value))clean[key]={count:value.length};else if(typeof value==="object")clean[key]="[object]";}return clean;}
function inferEntity(fn:string){const m=fn.match(/admin_(?:upsert|update|delete|archive|add|adjust|resolve|import|set)_([a-z_]+)/);return m?.[1]?.replaceAll("_"," ")||"admin";}
export async function adminRpc<T>(fn:string,payload:Record<string,unknown>={}){const[token,session]=await Promise.all([getAdminSessionToken(),getAdminSession()]);if(!token||!session)redirect("/admin/login");if(!canAdminUseRpc(session.role,fn))redirect("/admin?error=forbidden");const result=await supabaseRpc<T>(fn,{p_token:token,...payload});if(auditedMutations.has(fn)&&!selfAudited.has(fn)){const entityId=typeof payload.p_id==="string"?payload.p_id:typeof payload.p_product_id==="string"?payload.p_product_id:null;await supabaseRpc("admin_record_audit_event",{p_token:token,p_action:fn,p_entity:inferEntity(fn),p_entity_id:entityId,p_details:safeAuditDetails(payload)}).catch(error=>console.error("[admin-audit] write failed",error));}return result;}
