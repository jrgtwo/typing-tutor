# Migration: Supabase → Neon.tech

> **Plan revision (2026-05-02):** the original plan in this doc targeted **Neon Auth via Stack Auth**. Stack Auth is now the *legacy* Neon Auth implementation and is **no longer available for new Neon projects** — only existing users keep it. Current Neon Auth is built on **Better Auth** (`@neondatabase/neon-js`). This doc has been updated end-to-end to reflect the Better Auth path. The codebase has been migrated; for the active step-by-step status see `docs/neon-provisioning-checklist.md`. The "Code changes" section at the bottom is a record of what landed.
>
> Sources: [Neon Auth overview](https://neon.com/docs/auth/overview), [Legacy Stack Auth notice](https://neon.com/docs/auth/legacy/overview), [React quick-start](https://neon.com/docs/auth/quick-start/react), [TanStack Router quick-start](https://neon.com/docs/auth/quick-start/tanstack-router).

## Context

We want to move the KeyBandit database off Supabase and onto Neon.tech. The app is pre-deployment, so we have no production data to move — this is a pure codebase migration.

Supabase bundled Postgres + Auth + a client SDK that let the browser talk to the DB directly using RLS. Neon is just Postgres, so we're splitting those concerns:

- **Postgres** → Neon
- **Auth** → Neon Auth (Better Auth)
- **DB access** → Vercel serverless API routes (browser no longer touches the DB directly)
- **Hosting** → Vercel

Scope is kept tight: only what's needed to re-create current functionality on the new stack. No new features in this migration.

The current Supabase surface area is small — auth client + schema/migrations, **zero live DB queries in source** — which keeps the blast radius manageable.

## What changes

### Packages

**Remove:** `@supabase/supabase-js`, `@stackframe/react` (legacy first-pass — see "Code changes still needed")

**Add:**
- `@neondatabase/neon-js` (Neon Auth client + server SDK, Better Auth-based)
- `@neondatabase/serverless` (HTTP-based Postgres driver for serverless routes)
- `vercel` (dev/deploy CLI, devDependency)

### Environment variables

**Remove from `.env.example`:**
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (original Supabase plan)
- `VITE_STACK_PROJECT_ID`, `VITE_STACK_PUBLISHABLE_CLIENT_KEY`, `STACK_SECRET_SERVER_KEY` (legacy Stack Auth — currently still in `.env.example`)

**Add to `.env.example`:**
- `VITE_NEON_AUTH_URL` — Neon Auth endpoint, browser-safe. Found in Neon Console → Auth → Configuration. Looks like `https://ep-xxx.neonauth.<region>.aws.neon.build/<db>/auth`. Also read by serverless routes via `process.env.VITE_NEON_AUTH_URL` (Vercel exposes all env to functions; the `VITE_` prefix only affects client bundling).
- `DATABASE_URL` — Neon pooled connection string (serverless routes only).

> Server-side session validation forwards the request cookie over HTTP to `${VITE_NEON_AUTH_URL}/get-session` instead of validating cookies in-process. This avoids needing `NEON_AUTH_COOKIE_SECRET` and keeps the serverless functions independent of `@neondatabase/auth/next/server` (Next.js-only).

## Files to modify

### Auth layer (Better Auth via `@neondatabase/neon-js`)

**`src/lib/stack.ts`** → rename to **`src/lib/auth-client.ts`**
- Replace `StackClientApp` with Better Auth's `createAuthClient`:
  ```ts
  import { createAuthClient } from '@neondatabase/neon-js/auth';
  import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react';
  export const authClient = createAuthClient(
    import.meta.env.VITE_NEON_AUTH_URL,
    { adapter: BetterAuthReactAdapter() },
  );
  ```
- Keep the boot-without-env guard under a new name (`neonAuthConfigured = Boolean(import.meta.env.VITE_NEON_AUTH_URL)`).

**`src/lib/auth.ts`**
- `useSession()` — re-export Better Auth's `useSession` hook (from `@neondatabase/neon-js/auth/react`). Return shape: `{ data: { session, user } | null, isPending }`. Update call sites or wrap to preserve `{ session, loading }`.
- `getCurrentUser()` → `authClient.getSession()` and read `data?.user`.
- `requireAuth()` — same pattern, redirect to `/` if no user.
- `signInWithGoogle()` → `authClient.signIn.social({ provider: 'google' })`.
- `signInWithMagicLink(email)` → `authClient.signIn.magicLink({ email, callbackURL: '/dashboard' })`.
- `signOut()` → `authClient.signOut()`.

**`src/routes/handler.$.tsx`** → rename to **`src/routes/auth.$pathname.tsx`** (Neon's TanStack Router convention)
- Replace `<StackHandler>` with Neon's pre-built `<AuthView pathname={pathname} />` from `@neondatabase/neon-js/auth/react/ui`.
- Optionally also add `src/routes/account.$pathname.tsx` mounting `<AccountView>` for profile/settings UI.
- Import the bundled CSS once in `src/main.tsx`: `import '@neondatabase/neon-js/auth/ui/css'` (or `…/auth/ui/tailwind` — pick one, never both).

**`src/components/chrome/SiteBrand.tsx`** and any other component currently importing from `@/lib/stack` or using `useUser` from `@stackframe/react` — update imports to the new auth client and the Better Auth `useSession` hook.

### Database schema

**Relocate `supabase/` → `db/`** (directory only used for SQL, the name is misleading).

**`db/migrations/0001_init.sql`** (resolved during provisioning):
- Better Auth writes its user table to `neon_auth.user` (singular, lowercase) with `id uuid` — confirmed via `\dt neon_auth.*` in the Neon SQL Editor after enabling Neon Auth.
- All four FK references updated to `references neon_auth.user(id) on delete cascade`.
- `profiles.id`, `sessions.user_id`, `key_stats_user.user_id` columns swapped from `text` to `uuid` to match.
- Profiles continue to be lazily inserted from the serverless route on first authenticated request (Better Auth doesn't manage your app-side `profiles` table).
- **Drop RLS policies** (already done). With access going through serverless routes that hold validated user identity from Better Auth's session cookie, explicit `WHERE user_id = $1` authorization is simpler. RLS can be re-added later as defense-in-depth.
- Keep indexes, CHECK constraints, `gen_random_uuid()` defaults — all supported on Neon.

**`db/seed.sql`** — ported from `supabase/seed.sql`, unchanged (only seeds `content_items`).

**Apply migrations:** `psql $DATABASE_URL -f db/migrations/0001_init.sql && psql $DATABASE_URL -f db/seed.sql`. Document this in README; no ORM/migration runner for v1.

### Backend (new)

**`api/_lib/db.ts`** — exports a Neon serverless SQL client built from `DATABASE_URL`. (Unchanged from Stack Auth pass.)

**`api/_lib/auth.ts`** — Better Auth server-side user validation via HTTP forwarding. Forwards the incoming `Cookie` header to `${VITE_NEON_AUTH_URL}/get-session` and parses `{ user: { id, email } }`. Returns `{ userId, email } | null`. `requireAuthedUser` writes 401 if missing.
- Chosen over `@neondatabase/auth/next/server` because that SDK is Next.js-only; HTTP forwarding works in plain `@vercel/node` handlers and adds one network hop per authed request (acceptable for v1).
- `api/_lib/stack.ts` deleted.

**`api/_lib/profiles.ts`** — `ensureProfile(userId)` helper: `INSERT ... ON CONFLICT DO NOTHING`. Called at the top of any authenticated route that needs a profile row. (Unchanged from Stack Auth pass.)

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

- `src/lib/stack.ts` (rename → `src/lib/auth-client.ts`, swap to Better Auth)
- `src/lib/auth.ts` (rewrite hooks/helpers for Better Auth)
- `src/routes/handler.$.tsx` (rename → `src/routes/auth.$pathname.tsx`, mount `<AuthView>`)
- `src/main.tsx` (import Neon Auth UI CSS)
- `src/components/chrome/SiteBrand.tsx` (import updates)
- `db/migrations/0001_init.sql` (update FK targets after enabling Neon Auth)
- `api/_lib/stack.ts` (delete)
- `api/_lib/auth.ts` (rewrite for Better Auth server validation)
- `package.json` (remove `@stackframe/react`, add `@neondatabase/neon-js`)
- `.env.example` (replace 3 Stack vars with `VITE_NEON_AUTH_URL` + `NEON_AUTH_COOKIE_SECRET`)
- `vercel.json` (existing, no change expected)

## Verification

1. **Build check** — `pnpm build` + `pnpm typecheck` clean.
2. **Auth smoke test** — `vercel dev`, sign in via Google and magic link from `/auth/sign-in`, confirm redirect to `/dashboard`, confirm `useSession()` returns the session, confirm sign-out clears it.
3. **Profile creation** — after first sign-in, hit `GET /api/profile`, confirm a row exists in `profiles` (lazy-inserted) and the Better Auth user table in `neon_auth` shows the user.
4. **DB connectivity** — `GET /api/content` returns the seeded `content_items` (6 rows).
5. **Authz guard** — `POST /api/sessions` without auth → 401. With auth, returns a new `sessions.id`.
6. **Env hygiene** — grep for `SUPABASE`, `supabase`, `stackframe`, `Stack` across `src/` + `api/` + `db/` — should return zero hits.
7. **Deploy preview** — push to a Vercel preview, verify the Google OAuth redirect URL is whitelisted in the Neon Console for the preview domain.

## Manual steps remaining

The codebase migration is partially done — the Supabase → Neon-via-Stack-Auth pass shipped (deps swapped, auth layer rewritten against Stack, schema ported, API routes scaffolded, build + typecheck green). **The Stack Auth code now needs to be replaced with Better Auth** before any of the manual steps below can succeed; see "Code changes still needed" at the bottom of this doc.

Everything below requires accounts/credentials/external dashboards and must be done by hand.

### 1. Provision Neon

- [ ] Create a Neon project at https://console.neon.tech.
- [ ] Enable **Neon Auth** on the project. On a fresh project this provisions the Better Auth-backed integration and creates the user table inside the `neon_auth` schema.
- [ ] Confirm the exact name of the user table that Neon Auth created in `neon_auth` (Console → SQL Editor → `\dt neon_auth.*`). Update `db/migrations/0001_init.sql` to FK against it.
- [ ] Copy the **pooled** connection string → save as `DATABASE_URL` (use the pooler URL, not the direct one — the `@neondatabase/serverless` HTTP driver expects it).
- [ ] Copy the **Neon Auth URL** from Console → Auth → Configuration → save as `VITE_NEON_AUTH_URL`.

### 2. Configure Neon Auth (Better Auth)

Better Auth is configured through the **Neon Console → Auth** tab — there is no separate Stack Auth dashboard anymore.

- [ ] In Neon Console → Auth → **Providers**, enable **Google** and **Magic Link** (email).
- [ ] For Google specifically: either use Neon's shared dev OAuth credentials (fine for prototyping) or create your own Google Cloud OAuth client and paste its client ID + secret into the Neon Auth provider config before going to production.
- [ ] In Neon Console → Auth → **Trusted Origins / Redirect URLs**, whitelist:
  - `http://localhost:3000` (Vercel dev default port)
  - `http://localhost:5173` (Vite dev default port, if used)
  - `https://<your-vercel-preview>.vercel.app`
  - production domain once chosen

### 3. Apply schema + seed to Neon

Once `DATABASE_URL` is set locally:

```bash
psql "$DATABASE_URL" -f db/migrations/0001_init.sql
psql "$DATABASE_URL" -f db/seed.sql
```

- [ ] Confirm `select count(*) from content_items;` returns 6.
- [ ] Confirm `\dt public.*` shows `profiles`, `sessions`, `key_stats_user`, `key_stats_session`, `keystrokes`, `content_items`.

### 4. Local env file

- [ ] Copy `.env.example` → `.env.local` (or `.env`) and fill in:
  - `VITE_NEON_AUTH_URL` (step 1)
  - `DATABASE_URL` (step 1)
- [ ] Confirm `.env.local` is gitignored (it is by default with Vite).

### 5. Run locally with Vercel dev

The serverless `api/*` routes only execute under Vercel's dev server, not plain Vite.

- [ ] `pnpm dlx vercel link` once to associate the directory with a Vercel project (or create a new one).
- [ ] `pnpm dlx vercel env pull .env.local` to sync env vars from the Vercel dashboard if you'd rather store secrets there.
- [ ] `pnpm dlx vercel dev` — serves the Vite app and `api/` together on one port.

### 6. Smoke tests (manual, against running dev server)

- [ ] **Public read** — `curl http://localhost:3000/api/content` → 200, returns 6 items.
- [ ] **Authz guard** — `curl -X POST http://localhost:3000/api/sessions` (no cookie) → 401.
- [ ] **Sign in** — open the app at `/auth/sign-in`, complete Google or magic-link flow, confirm landing on `/dashboard`.
- [ ] **Lazy profile insert** — after sign-in, `curl --cookie-jar` against `/api/profile` → 200 with a row; verify `select * from profiles;` in Neon shows the new ID.
- [ ] **Sign out** — confirm `useSession()` flips back to null and cookies are cleared.

### 7. Production deploy

- [ ] Push the branch and open a Vercel preview deployment.
- [ ] In Vercel project settings → **Environment Variables**, add `VITE_NEON_AUTH_URL` and `DATABASE_URL` for both **Preview** and **Production** environments.
- [ ] Add the preview + production domains to the Neon Auth trusted-origin whitelist (step 2).
- [ ] Re-run smoke tests against the preview URL.
- [ ] Promote to production.

### 8. Cleanup (after confirmed working)

- [ ] Pause/delete the old Supabase project (if one was ever provisioned — likely none).
- [ ] Rotate any Supabase keys that were committed to history (none expected — `.env.example` only had blank placeholders).
- [ ] Delete this doc, or move it to `docs/archive/`.

---

## Code changes (Stack Auth → Better Auth) — landed

| File | What changed |
|---|---|
| `package.json` | Dropped `@stackframe/react`, added `@neondatabase/neon-js@0.4.0-beta` and `jose` (for server-side JWT verification). |
| `src/lib/auth-client.ts` (new) | `createAuthClient` + `BetterAuthReactAdapter` from `@neondatabase/neon-js`. |
| `src/lib/auth.ts` | Rewritten — `useSession()` wraps `authClient.useSession()`. `signOut()` calls `authClient.signOut()` and clears the JWT cache. Sign-in UI is provided by `<AuthView>`, so per-provider helpers (`signInWithGoogle`, etc.) were removed. |
| `src/lib/api.ts` (new) | `apiFetch()` helper — fetches a JWT from `${VITE_NEON_AUTH_URL}/token`, caches it until ~60s before expiry, injects `Authorization: Bearer <jwt>` on every `/api/*` request. `clearAuthTokenCache()` exposed for sign-out. |
| `src/routes/handler.$.tsx` | Deleted; replaced by `src/routes/auth.$pathname.tsx` mounting `<AuthView pathname={pathname} />`. Routes are `/auth/sign-in`, `/auth/sign-out`, etc. |
| `src/main.tsx` | Wraps app in `<NeonAuthUIProvider authClient={authClient} social={{ providers: ['google'] }} credentials={false} signUp={false}>`. Imports `@neondatabase/neon-js/ui/css`. |
| `api/_lib/auth.ts` | Verifies `Authorization: Bearer <jwt>` against `${VITE_NEON_AUTH_URL}/.well-known/jwks.json` using `jose.createRemoteJWKSet` + `jwtVerify` (issuer + audience pinned to the auth URL origin). No per-request callback to Neon. |
| `api/_lib/stack.ts` | Deleted. |
| `db/migrations/0001_init.sql` | FKs now `references neon_auth.user(id)` (Better Auth's user table). User IDs are `uuid` everywhere. |
| `vercel.json` | Removed invalid AWS-Lambda runtime string (`nodejs20.x`); Vercel auto-detects Node for `.ts` files in `api/`. |
| `.env.example` | Replaced 3 Stack vars with `VITE_NEON_AUTH_URL` + `DATABASE_URL`. |

## Why JWT bearer instead of cookie forwarding

The original plan in this doc had `api/_lib/auth.ts` forward the request `Cookie` header to Neon's `/get-session`. That doesn't work: Neon Auth's session cookies are `__Secure-`-prefixed and scoped to `*.neonauth.*.aws.neon.tech`, so the browser never sends them to `localhost:3000` (or our Vercel function domain). The cookie forward was always empty.

The fix: client fetches a short-lived JWT from `${VITE_NEON_AUTH_URL}/token` (browser→Neon, where cookies do work), sends it as `Authorization: Bearer <jwt>` to our backend, and the server verifies the signature locally against the JWKS endpoint. This is Better Auth's standard cross-domain pattern.

## Active checklist

For the *current* state of work, see **`docs/neon-provisioning-checklist.md`**. This doc is kept as historical context for *why* the architecture is shaped the way it is.

