const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL;

let cachedToken: string | null = null;
let cachedExp = 0;

function decodeExp(jwt: string): number {
  try {
    const [, payloadB64] = jwt.split('.');
    const padded = payloadB64
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(payloadB64.length + ((4 - (payloadB64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded));
    return typeof payload.exp === 'number' ? payload.exp : 0;
  } catch {
    return 0;
  }
}

async function getToken(): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedExp > now + 60) return cachedToken;

  const res = await fetch(`${NEON_AUTH_URL}/token`, {
    credentials: 'include',
  });
  if (!res.ok) {
    cachedToken = null;
    cachedExp = 0;
    return null;
  }
  const data = (await res.json()) as { token?: string };
  if (!data?.token) {
    cachedToken = null;
    cachedExp = 0;
    return null;
  }
  cachedToken = data.token;
  cachedExp = decodeExp(data.token);
  return cachedToken;
}

export function clearAuthTokenCache() {
  cachedToken = null;
  cachedExp = 0;
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
