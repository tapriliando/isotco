// Thin helpers around Supabase REST API without needing @supabase/supabase-js.
// This avoids adding extra npm dependencies and works in both Netlify and local builds.

// In Vite, environment variables are exposed via import.meta.env, not process.env.
const SUPABASE_URL =
  (import.meta as any).env.VITE_SUPABASE_URL ??
  (import.meta as any).env.NEXT_PUBLIC_SUPABASE_URL ??
  "";
const SUPABASE_KEY =
  (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  (import.meta as any).env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  "";

export type SupabaseRestResult<T> =
  | { data: T; error: null }
  | { data: null; error: Error };

function getSupabaseHeaders() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    // eslint-disable-next-line no-console
    console.warn("Supabase environment variables are not fully set.");
  }

  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    Accept: "application/json",
  };
}

export async function supabaseRestSelect<T>(
  table: string,
  params: Record<string, string>
): Promise<SupabaseRestResult<T>> {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("Missing Supabase URL or key.");
    }

    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), {
      headers: getSupabaseHeaders(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase error (${response.status}): ${text}`);
    }

    const json = (await response.json()) as T;
    return { data: json, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

// Module-level cache for static reference data (application, province, cities).
// Persists for the browser session so remounts never re-hit Supabase.
const _sessionCache = new Map<string, unknown>();

export async function supabaseRestSelectCached<T>(
  table: string,
  params: Record<string, string>
): Promise<SupabaseRestResult<T>> {
  const cacheKey = `${table}:${JSON.stringify(params)}`;
  if (_sessionCache.has(cacheKey)) {
    return { data: _sessionCache.get(cacheKey) as T, error: null };
  }
  const result = await supabaseRestSelect<T>(table, params);
  if (!result.error && result.data) {
    _sessionCache.set(cacheKey, result.data);
  }
  return result;
}
