import "server-only";

import { redirect } from "next/navigation";
import { getAdminSessionToken } from "@/lib/admin-auth";
import { supabaseRpc } from "@/lib/supabase-rest";

export async function adminRpc<T>(fn: string, payload: Record<string, unknown> = {}) {
  const token = await getAdminSessionToken();
  if (!token) redirect("/admin/login");
  return supabaseRpc<T>(fn, { p_token: token, ...payload });
}
