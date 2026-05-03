import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuthedUser } from '../_lib/auth.js';
import { sql } from '../_lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({ error: 'method not allowed' });
  }
  const user = await requireAuthedUser(req, res);
  if (!user) return;

  const id = req.query.id;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'invalid id' });
  }

  const {
    finishedAt,
    durationMs,
    charsTyped,
    charsCorrect,
    errors,
    wpm,
    accuracy,
  } = (req.body ?? {}) as Record<string, unknown>;

  const rows = await sql`
    update sessions set
      finished_at = ${finishedAt ?? null},
      duration_ms = ${durationMs ?? null},
      chars_typed = coalesce(${charsTyped ?? null}, chars_typed),
      chars_correct = coalesce(${charsCorrect ?? null}, chars_correct),
      errors = coalesce(${errors ?? null}, errors),
      wpm = ${wpm ?? null},
      accuracy = ${accuracy ?? null}
    where id = ${id} and user_id = ${user.userId}
    returning id
  `;
  if (rows.length === 0) {
    return res.status(404).json({ error: 'not found' });
  }
  return res.status(200).json({ id: rows[0].id });
}
