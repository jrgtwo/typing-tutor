import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const NEON_AUTH_URL = process.env.VITE_NEON_AUTH_URL;

if (!NEON_AUTH_URL) {
  throw new Error(
    '[neon-auth] VITE_NEON_AUTH_URL must be set in the server runtime',
  );
}

const ISSUER = new URL(NEON_AUTH_URL).origin;
const JWKS = createRemoteJWKSet(
  new URL(`${NEON_AUTH_URL}/.well-known/jwks.json`),
);

export interface AuthedUser {
  userId: string;
  email: string | null;
}

export async function getAuthedUser(
  req: VercelRequest,
): Promise<AuthedUser | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
      audience: ISSUER,
    });
    const userId =
      typeof payload.sub === 'string'
        ? payload.sub
        : typeof payload.id === 'string'
          ? payload.id
          : null;
    if (!userId) return null;
    const email =
      typeof payload.email === 'string' ? payload.email : null;
    return { userId, email };
  } catch (err) {
    console.warn('[neon-auth] JWT verification failed:', err);
    return null;
  }
}

export async function requireAuthedUser(
  req: VercelRequest,
  res: VercelResponse,
): Promise<AuthedUser | null> {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
  return user;
}
