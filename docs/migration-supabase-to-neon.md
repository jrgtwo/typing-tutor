# Migration: Supabase → Neon.tech

## Context

We want to move the KeyBandit database off Supabase and onto Neon.tech. The app is pre-deployment, so we have no production data to move — this is a pure codebase migration.

Supabase bundled Postgres + Auth + a client SDK that let the browser talk to the DB directly using RLS. Neon is just Postgres, so we're splitting those concerns:

- **Postgres** → Neon
- **Auth** → Neon Auth (Stack Auth)
- **DB access** → Vercel serverless API routes (browser no longer touches the DB directly)
- **Hosting** → Vercel

Scope is kept tight: only what's needed to re-create current functionality on the new stack. No new features in this migration.

The current Supabase surface area is small — auth client + schema/migrations, **zero live DB queries in source** — which keeps the blast radius manageable.

## What changes

### Packages

**Remove:** `@supabase/supabase-js`

**Add:**
- `@stackframe/react` (Neon Auth client SDK)
- `@neondatabase/serverless` (HTTP-based Postgres driver for serverless routes)
- `vercel` (dev/deploy CLI, devDependency)

### Environment variables

**Remove from `.env.example`:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Add to `.env.example`:**
- `VITE_STACK_PROJECT_ID` — Stack Auth project ID (browser-safe)
- `VITE_STACK_PUBLISHABLE_CLIENT_KEY` — Stack Auth publishable key (browser-safe)
- `STACK_SECRET_SERVER_KEY` — Stack Auth server key (serverless routes only, never `VITE_`-prefixed)
- `DATABASE_URL` — Neon pooled connection string (serverless routes only)

## Files to modify

### Auth layer (replace Supabase client with Stack Auth)

**`src/lib/supabase.ts`** → rename to **`src/lib/stack.ts`**
- Replace `createClient` from `@supabase/supabase-js` with `StackClientApp` from `@stackframe/react`.
- Configure `tokenStore: "cookie"`, project ID and publishable key from `import.meta.env`.
- Keep the `supabaseConfigured`-style boot-without-env guard under a new name (`stackConfigured`).

**`src/lib/auth.ts`**
- `useSession()` → `useUser()` wrapping Stack's `useUser` hook; return shape stays `{ session, loading }` to minimize caller churn (or rename callers — there aren't many).
- `getSession()` → `getCurrentUser()` via `stackClientApp.getUser()`.
- `requireAuth()` — same pattern, redirect to `/` if no user.
- `signInWithGoogle()` → `user.signInWithOAuth('google')` via Stack's handler route pattern.
- `signInWithMagicLink(email)` → `stackClientApp.sendMagicLinkEmail(email)`.
- `signOut()` → `user.signOut()`.

**`src/routes/auth.callback.tsx`**
- Stack Auth's default flow uses a Stack-managed handler at `/handler/*` rather than a custom callback. Adopt Stack's handler route (add a `/handler/$` catch-all route that mounts `<StackHandler />`) and delete this file. Less code, matches Stack's docs, keeps future upgrades cheap.

**`src/components/chrome/SiteBrand.tsx`** and any other component currently importing from `@/lib/supabase` or `@/lib/auth` — update imports. Call sites of the auth hooks should need only minor renames.

### Database schema

**Relocate `supabase/` → `db/`** (directory only used for SQL, the name is misleading).

**`db/migrations/0001_init.sql`** (ported from `supabase/migrations/0001_init.sql`):
- Replace `references auth.users` with `references neon_auth.users_sync(id)` (Neon Auth provides this synced table — IDs are `text`, so change `user_id uuid` columns to `user_id text` and `profiles.id uuid` to `profiles.id text`).
- Delete the `handle_new_user()` function and `on_auth_user_created` trigger. Neon Auth syncs users automatically; we'll lazily insert a `profiles` row from the serverless route on first authenticated request.
- **Drop RLS policies.** With all access going through serverless routes that already hold user identity from the validated Stack JWT, explicit `WHERE user_id = $1` authorization is simpler and has one fewer layer to get wrong. Leave `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` off. (RLS can be re-added later as defense-in-depth if needed.)
- Keep indexes, CHECK constraints, `gen_random_uuid()` defaults — all supported on Neon.

