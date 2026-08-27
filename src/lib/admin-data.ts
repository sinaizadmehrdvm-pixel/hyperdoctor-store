import "server-only";

import { getAdminSessionToken } from "@/lib/admin-auth";
import { supabaseRpc } from "@/lib/supabase-rest";

export async function adminRpc<T>(fn: string, payload: Record<string, unknown> = {}) {
  const token = await getAdminSessionToken();
  if (!token) throw new Error("Admin session is required");
  return supabaseRpc<T>(fn, { p_token: token, ...payload });
}
