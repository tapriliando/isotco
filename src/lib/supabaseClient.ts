// Thin helpers around Supabase REST API without needing @supabase/supabase-js.
// This avoids adding extra npm dependencies and works in both Netlify and local builds.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? "";

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

