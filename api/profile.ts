import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuthedUser } from './_lib/auth';
import { sql } from './_lib/db';
import { ensureProfile } from './_lib/profiles';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuthedUser(req, res);
  if (!user) return;
  await ensureProfile(user.userId);

  if (req.method === 'GET') {
    const rows = await sql`
      select id, display_name, plan, plan_expires_at, preferences, created_at
      from profiles where id = ${user.userId}
    `;
    return res.status(200).json(rows[0] ?? null);
  }

  if (req.method === 'PATCH') {
    const { displayName, preferences } = (req.body ?? {}) as {
      displayName?: string | null;
      preferences?: Record<string, unknown>;
    };
    const rows = await sql`
      update profiles set
        display_name = coalesce(${displayName ?? null}, display_name),
        preferences = coalesce(${preferences ? JSON.stringify(preferences) : null}::jsonb, preferences)
      where id = ${user.userId}
      returning id, display_name, plan, plan_expires_at, preferences, created_at
    `;
    return res.status(200).json(rows[0]);
  }

  res.setHeader('Allow', 'GET, PATCH');
  return res.status(405).json({ error: 'method not allowed' });
}
