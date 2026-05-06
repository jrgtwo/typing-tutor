import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/auth.js';
import { sql } from '../_lib/db.js';

/**
 * Admin catalog endpoints. All callers must pass the admin gate
 * (verified JWT + email in ADMIN_EMAILS allowlist).
 *
 * GET  /api/admin/content       — list every row, including is_active=false.
 * POST /api/admin/content       — create a new content_items row.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const rows = await sql`
      select id, type, title, body, language, source, difficulty,
             length_chars, is_active, created_at
      from content_items
      order by created_at desc
    `;
    return res.status(200).json({ items: rows });
  }

  if (req.method === 'POST') {
    const parsed = parseContentBody(req.body);
    if ('error' in parsed) {
      return res.status(400).json({ error: parsed.error });
    }
    const { type, title, body, language, source, difficulty, isActive } = parsed;
    const rows = await sql`
      insert into content_items
        (type, title, body, language, source, difficulty, is_active)
      values
        (${type}, ${title}, ${body}, ${language}, ${source}, ${difficulty}, ${isActive})
      returning id, type, title, body, language, source, difficulty,
                length_chars, is_active, created_at
    `;
    return res.status(201).json(rows[0]);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'method not allowed' });
}

interface ParsedContent {
  type: 'prose' | 'code';
  title: string;
  body: string;
  language: string | null;
  source: string | null;
  difficulty: number;
  isActive: boolean;
}

export function parseContentBody(
  raw: unknown,
): ParsedContent | { error: string } {
  if (raw == null || typeof raw !== 'object') {
    return { error: 'request body must be a JSON object' };
  }
  const b = raw as Record<string, unknown>;

  const type = b.type;
  if (type !== 'prose' && type !== 'code') {
    return { error: 'type must be "prose" or "code"' };
  }
  const title = typeof b.title === 'string' ? b.title.trim() : '';
  if (!title) return { error: 'title is required' };
  if (title.length > 200) return { error: 'title too long' };

  const body = typeof b.body === 'string' ? b.body : '';
  if (!body.trim()) return { error: 'body is required' };
  if (body.length > 100_000) return { error: 'body too long' };

  const language =
    typeof b.language === 'string' && b.language.trim()
      ? b.language.trim().toLowerCase()
      : null;
  const source =
    typeof b.source === 'string' && b.source.trim() ? b.source.trim() : null;

  const rawDiff = b.difficulty;
  const difficulty =
    typeof rawDiff === 'number' && Number.isFinite(rawDiff)
      ? Math.round(rawDiff)
      : 3;
  if (difficulty < 1 || difficulty > 5) {
    return { error: 'difficulty must be between 1 and 5' };
  }

  const isActive = b.isActive === undefined ? true : b.isActive === true;

  return { type, title, body, language, source, difficulty, isActive };
}
