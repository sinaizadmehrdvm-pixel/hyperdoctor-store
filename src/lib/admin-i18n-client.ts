"use client";
import type { AdminLocale } from "@/lib/admin-i18n";
export function readAdminLocale():AdminLocale{if(typeof document==="undefined")return "fa";const m=document.cookie.match(/(?:^|; )hd_admin_locale=([^;]+)/);const v=m?.[1];return v==="ar"||v==="en"||v==="tr"?v:"fa"}