**`db/seed.sql`** — ported from `supabase/seed.sql`, unchanged (only seeds `content_items`).

**Apply migrations:** `psql $DATABASE_URL -f db/migrations/0001_init.sql && psql $DATABASE_URL -f db/seed.sql`. Document this in README; no ORM/migration runner for v1.

### Backend (new)

**`api/_lib/db.ts`** — exports a Neon serverless SQL client built from `DATABASE_URL`.

**`api/_lib/auth.ts`** — Stack Auth server-side user validation. Reads the Stack session cookie, calls `stackServerApp.getUser({ tokenStore: req })`, returns `{ userId, email } | null`. Throws 401 if required.

**`api/_lib/profiles.ts`** — `ensureProfile(userId)` helper: `INSERT ... ON CONFLICT DO NOTHING`. Called at the top of any authenticated route that needs a profile row.

**`api/content.ts`** — `GET` → `SELECT * FROM content_items WHERE is_active = true`. Public, no auth required.

**`api/sessions.ts`** — `POST` → validate user, insert a `sessions` row. Returns the new session ID.

**`api/sessions/[id].ts`** — `PATCH` → update session on finish (finished_at, wpm, accuracy, etc.), with `WHERE id = $1 AND user_id = $2` guard.

**`api/key-stats.ts`** — `POST` → upsert `key_stats_user` and insert `key_stats_session` rows in a transaction.

**`api/dashboard.ts`** — `GET` → returns recent sessions + lifetime key stats for the authenticated user.

**`api/profile.ts`** — `GET` / `PATCH` → read/update own profile (excluding `plan`).

These routes are stubs where the Supabase client would have been called; since no DB queries are live yet, they're greenfield. Wire them up as the features that need them land. For the migration itself, only `api/content.ts` and the auth plumbing need to be functional.

### Vercel configuration

**`vercel.json`** (new) — minimal: framework preset `vite`, functions directory `api/`, Node runtime.

### Client data layer

No change for v1 — TanStack Query is already installed but not yet wired. When queries do land, fetchers will call `/api/*` routes with `credentials: 'include'` (so Stack Auth cookies flow) instead of `supabase.from(...)`.

## Critical files

- `src/lib/supabase.ts` (rename → `src/lib/stack.ts`)
- `src/lib/auth.ts`
- `src/routes/auth.callback.tsx` (delete, replace with `src/routes/handler.$.tsx`)
- `src/components/chrome/SiteBrand.tsx` (import updates)
- `supabase/migrations/0001_init.sql` (port → `db/migrations/0001_init.sql`)
- `supabase/seed.sql` (port → `db/seed.sql`)
- `package.json` (swap deps)
- `.env.example` (swap env vars)
- `vercel.json` (new)
- `api/` directory (new, per-file list above)

## Verification

1. **Build check** — `pnpm build` + `pnpm typecheck` clean.
2. **Auth smoke test** — `pnpm dev` with Vercel dev (`vercel dev`), sign in via Google and magic link, confirm redirect to `/dashboard`, confirm `useUser()` returns the session, confirm sign-out clears it.
3. **Profile creation** — after first sign-in, hit `GET /api/profile`, confirm a row exists in `profiles` (lazy-inserted) and `neon_auth.users_sync` shows the user.
4. **DB connectivity** — `GET /api/content` returns the seeded `content_items` (6 rows).
5. **Authz guard** — `POST /api/sessions` without auth → 401. With auth, returns a new `sessions.id`.
6. **Env hygiene** — grep for `SUPABASE`, `supabase` across `src/` + `api/` + `db/` — should return zero hits.
7. **Deploy preview** — push to a Vercel preview, verify the Stack Auth OAuth redirect URL is whitelisted in the Stack dashboard for the preview domain.
