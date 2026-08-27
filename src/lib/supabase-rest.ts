import "server-only";

function getConfig() {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!baseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  return { baseUrl, serviceRoleKey };
}

export async function supabaseSelect<T>(
  table: string,
  params: Record<string, string> = {},
): Promise<T[]> {
  const { baseUrl, serviceRoleKey } = getConfig();
  const url = new URL(`${baseUrl}/rest/v1/${encodeURIComponent(table)}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Supabase Data API ${response.status} for ${table}: ${body.slice(0, 500)}`,
    );
  }

  return (await response.json()) as T[];
}

export function inFilter(values: string[]) {
  return `in.(${values.map((value) => `\"${value.replaceAll('"', '\\"')}\"`).join(",")})`;
}
