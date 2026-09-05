import "server-only";

const DEFAULT_PUBLISHABLE_KEY = "sb_publishable_Y2epk6rqs9_hlER6Pp6dTQ_5JlIjyyJ";

function isByteString(value: string) {
  return [...value].every((char) => char.charCodeAt(0) <= 255);
}

function cleanKey(value?: string | null) {
  const key = value?.trim();
  if (!key || !isByteString(key) || key.includes("•")) return null;
  return key;
}

function getBaseUrl() {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  if (!baseUrl) throw new Error("SUPABASE_URL is required");
  return baseUrl;
}

function getPublishableKey() {
  return (
    cleanKey(process.env.SUPABASE_PUBLISHABLE_KEY) ??
    cleanKey(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
    cleanKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
    DEFAULT_PUBLISHABLE_KEY
  );
}

function getServiceRoleKey() {
  return cleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getConfig() {
  return { baseUrl: getBaseUrl(), apiKey: getPublishableKey() };
}

export function getSupabasePublicConfig() {
  return getConfig();
}

export function getSupabaseServiceConfig() {
  const apiKey = getServiceRoleKey();
  if (!apiKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for privileged storage access");
  return { baseUrl: getBaseUrl(), apiKey };
}

export function hasSupabaseServiceRoleKey() {
  return Boolean(getServiceRoleKey());
}

function apiHeaders(apiKey: string) {
  return { apikey: apiKey, Authorization: `Bearer ${apiKey}`, Accept: "application/json" };
}

async function rpcWithKey<T>(fn: string, payload: Record<string, unknown>, apiKey: string): Promise<T> {
  const baseUrl = getBaseUrl();
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
  return rpcWithKey<T>(fn, payload, getPublishableKey());
}

export async function supabaseServiceRpc<T>(fn: string, payload: Record<string, unknown>): Promise<T> {
  const serviceRoleKey = getServiceRoleKey();
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for privileged RPC access");
  return rpcWithKey<T>(fn, payload, serviceRoleKey);
}

export async function supabasePrivilegedRpc<T>(fn: string, payload: Record<string, unknown>): Promise<T> {
  const serviceRoleKey = getServiceRoleKey();
  return serviceRoleKey
    ? rpcWithKey<T>(fn, payload, serviceRoleKey)
    : rpcWithKey<T>(fn, payload, getPublishableKey());
}

export function inFilter(values: string[]) {
  return `in.(${values.map((value) => `\"${value.replaceAll('"', '\\"')}\"`).join(",")})`;
}
