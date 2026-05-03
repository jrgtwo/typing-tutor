import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { requireAuthedUser } from './_lib/auth.js';

interface KeyStat {
  key: string;
  presses: number;
  errors: number;
  totalLatencyMs: number;
}

interface Body {
  sessionId: string;
  stats: KeyStat[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }
  const user = await requireAuthedUser(req, res);
  if (!user) return;

  const { sessionId, stats } = (req.body ?? {}) as Partial<Body>;
  if (!sessionId || !Array.isArray(stats)) {
    return res.status(400).json({ error: 'sessionId and stats[] required' });
  }

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const sql = neon(url);

  await sql.transaction(
    stats.flatMap((s) => [
      sql`
        insert into key_stats_session (session_id, key, presses, errors, total_latency_ms)
        values (${sessionId}, ${s.key}, ${s.presses}, ${s.errors}, ${s.totalLatencyMs})
        on conflict (session_id, key) do update set
          presses = excluded.presses,
          errors = excluded.errors,
          total_latency_ms = excluded.total_latency_ms
      `,
      sql`
        insert into key_stats_user (user_id, key, presses, errors, total_latency_ms)
        values (${user.userId}, ${s.key}, ${s.presses}, ${s.errors}, ${s.totalLatencyMs})
        on conflict (user_id, key) do update set
          presses = key_stats_user.presses + excluded.presses,
          errors = key_stats_user.errors + excluded.errors,
          total_latency_ms = key_stats_user.total_latency_ms + excluded.total_latency_ms,
          updated_at = now()
      `,
    ]),
  );

  return res.status(200).json({ ok: true });
}
