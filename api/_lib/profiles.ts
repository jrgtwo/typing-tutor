import { sql } from './db.js';

export async function ensureProfile(userId: string): Promise<void> {
  await sql`insert into profiles (id) values (${userId}) on conflict (id) do nothing`;
}
