import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_lib/auth.js';
import { sql } from '../../_lib/db.js';

/**
 * PATCH /api/admin/content/:id — update an existing content_items row.
 * Body fields are all optional; omitted ones keep their current value.
 * Pass `isActive: false` to soft-disable a passage without losing it.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({ error: 'method not allowed' });
  }
  const user = await requireAdmin(req, res);
  if (!user) return;

  const id = req.query.id;
  if (typeof id !== 'string' || !id) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const raw = req.body;
  if (raw == null || typeof raw !== 'object') {
    return res.status(400).json({ error: 'request body must be a JSON object' });
  }
  const b = raw as Record<string, unknown>;

  const updates = collectUpdates(b);
  if ('error' in updates) {
    return res.status(400).json({ error: updates.error });
  }

  const rows = await sql`
    update content_items set
      type = coalesce(${updates.type}, type),
      title = coalesce(${updates.title}, title),
      body = coalesce(${updates.body}, body),
      language = case when ${updates.languageProvided} then ${updates.language} else language end,
      source = case when ${updates.sourceProvided} then ${updates.source} else source end,
      difficulty = coalesce(${updates.difficulty}, difficulty),
      is_active = coalesce(${updates.isActive}, is_active)
    where id = ${id}
    returning id, type, title, body, language, source, difficulty,
              length_chars, is_active, created_at
  `;

  if (rows.length === 0) {
    return res.status(404).json({ error: 'not found' });
  }
  return res.status(200).json(rows[0]);
}

interface Updates {
  type: 'prose' | 'code' | null;
  title: string | null;
  body: string | null;
  language: string | null;
  languageProvided: boolean;
  source: string | null;
  sourceProvided: boolean;
  difficulty: number | null;
  isActive: boolean | null;
}

function collectUpdates(b: Record<string, unknown>): Updates | { error: string } {
  const out: Updates = {
    type: null,
    title: null,
    body: null,
    language: null,
    languageProvided: false,
    source: null,
    sourceProvided: false,
    difficulty: null,
    isActive: null,
  };

  if (b.type !== undefined) {
    if (b.type !== 'prose' && b.type !== 'code') {
      return { error: 'type must be "prose" or "code"' };
    }
    out.type = b.type;
  }

  if (b.title !== undefined) {
    if (typeof b.title !== 'string' || !b.title.trim()) {
      return { error: 'title must be a non-empty string' };
    }
    if (b.title.length > 200) return { error: 'title too long' };
    out.title = b.title.trim();
  }

  if (b.body !== undefined) {
    if (typeof b.body !== 'string' || !b.body.trim()) {
      return { error: 'body must be a non-empty string' };
    }
    if (b.body.length > 100_000) return { error: 'body too long' };
    out.body = b.body;
  }

  if (b.language !== undefined) {
    out.languageProvided = true;
    if (b.language === null || b.language === '') {
      out.language = null;
    } else if (typeof b.language === 'string') {
      out.language = b.language.trim().toLowerCase() || null;
    } else {
      return { error: 'language must be a string or null' };
    }
  }

  if (b.source !== undefined) {
    out.sourceProvided = true;
    if (b.source === null || b.source === '') {
      out.source = null;
    } else if (typeof b.source === 'string') {
      out.source = b.source.trim() || null;
    } else {
      return { error: 'source must be a string or null' };
    }
  }

  if (b.difficulty !== undefined) {
    const n = Number(b.difficulty);
    if (!Number.isFinite(n)) {
      return { error: 'difficulty must be a number' };
    }
    const rounded = Math.round(n);
    if (rounded < 1 || rounded > 5) {
      return { error: 'difficulty must be between 1 and 5' };
    }
    out.difficulty = rounded;
  }

  if (b.isActive !== undefined) {
    if (typeof b.isActive !== 'boolean') {
      return { error: 'isActive must be a boolean' };
    }
    out.isActive = b.isActive;
  }

  return out;
}
