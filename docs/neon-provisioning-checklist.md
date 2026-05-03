# Neon Provisioning Checklist

Step-by-step checklist for the manual provisioning work that completes the Supabase → Neon migration. Updated as we go. Code-side migration is already done — see `docs/migration-supabase-to-neon.md` for the architectural context.

> **Status:** steps 1–7 complete; step 8 next.
> **Last updated:** 2026-05-02

---

## Captured values (fill in as we go)

These get filled in during the steps and are referenced from other steps. Keep them in `.env.local`, NOT in this doc — the table here is just a placeholder so we know whether each value has been captured.

| Value | Captured? | Where it goes |
|---|---|---|
| Neon project name | ✅ created | reference only |
| Neon Auth user table name | ✅ `neon_auth.user` | `db/migrations/0001_init.sql` |
| Neon Auth user `id` column type | ✅ `uuid` | `db/migrations/0001_init.sql` |
| `VITE_NEON_AUTH_URL` | ✅ captured | `.env.local` + Vercel env |
| `DATABASE_URL` (pooled) | ✅ captured | `.env.local` + Vercel env |
| Vercel project name | ☐ | Vercel dashboard |
| Vercel preview URL | ☐ | Neon Auth Trusted Origins |
| Production domain | ☐ | Neon Auth Trusted Origins (later) |

---

## Step 1 — Provision Neon ✅

- [x] Sign in at https://console.neon.tech
- [x] Click **New Project**, region close to you, latest Postgres, project name (record above)
- [x] Open **Auth** tab in left sidebar → click **Enable Neon Auth**
- [x] Copy **Auth → Configuration → Neon Auth URL** → save as `VITE_NEON_AUTH_URL`
- [x] Open **Connection Details**, toggle **Pooled connection** ON → copy connection string → save as `DATABASE_URL`
- [x] In Neon SQL Editor, list tables in `neon_auth` schema → user table is **`neon_auth.user`** (singular)
- [x] Inspect column types → user `id` is **`uuid`**

