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

## Manual steps remaining

The codebase migration is done (deps swapped, auth layer rewritten, schema ported, API routes scaffolded, build + typecheck green). Everything below requires accounts/credentials/external dashboards and must be done by hand.

### 1. Provision Neon

- [ ] Create a Neon project at https://console.neon.tech.
- [ ] Enable **Neon Auth** on the project (this provisions the `neon_auth` schema and the `neon_auth.users_sync` table that our migration FKs into). Without this, `db/migrations/0001_init.sql` will fail.
- [ ] Copy the **pooled** connection string → save as `DATABASE_URL` (use the pooler URL, not the direct one — the `@neondatabase/serverless` HTTP driver expects it).

### 2. Provision Stack Auth

Neon Auth uses Stack Auth under the hood. When you enabled Neon Auth in step 1, a Stack project was auto-created and linked.

- [ ] Open the Stack dashboard from the Neon Auth tab (or sign in at https://app.stack-auth.com).
- [ ] Grab three keys from project settings:
  - `VITE_STACK_PROJECT_ID` (browser-safe project ID)
  - `VITE_STACK_PUBLISHABLE_CLIENT_KEY` (browser-safe)
  - `STACK_SECRET_SERVER_KEY` (**server only** — never `VITE_`-prefixed, never committed)
- [ ] In Stack dashboard → **Auth Methods**, enable **Google OAuth** and **Magic Link**.
- [ ] In Stack dashboard → **Domains & Handlers**, whitelist redirect URLs:
  - `http://localhost:3000/handler/*` (Vercel dev default port)
  - `http://localhost:5173/handler/*` (Vite dev default port, if used)
  - `https://<your-vercel-preview>.vercel.app/handler/*`
  - production domain once chosen
- [ ] For Google OAuth specifically: either use Stack's shared dev OAuth credentials (fine for prototyping) or create your own Google Cloud OAuth client and paste its client ID + secret into the Stack dashboard before going to production.

### 3. Apply schema + seed to Neon

Once `DATABASE_URL` is set locally:

```bash
psql "$DATABASE_URL" -f db/migrations/0001_init.sql
psql "$DATABASE_URL" -f db/seed.sql
```

- [ ] Confirm `select count(*) from content_items;` returns 6.
- [ ] Confirm `\dt public.*` shows `profiles`, `sessions`, `key_stats_user`, `key_stats_session`, `keystrokes`, `content_items`.

### 4. Local env file

- [ ] Copy `.env.example` → `.env.local` (or `.env`) and fill in all four values from steps 1–2.
- [ ] Confirm `.env.local` is gitignored (it is by default with Vite).

### 5. Run locally with Vercel dev

The serverless `api/*` routes only execute under Vercel's dev server, not plain Vite.

- [ ] `pnpm dlx vercel link` once to associate the directory with a Vercel project (or create a new one).
- [ ] `pnpm dlx vercel env pull .env.local` to sync env vars from the Vercel dashboard if you'd rather store secrets there.
- [ ] `pnpm dlx vercel dev` — serves the Vite app and `api/` together on one port.

### 6. Smoke tests (manual, against running dev server)

- [ ] **Public read** — `curl http://localhost:3000/api/content` → 200, returns 6 items.
- [ ] **Authz guard** — `curl -X POST http://localhost:3000/api/sessions` (no cookie) → 401.
- [ ] **Sign in** — open the app, hit a flow that calls `signInWithGoogle()` / `signInWithMagicLink()`, complete the redirect, confirm landing on `/dashboard`.
- [ ] **Lazy profile insert** — after sign-in, `curl --cookie-jar` against `/api/profile` → 200 with a row; verify `select * from profiles;` in Neon shows the new ID.
- [ ] **Sign out** — confirm `useSession()` flips back to null and cookies are cleared.

### 7. Production deploy

- [ ] Push the branch and open a Vercel preview deployment.
- [ ] In Vercel project settings → **Environment Variables**, add all four env vars for both **Preview** and **Production** environments.
- [ ] Add the preview + production domains to the Stack Auth handler whitelist (step 2).
- [ ] Re-run smoke tests against the preview URL.
- [ ] Promote to production.

### 8. Cleanup (after confirmed working)

- [ ] Pause/delete the old Supabase project.
- [ ] Rotate any Supabase keys that were committed to history (none expected — `.env.example` only had blank placeholders).
- [ ] Delete this doc, or move it to `docs/archive/`.

