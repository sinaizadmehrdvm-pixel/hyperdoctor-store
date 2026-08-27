import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { adminRpc } from "@/lib/admin-data";
import { getSupabasePublicConfig } from "@/lib/supabase-rest";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;
const BUCKET = "product-media";

function extensionFor(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "bin";
}

type UploadGrant = { token: string; expiresAt: string };

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Unsupported file type. Use JPG, PNG or WebP." }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });

    const grant = await adminRpc<UploadGrant>("admin_create_storage_upload_grant");
    if (!grant?.token) return NextResponse.json({ error: "Upload authorization failed" }, { status: 403 });

    const { baseUrl, apiKey } = getSupabasePublicConfig();
    const filename = `admin/${grant.token}/${new Date().toISOString().slice(0, 10)}-${randomUUID()}.${extensionFor(file.type)}`;
    const objectUrl = `${baseUrl}/storage/v1/object/${BUCKET}/${filename}`;
    const upload = await fetch(objectUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        apikey: apiKey,
        "Content-Type": file.type,
        "x-upsert": "false",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      body: await file.arrayBuffer(),
    });

    if (!upload.ok) {
      const detail = await upload.text().catch(() => "");
      console.error("Supabase Storage upload failed", upload.status, detail.slice(0, 500));
      return NextResponse.json({ error: "Image upload failed" }, { status: 502 });
    }

    await adminRpc<boolean>("admin_consume_storage_upload_grant", { p_upload_token: grant.token }).catch(() => false);
    const publicUrl = `${baseUrl}/storage/v1/object/public/${BUCKET}/${filename}`;
    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("[admin-upload] failed", error);
    return NextResponse.json({ error: "Unauthorized or upload unavailable" }, { status: 401 });
  }
}
