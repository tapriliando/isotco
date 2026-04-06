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

const AUTH_STORAGE_KEY = "isotco.auth.session";
const INTERNAL_EMAIL_DOMAIN =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_INTERNAL_AUTH_DOMAIN ??
  "internal.local";

type SupabaseAuthUser = {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
};

export type SupabaseAuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
  user: SupabaseAuthUser;
};

type SupabaseAuthResponse = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
  user: SupabaseAuthUser;
};

export function usernameToInternalEmail(username: string): string {
  return `${username.trim()}@${INTERNAL_EMAIL_DOMAIN}`;
}

export function getStoredAuthSession(): SupabaseAuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SupabaseAuthSession;
  } catch {
    return null;
  }
}

function saveAuthSession(session: SupabaseAuthSession) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isAuthSessionValid(session: SupabaseAuthSession | null): boolean {
  if (!session?.access_token) return false;
  if (!session.expires_at) return true;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return session.expires_at > nowInSeconds;
}

export async function signInWithUsernamePassword(
  username: string,
  password: string
): Promise<SupabaseRestResult<SupabaseAuthSession>> {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("Missing Supabase URL or key.");
    }

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      throw new Error("Username and password are required.");
    }

    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        ...getSupabaseHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: usernameToInternalEmail(trimmedUsername),
        password,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Login failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as SupabaseAuthResponse;
    const session: SupabaseAuthSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      expires_in: data.expires_in,
      token_type: data.token_type,
      user: data.user,
    };
    saveAuthSession(session);
    return { data: session, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function signOut(): Promise<void> {
  const session = getStoredAuthSession();
  clearStoredAuthSession();

  if (!session?.access_token || !SUPABASE_URL || !SUPABASE_KEY) return;

  try {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: {
        ...getSupabaseHeaders(),
        Authorization: `Bearer ${session.access_token}`,
      },
    });
  } catch {
    // Ignore logout network errors; local session is already cleared.
  }
}
