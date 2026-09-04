"use server";

import { revalidatePath } from "next/cache";
import { adminRpc } from "@/lib/admin-data";

const roles = new Set(["SUPER_ADMIN","EDITOR","SUPPORT","SALES"]);

export async function saveAdminTeamMember(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "EDITOR");
  const password = String(formData.get("password") || "");
  const isActive = formData.get("isActive") === "on";
  if (name.length < 2 || name.length > 120) throw new Error("invalid_name");
  if (!email.includes("@") || email.length > 254) throw new Error("invalid_email");
  if (!roles.has(role)) throw new Error("invalid_role");
  if (!id && password.length < 12) throw new Error("password_length");
  if (password && (password.length < 12 || password.length > 200)) throw new Error("password_length");
  await adminRpc("admin_team_save", { p_id: id || null, p_name: name, p_email: email, p_role: role, p_password: password, p_is_active: isActive });
  revalidatePath("/admin/team");
  revalidatePath("/admin/audit");
}

export async function revokeAdminSessions(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) throw new Error("admin_id_required");
  await adminRpc("admin_team_revoke_sessions", { p_id: id });
  revalidatePath("/admin/team");
  revalidatePath("/admin/audit");
}
