import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../../_lib/auth.js';
import { sql } from '../../../_lib/db.js';

const DIFFICULTIES = new Set(['easy', 'medium', 'hard', 'ngplus']);

/**
 * PATCH /api/admin/mode-configs/:modeId/:difficulty — upsert one override row.
 * DELETE same path — drop the override; mode reverts to its code default.
 *
 * The `config` body is stored as opaque JSON. Per-mode shape validation
 * happens client-side via the mode's `validateConfig` schema before the
 * client submits, and again on read; the server enforces only structural
 * sanity (config is an object).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'PATCH, DELETE');
    return res.status(405).json({ error: 'method not allowed' });
  }
  const user = await requireAdmin(req, res);
  if (!user) return;

  const modeId = req.query.modeId;
  const difficulty = req.query.difficulty;
  if (typeof modeId !== 'string' || !modeId.trim()) {
    return res.status(400).json({ error: 'invalid modeId' });
  }
  if (typeof difficulty !== 'string' || !DIFFICULTIES.has(difficulty)) {
    return res.status(400).json({ error: 'invalid difficulty' });
  }

  if (req.method === 'DELETE') {
    await sql`
      delete from mode_configs
      where mode_id = ${modeId} and difficulty = ${difficulty}
    `;
    return res.status(204).end();
  }

  // PATCH
  const raw = req.body;
  if (raw == null || typeof raw !== 'object') {
    return res.status(400).json({ error: 'request body must be a JSON object' });
  }
  const b = raw as Record<string, unknown>;
  const config = b.config;
  if (config == null || typeof config !== 'object' || Array.isArray(config)) {
    return res.status(400).json({ error: 'config must be a JSON object' });
  }
  const configJson = JSON.stringify(config);

  const rows = await sql`
    insert into mode_configs (mode_id, difficulty, config, updated_by)
    values (${modeId}, ${difficulty}, ${configJson}::jsonb, ${user.email ?? null})
    on conflict (mode_id, difficulty) do update set
      config = excluded.config,
      updated_at = now(),
      updated_by = excluded.updated_by
    returning id, mode_id, difficulty, config, updated_at, updated_by
  `;
  return res.status(200).json(rows[0]);
}
