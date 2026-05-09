import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/auth.js';
import { sql } from '../_lib/db.js';

/**
 * GET /api/admin/mode-configs — list every override row.
 *
 * The client merges these with the per-mode code defaults declared in
 * `src/modes/<id>/index.ts`, so a missing row simply means "use the
 * default." Validation of the `config` shape is done client-side against
 * each mode's `validateConfig` schema; the server only ensures structural
 * integrity (object + known mode_id / difficulty).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method not allowed' });
  }
  const user = await requireAdmin(req, res);
  if (!user) return;

  const rows = await sql`
    select id, mode_id, difficulty, config, updated_at, updated_by
    from mode_configs
    order by mode_id, difficulty
  `;
  return res.status(200).json({ items: rows });
}
