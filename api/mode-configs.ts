import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './_lib/db.js';

/**
 * GET /api/mode-configs — public read of the override rows. No auth.
 * Clients (the practice session orchestrator) merge these with code-level
 * defaults to produce effective per-(mode, difficulty) config.
 *
 * Cache aggressively at the edge: configs change rarely and the worst-case
 * staleness is "you're racing the old duration for a few seconds."
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method not allowed' });
  }
  const rows = await sql`
    select mode_id, difficulty, config
    from mode_configs
  `;
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  return res.status(200).json({ items: rows });
}
