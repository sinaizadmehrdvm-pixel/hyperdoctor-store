import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { builderDiff, editorAiRequestSchema, enforceAiScope, parseAiBuilderDocument } from "@/lib/page-builder-ai";

const MODEL = process.env.EDITOR_AI_MODEL || "openai/gpt-5.6-sol";
const FALLBACKS = ["anthropic/claude-opus-5", "google/gemini-3.6-flash"];
const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

function stripJsonFence(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  return trimmed;
}

function systemPrompt() {
  return [
    "You are the production visual site editor for Hyper Doctor, part of VITALIS Group.",
    "Return JSON only. Do not wrap it in markdown and do not add commentary outside JSON.",
    "The response must be an object with exactly two keys: summary and document.",
    "summary must be a short human-readable description of the proposed change.",
    "document must preserve BuilderDocument version 1 and use only supported section types: hero, richText, imageText, cards, cta, spacer.",
    "Supported locales are fa, tr, en, ar. Persian and Arabic are RTL languages.",
    "Never invent product prices, certifications, warranty terms, clinical claims, device specifications, regulatory approvals, or factual business claims that are absent from the current document.",
    "Never insert scripts, event handlers, iframes, javascript: URLs, data: URLs, or executable HTML.",
    "For links, keep existing valid links unless the instruction explicitly asks to change them.",
    "For image URLs, keep existing URLs unless the instruction explicitly asks for image changes. Do not fabricate image URLs.",
    "When improving responsive layout, use hiddenOn, columns, maxWidth, paddingY, minHeight, radius, align and imagePosition conservatively.",
    "When translating, preserve meaning and brand/product names; write natural clinical/commercial language for each locale.",
  ].join("\n");
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (session.role !== "SUPER_ADMIN" && session.role !== "EDITOR") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let parsed;
  try {
    parsed = editorAiRequestSchema.parse(await request.json());
  } catch (error) {
    console.warn("[editor-ai] invalid request", error);
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (parsed.scope === "section" && !parsed.selectedSectionId) {
    return NextResponse.json({ error: "selected_section_required" }, { status: 400 });
  }

  const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if (!apiKey) {
    return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
  }

  const scopeInstruction = parsed.scope === "section"
    ? `Only change the section whose id is ${JSON.stringify(parsed.selectedSectionId)}. Return the full document and preserve every other section and the global theme exactly.`
    : "You may modify the full page, but preserve existing IDs for sections/cards that remain. Create new unique IDs only when adding new sections/cards.";

  const modeInstruction = parsed.mode === "translate"
    ? "Translation task: populate or improve all four locale variants (fa, tr, en, ar) for the requested content. Preserve non-language design/settings unless the user explicitly asks otherwise."
    : parsed.mode === "responsive"
      ? "Responsive task: focus on layout/settings for desktop, tablet and mobile. Do not rewrite factual copy unless necessary to satisfy the instruction."
      : "Editing task: follow the user's instruction while preserving unrelated content and settings.";

  const userPayload = {
    pageLocale: parsed.locale,
    scope: parsed.scope,
    selectedSectionId: parsed.selectedSectionId || null,
    mode: parsed.mode,
    instruction: parsed.instruction,
    currentDocument: parsed.document,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        models: FALLBACKS,
        messages: [
          { role: "system", content: systemPrompt() },
          { role: "system", content: scopeInstruction },
          { role: "system", content: modeInstruction },
          { role: "user", content: JSON.stringify(userPayload) },
        ],
        stream: false,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("[editor-ai] gateway failed", response.status, detail.slice(0, 600));
      return NextResponse.json({ error: "ai_gateway_failed" }, { status: 502 });
    }

    const completion = await response.json() as {
      model?: string;
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };
    const content = completion.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "empty_ai_response" }, { status: 502 });

    let decoded: unknown;
    try {
      decoded = JSON.parse(stripJsonFence(content));
    } catch (error) {
      console.error("[editor-ai] invalid JSON from model", error, content.slice(0, 800));
      return NextResponse.json({ error: "invalid_ai_response" }, { status: 502 });
    }

    if (!decoded || typeof decoded !== "object") {
      return NextResponse.json({ error: "invalid_ai_response" }, { status: 502 });
    }
    const result = decoded as { summary?: unknown; document?: unknown };
    if (typeof result.summary !== "string" || !result.document) {
      return NextResponse.json({ error: "invalid_ai_response" }, { status: 502 });
    }

    const candidate = parseAiBuilderDocument(result.document);
    const scoped = enforceAiScope(parsed.document, candidate, parsed.scope, parsed.selectedSectionId);
    const changes = builderDiff(parsed.document, scoped);

    return NextResponse.json({
      summary: result.summary.trim().slice(0, 1200),
      document: scoped,
      changes,
      model: completion.model || MODEL,
      usage: completion.usage || null,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "ai_timeout" }, { status: 504 });
    }
    console.error("[editor-ai] request failed", error);
    return NextResponse.json({ error: "ai_request_failed" }, { status: 500 });
  } finally {
    clearTimeout(timeout);
  }
}
