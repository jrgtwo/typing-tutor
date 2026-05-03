import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuthedUser } from './_lib/auth.js';
import { sql } from './_lib/db.js';
import { ensureProfile } from './_lib/profiles.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }
  const user = await requireAuthedUser(req, res);
  if (!user) return;
  await ensureProfile(user.userId);

  const { contentItemId = null, mode, startedAt } = (req.body ?? {}) as {
    contentItemId?: string | null;
    mode?: string;
    startedAt?: string;
  };
  if (!mode || !startedAt) {
    return res.status(400).json({ error: 'mode and startedAt required' });
  }

  const rows = await sql`
    insert into sessions (user_id, content_item_id, mode, started_at)
    values (${user.userId}, ${contentItemId}, ${mode}, ${startedAt})
    returning id
  `;
  return res.status(201).json({ id: rows[0].id });
}
