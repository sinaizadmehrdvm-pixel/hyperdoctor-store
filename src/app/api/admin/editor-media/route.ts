import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { adminRpc } from "@/lib/admin-data";
import { getSupabaseServiceConfig } from "@/lib/supabase-rest";

const MAX_BYTES = 8 * 1024 * 1024;
const allowed = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function safeNumber(value: FormDataEntryValue | null) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) && n >= 0 && n <= 10000 ? Math.round(n) : null;
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (session.role !== "SUPER_ADMIN" && session.role !== "EDITOR") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file_required" }, { status: 400 });
  const ext = allowed.get(file.type);
  if (!ext) return NextResponse.json({ error: "unsupported_type" }, { status: 415 });
  if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: "file_too_large" }, { status: 413 });

  let config: { baseUrl: string; apiKey: string };
  try {
    config = getSupabaseServiceConfig();
  } catch {
    return NextResponse.json({ error: "storage_not_configured" }, { status: 503 });
  }

  const objectName = `editor/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  const uploadUrl = `${config.baseUrl}/storage/v1/object/site-media/${objectName}`;
  const upload = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: config.apiKey,
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": file.type,
      "x-upsert": "false",
      "cache-control": "31536000",
    },
    body: file,
  });
  if (!upload.ok) {
    const detail = await upload.text();
    console.error("[editor-media] storage upload failed", upload.status, detail.slice(0, 300));
    return NextResponse.json({ error: "upload_failed" }, { status: 502 });
  }

  const publicUrl = `${config.baseUrl}/storage/v1/object/public/site-media/${objectName}`;
  const altFa = String(form.get("altFa") ?? "").trim().slice(0, 500);
  const width = safeNumber(form.get("width"));
  const height = safeNumber(form.get("height"));

  try {
    const id = await adminRpc<string>("admin_add_media", { p_url: publicUrl, p_alt_fa: altFa });
    return NextResponse.json({
      asset: { id, url: publicUrl, altFa, width, height, createdAt: new Date().toISOString() },
    });
  } catch (error) {
    await fetch(uploadUrl, {
      method: "DELETE",
      headers: { apikey: config.apiKey, Authorization: `Bearer ${config.apiKey}` },
    }).catch(() => undefined);
    console.error("[editor-media] media registration failed", error);
    return NextResponse.json({ error: "registration_failed" }, { status: 500 });
  }
}
