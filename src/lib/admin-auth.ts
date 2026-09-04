import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseRpc } from "@/lib/supabase-rest";
import type { AdminRole } from "@/lib/admin-permissions";

const ADMIN_COOKIE = "hd_admin_session";
const MAX_AGE = 60 * 60 * 24 * 7;

export type AdminIdentity = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  expiresAt?: string;
};

type AdminLoginResult = AdminIdentity & { token: string };

export async function adminBootstrapStatus() {
  return supabaseRpc<{ initialized: boolean }>("admin_bootstrap_status", {});
}

export async function bootstrapFirstAdmin(input: { token: string; email: string; password: string; name: string }) {
  return supabaseRpc<AdminIdentity>("admin_bootstrap_first_user", {
    p_token: input.token,
    p_email: input.email,
    p_password: input.password,
    p_name: input.name,
  });
}

export async function loginAdmin(email: string, password: string) {
  const result = await supabaseRpc<AdminLoginResult | null>("admin_login", { p_email: email, p_password: password });
  if (!result?.token) return null;

  const store = await cookies();
  store.set(ADMIN_COOKIE, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE,
  });

  const { token: _token, ...identity } = result;
  return identity;
}

export async function getAdminSession(): Promise<AdminIdentity | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    return await supabaseRpc<AdminIdentity | null>("admin_validate_session", { p_token: token });
  } catch (error) {
    console.error("[admin-auth] session validation failed", error);
    return null;
  }
}

export async function getAdminSessionToken() {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value ?? null;
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function requireAdminRole(roles: readonly AdminRole[]) {
  const session = await requireAdminSession();
  if (!roles.includes(session.role)) redirect("/admin?error=forbidden");
  return session;
}

export async function logoutAdmin() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (token) await supabaseRpc<boolean>("admin_logout", { p_token: token }).catch(() => false);
  store.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
