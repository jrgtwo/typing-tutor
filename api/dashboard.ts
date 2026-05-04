import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuthedUser } from './_lib/auth.js';
import { sql } from './_lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method not allowed' });
  }
  const user = await requireAuthedUser(req, res);
  if (!user) return;

  try {
    const [sessions, keyStats] = await Promise.all([
      sql`
        select id, mode, started_at, finished_at, duration_ms, wpm, accuracy
        from sessions
        where user_id = ${user.userId} and finished_at is not null
        order by finished_at desc
        limit 25
      `,
      sql`
        select key, presses, errors, total_latency_ms, updated_at
        from key_stats_user
        where user_id = ${user.userId}
        order by presses desc
      `,
    ]);

    return res.status(200).json({ sessions, keyStats });
  } catch (err) {
    console.error('[api/dashboard] failed:', err);
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'dashboard query failed', detail: message });
  }
}
