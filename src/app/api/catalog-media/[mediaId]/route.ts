import { NextResponse } from "next/server";
import { supabaseServiceRpc } from "@/lib/supabase-rest";

type VerifiedBlob = {
  mediaId: string;
  mimeType: string;
  sha256: string;
  byteSize: number;
  bytesBase64: string;
};

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await context.params;
  if (!/^media-v281-jts-[a-z0-9-]+$/i.test(mediaId)) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const blob = await supabaseServiceRpc<VerifiedBlob | null>("service_verified_product_media_blob", {
      p_media_id: mediaId,
    });
    if (!blob?.bytesBase64 || !blob.mimeType || blob.byteSize <= 0) {
      return new NextResponse(null, { status: 404 });
    }

    const bytes = Buffer.from(blob.bytesBase64, "base64");
    if (bytes.byteLength !== blob.byteSize) {
      console.error("[catalog-media] byte-size mismatch", mediaId);
      return new NextResponse(null, { status: 502 });
    }

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": blob.mimeType,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
        ETag: `\"sha256-${blob.sha256}\"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[catalog-media] verified blob fetch failed", error);
    return new NextResponse(null, { status: 503 });
  }
}
