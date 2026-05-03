import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './_lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method not allowed' });
  }
  const rows = await sql`select * from content_items where is_active = true`;
  return res.status(200).json({ items: rows });
}
