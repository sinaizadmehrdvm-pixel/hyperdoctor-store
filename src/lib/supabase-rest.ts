import "server-only";

const DEFAULT_PUBLISHABLE_KEY = "sb_publishable_Y2epk6rqs9_hlER6Pp6dTQ_5JlIjyyJ";

function isByteString(value: string) {
  return [...value].every((char) => char.charCodeAt(0) <= 255);
}

function getConfig() {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const configuredPublishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!baseUrl) throw new Error("SUPABASE_URL is required");

  const apiKey =
    configuredPublishableKey?.trim() ||
    (serviceRoleKey && isByteString(serviceRoleKey) && !serviceRoleKey.includes("•")
      ? serviceRoleKey.trim()
      : DEFAULT_PUBLISHABLE_KEY);

  if (!apiKey || !isByteString(apiKey)) throw new Error("A valid Supabase API key is required");
  return { baseUrl, apiKey };
}

export function getSupabasePublicConfig() {
  return getConfig();
}

function apiHeaders(apiKey: string) {
  return { apikey: apiKey, Authorization: `Bearer ${apiKey}`, Accept: "application/json" };
}

export async function supabaseSelect<T>(table: string, params: Record<string, string> = {}): Promise<T[]> {
  const { baseUrl, apiKey } = getConfig();
  const url = new URL(`${baseUrl}/rest/v1/${encodeURIComponent(table)}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, { method: "GET", headers: apiHeaders(apiKey), cache: "no-store" });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase Data API ${response.status} for ${table}: ${body.slice(0, 500)}`);
  }
  return (await response.json()) as T[];
}

export async function supabaseRpc<T>(fn: string, payload: Record<string, unknown>): Promise<T> {
  const { baseUrl, apiKey } = getConfig();
  const response = await fetch(`${baseUrl}/rest/v1/rpc/${encodeURIComponent(fn)}`, {
    method: "POST",
    headers: { ...apiHeaders(apiKey), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase RPC ${response.status} for ${fn}: ${body.slice(0, 500)}`);
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

export function inFilter(values: string[]) {
  return `in.(${values.map((value) => `\"${value.replaceAll('"', '\\"')}\"`).join(",")})`;
}