**Region:** AWS us-east-1. **URL host:** `.aws.neon.tech` (not `.aws.neon.build` per old doc — Neon's hostname format varies; ours is `.tech`).

**Done when:** all four values above are captured.

---

## Step 2 — Configure Neon Auth providers ✅

**Decision (2026-05-02):** v1 is **Google OAuth only** — no email/password, no magic link. Keeps setup minimal and avoids needing email/SMTP infrastructure. Can add other providers later via dashboard config without code changes.

In Neon Console → **Auth** tab.

- [x] **Providers** → enable **Google** using **Neon's shared dev credentials** (skip Email & Password, skip Magic Link)
- [x] **Trusted Origins** → add `http://localhost:3000`
- [x] **Trusted Origins** → add `http://localhost:5173`

(Preview/prod domains added later in step 8.)

> **🚨 TODO before production launch:** Replace Neon's shared Google OAuth credentials with our own Google Cloud OAuth client. Without this:
> - Consent screen shows Neon's branding, not KeyBandit's — confusing for users and erodes trust
> - We don't own the rate limits or verification status
> - If Neon rotates the shared client, our sign-in breaks
>
> **Steps when we get to it:**
> 1. https://console.cloud.google.com/apis/credentials → Create Credentials → OAuth client ID → Web application
> 2. App name: KeyBandit. Add authorized redirect URI: `<VITE_NEON_AUTH_URL>/callback/google` (Neon's dashboard will show the exact URL to use)
> 3. Configure OAuth consent screen (logo, support email, privacy policy URL — needed for Google verification)
> 4. Submit for Google verification (required to remove "unverified app" warning for users)
> 5. Paste client ID + secret into Neon Auth → Google provider config
>
> Tracked as a follow-up in the project docs; don't lose this.

**Done when:** Google enabled with shared creds, localhost origins whitelisted.

---

## Step 3 — Update migration FK target ✅

Applied the table name + id type from step 1 to the schema file.

- [x] Replaced `neon_auth.users_sync(id)` → `neon_auth.user(id)` (3 occurrences)
- [x] Changed `profiles.id text` → `profiles.id uuid`
- [x] Changed `sessions.user_id text` → `sessions.user_id uuid`
- [x] Changed `key_stats_user.user_id text` → `key_stats_user.user_id uuid`
- [x] Updated stale "Stack Auth" comments to "Neon Auth (Better Auth)"
- [x] `pnpm typecheck` clean (UUIDs are still strings in JS)

---

## Step 4 — Local env file ✅

- [x] Created `.env` (Vite reads `.env` and `.env.local` interchangeably)
- [x] Pasted `VITE_NEON_AUTH_URL` and `DATABASE_URL` from step 1
- [x] Verified `.gitignore` blocks `.env*` patterns and `git status` does not show the file

---

## Step 5 — Apply schema + seed to Neon ✅

- [x] `psql` available
- [x] Loaded DATABASE_URL into shell from `.env.local`
- [x] Applied `db/migrations/0001_init.sql` — 5 CREATE TABLE + 4 CREATE INDEX
- [x] Applied `db/seed.sql` — INSERT 0 6
- [x] Verified `select count(*) from content_items` → 6
- [x] Verified `\dt public.*` shows all 6 expected tables

**Gotcha for next time:** the URL pasted from Neon Console got truncated by one char on save — final `e` of `channel_binding=require` was missing. Wrapping `DATABASE_URL` (and `VITE_NEON_AUTH_URL`) in **single quotes** in `.env.local` is also recommended to keep the `&` from being interpreted by the shell during `export $(... | xargs)`.

---

## Step 6 — Run locally with Vercel dev ✅

- [x] `pnpm dlx vercel link` → linked to `jrgtwos-projects/key-bandit`
- [x] Fixed `vercel.json` — removed invalid `runtime: "nodejs20.x"` (that's AWS Lambda format, not Vercel format). Vercel auto-detects Node for `.ts` files in `api/`.
- [x] `pnpm dlx vercel dev` running on http://localhost:3000

**Pending follow-ups (not blockers):**
- GitHub repo connection failed during `vercel link` ("Failed to connect jrgtwo/typing-tutor"). Reconnect manually in Vercel Dashboard → Project → Settings → Git before step 8 so push-to-deploy works.

---

## Step 7 — Smoke tests ✅

- [x] **7a Public read** — `/api/content` returns 6 items
- [x] **7b Authz guard** — `POST /api/sessions` without auth → 401
- [x] **7c Sign-in (Google)** — completed OAuth, session cookies set on `neonauth.*` domain
- [x] **7d Lazy profile insert** — `/api/profile` returned 200, row created in DB
- [x] **7e Sign out** — cookie cleared, `/api/profile` returns 401

**Major architectural pivot during this step:** we discovered the original `api/_lib/auth.ts` design (forwarding the request `Cookie` header to Neon's `/get-session`) is fundamentally broken because the auth cookies are scoped to `*.neonauth.*.aws.neon.tech` (Neon's domain), not `localhost:3000`. The browser never sends those cookies to our server, so the cookie forward was empty.

**Fix landed:**
- Server: `api/_lib/auth.ts` now reads `Authorization: Bearer <jwt>` and verifies the JWT signature against `${VITE_NEON_AUTH_URL}/.well-known/jwks.json` using `jose` (no per-request callback to Neon).
- Client: `src/lib/api.ts` exposes `apiFetch()` — fetches a JWT from `${VITE_NEON_AUTH_URL}/token` (browser cookies authenticate this), caches it until ~60s before expiry, and injects `Authorization: Bearer <jwt>` on all `/api/*` requests.
- Sign-out clears the JWT cache.
- Added `jose` as a direct dep.

**Followups (not blocking):**
- All future React code that hits `/api/*` should use `apiFetch` from `@/lib/api`, not raw `fetch`. (No call sites yet — v1 has no persistence wired.)

---

## Step 8 — Vercel production deploy

- [ ] `git push origin <branch>` — Vercel auto-creates a preview deployment
- [ ] Record the preview URL above
- [ ] Vercel Dashboard → Settings → **Environment Variables** → add `VITE_NEON_AUTH_URL` and `DATABASE_URL` for **both Preview AND Production**
- [ ] Neon Console → Auth → **Trusted Origins** → add the preview URL (and production domain if known)
- [ ] Re-run smoke tests 7a–7e against the preview URL
- [ ] Promote to production via Vercel dashboard

**Done when:** preview smoke tests pass and prod is live.

---

## Step 9 — Cleanup

- [ ] Move this doc to `docs/archive/` once you stop referring to it
- [ ] Move `docs/migration-supabase-to-neon.md` to `docs/archive/`
- [ ] (Skip — never had one) Pause/delete old Supabase project

---

## Diagnostics (when something breaks)

| Symptom | Likely cause |
|---|---|
| `psql` migration fails with "relation neon_auth.X does not exist" | Wrong FK target in step 3 — re-check `\dt neon_auth.*` |
| `/api/content` returns 500 | `DATABASE_URL` not loaded in vercel dev — restart `vercel dev` after editing `.env.local`, or run `pnpm dlx vercel env pull .env.local` |
| `/auth/sign-in` blank or "Cannot find AuthView" | Verify `src/main.tsx` imports `@neondatabase/neon-js/ui/css` and route file is `auth.$pathname.tsx` |
| Magic link email never arrives | Neon Auth → Providers → Email config; some providers need SMTP setup |
| OAuth redirect loops | Trusted Origins missing the domain you're hitting |
| `/api/profile` 401 even when signed in | The `/get-session` endpoint path in `api/_lib/auth.ts` may not match Neon's actual endpoint — check the Network tab when the browser calls `authClient.getSession()` to find the real path |
