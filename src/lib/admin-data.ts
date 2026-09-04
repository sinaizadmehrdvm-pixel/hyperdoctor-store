import "server-only";

import { redirect } from "next/navigation";
import { getAdminSession, getAdminSessionToken } from "@/lib/admin-auth";
import { canAdminUseRpc } from "@/lib/admin-permissions";
import { supabaseRpc } from "@/lib/supabase-rest";

export async function adminRpc<T>(fn: string, payload: Record<string, unknown> = {}) {
  const [token, session] = await Promise.all([getAdminSessionToken(), getAdminSession()]);
  if (!token || !session) redirect("/admin/login");
  if (!canAdminUseRpc(session.role, fn)) redirect("/admin?error=forbidden");
  return supabaseRpc<T>(fn, { p_token: token, ...payload });
}
