import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stackServerApp } from './stack';

export interface AuthedUser {
  userId: string;
  email: string | null;
}

function toRequestLike(req: VercelRequest) {
  return {
    headers: {
      get(name: string) {
        const v = req.headers[name.toLowerCase()];
        if (Array.isArray(v)) return v[0] ?? null;
        return v ?? null;
      },
    },
  };
}

export async function getAuthedUser(req: VercelRequest): Promise<AuthedUser | null> {
  const user = await stackServerApp.getUser({ tokenStore: toRequestLike(req) });
  if (!user) return null;
  return { userId: user.id, email: user.primaryEmail ?? null };
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
