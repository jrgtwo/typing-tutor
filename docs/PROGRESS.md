# KeyBandit — Progress & Plan Snapshot

Updated 2026-05-02 — Supabase → Neon migration is **complete and
deployed to production** at https://key-bandit.vercel.app. Better Auth
via Neon Auth (Google OAuth only), JWT bearer tokens server-side via
JWKS verification, all `api/*` routes responding correctly. Pick this
up next time to know where we left off without re-reading the original
plan.

The full v1 architecture plan is at `~/.claude/plans/we-are-going-to-wise-lark.md`
and remains the source of truth for *why* things are shaped this way.

---

## TL;DR — current state

You can type. Open `/practice`, you get a hardcoded passage, the engine
records WPM / accuracy / per-key stats, and the on-screen keyboard
heatmaps your usage live. Auth + DB are wired and **work in production
on Vercel** — Neon (Postgres) + Neon Auth (Better Auth) provisioned,
schema + seed applied, Google sign-in flows end-to-end, lazy profile
insert verified, JWT bearer auth on all `api/*` routes verified against
the deployed URL.

**No persistence is wired into the typing session yet** — the backend
is ready but the engine doesn't call `/api/*` on session-finish.
Hardcoded passages still in use; `/api/content` not consumed yet.

Routes:
- `/` — marketing landing.
- `/practice` — the typing session (HUD, surface, on-screen keyboard, results).
- `/practice/<variant>` — alternate practice layouts (focus, terminal, arcade, etc.).
- `/dashboard` — placeholder (auth-gated history view, not built).
- `/auth/$pathname` — Neon Auth UI (sign-in, sign-out, account, etc.) via `<AuthView>`.

---

## Brand reminders (don't drift from these)

- **Identity**: warm analog "modern Apple II" — cream paper, IBM Plex
  Mono/Serif, amber accent, rust for errors, soft phosphor green for
  the keyboard's expected/clean states. Subtle CRT scanlines on the
  typing surface only.
- **Mascot**: sarcastic raccoon. Reluctant compliments, never mean,
  never cheery. Pops up occasionally — not constantly. Not built yet.
- **Positioning**: typing speed gauge with personality, not a
  learn-to-type curriculum. No lessons.
- **Don't copy** Monkeytype / typing.com / Keybr / SpeedCoder.

---

## Stack (installed and working)

| Layer | Choice |
|---|---|
| Build | Vite 6 + React 19 + TypeScript 5 (SPA) |
| Routing | TanStack Router (file-based, auto code-split) |
| Server data | TanStack Query |
| Local state | Zustand (engine only) |
| Styling | Tailwind v4 + shadcn/ui (shadcn not yet `init`'d) |
| Fonts | `@fontsource/ibm-plex-mono` + `@fontsource/ibm-plex-serif` |
| Backend | Neon (Postgres) + Neon Auth (Better Auth), accessed through Vercel serverless `api/*` routes |
| Hosting | Vercel (Vite SPA + `api/*` serverless functions) |

> **Migration note:** moved off Supabase to Neon. First pass wired Stack
> Auth (now deprecated by Neon); second pass swapped to Better Auth via
> `@neondatabase/neon-js`. Server-side validation uses **JWT bearer
> tokens** verified locally against the JWKS endpoint — cookies don't
> reach localhost because they're scoped to `*.neonauth.*.aws.neon.tech`.
> Client uses `src/lib/api.ts` `apiFetch()` to fetch + cache the JWT and
> inject `Authorization: Bearer <jwt>` on every `/api/*` call.
> ✅ Migration complete and live in production at https://key-bandit.vercel.app.
> See `docs/neon-provisioning-checklist.md` for the full step record
> (and the lessons learned about Vercel + TanStack Router + ESM imports).

Run `pnpm dev` from `/home/jonat/projects/typing-tutor` (port falls back
to 5174 if 5173 is taken). `pnpm typecheck` and `pnpm build` both pass.

---

## What's built — file map

```
src/
├── main.tsx                         # mount: QueryClient + RouterProvider + fonts + globals
├── styles/globals.css               # Tailwind v4 import, palette tokens, scanline + caret animation
├── routes/
│   ├── __root.tsx                   # router root
│   ├── index.tsx                    # ✅ marketing landing
│   ├── practice.tsx                 # ✅ typing session + sample passage picker
│   ├── dashboard.tsx                # 🟡 placeholder
│   └── auth.$pathname.tsx           # ✅ Neon Auth UI (mounts <AuthView pathname={pathname} />)
├── lib/
│   ├── auth-client.ts               # ✅ Better Auth client (createAuthClient + BetterAuthReactAdapter)
│   ├── auth.ts                      # ✅ useSession, requireAuth, sign-in helpers (Better Auth-backed)
│   ├── plan.ts                      # ✅ can() capability gating (free/pro/power table)
│   ├── device.ts                    # ✅ isDesktop()
│   └── utils.ts                     # ✅ cn() for Tailwind class merging
├── engine/
│   ├── types.ts                     # ✅ EngineState / EngineEvent / Mode types
│   ├── reducer.ts                   # ✅ pure reducer; non-halting errors
│   ├── store.ts                     # ✅ Zustand wrapper
│   ├── metrics.ts                   # ✅ computeWpm / computeAccuracy
│   └── modes/
│       ├── prose.ts                 # ✅ smart-quote + whitespace normalization
│       └── code.ts                  # ✅ code mode with auto-indent on Enter
├── components/
│   ├── chrome/
│   │   ├── PaperPanel.tsx           # ✅ cream-paper card primitive
│   │   └── CRTFrame.tsx             # ✅ scanline + vignette wrapper
│   ├── ads/
│   │   └── AdSlot.tsx               # ✅ no-op v1 placeholder
│   └── typing/
│       ├── TypingSession.tsx        # ✅ orchestrator: load + window keydown + render
│       ├── TypingSurface.tsx        # ✅ per-char coloring, caret on current, code whitespace glyphs
│       ├── HUD.tsx                  # ✅ live WPM/ACC/ERR/TIME with self-tickling clock
│       ├── OnScreenKeyboard.tsx     # ✅ active + expected + live usage heatmap
│       └── ResultsPanel.tsx         # ✅ end-of-session summary + try-again/next
├── data/
│   └── samplePassages.ts            # ✅ 4 hardcoded passages (2 prose, 2 code)
└── routeTree.gen.ts                 # auto — generated by TanStack Router plugin

db/
├── migrations/0001_init.sql         # ✅ profiles + content_items + sessions + key_stats_* + keystrokes (no RLS — auth in serverless routes)
└── seed.sql                         # ✅ 6 sample content_items

api/
├── _lib/                            # ✅ db client, JWT verification (jose + JWKS), ensureProfile()
├── content.ts                       # ✅ public GET — content_items
├── sessions.ts                      # ✅ POST — start a session (auth required)
├── sessions/[id].ts                 # ✅ PATCH — finish a session
├── key-stats.ts                     # ✅ POST — upsert lifetime + insert per-session
├── dashboard.ts                     # ✅ GET — recent sessions + lifetime heatmap
└── profile.ts                       # ✅ GET / PATCH — own profile
```

Client-side calls to `api/*` should go through `src/lib/api.ts` `apiFetch()`
so the JWT bearer header is automatically attached. No call sites yet
(persistence isn't wired into the practice flow).

---

## Decisions made during build (deltas from the original plan)

These are intentional refinements — write them down so we don't relitigate.

1. **Errors do not halt progress.** The original reducer made the cursor
   stick on a wrong char until the user typed the expected one. That
   felt punishing. Now: cursor always advances, the wrong char lands
   in `typed`, the position renders in rust on the surface, accuracy
   reflects the miss honestly. Backspace still works to fix.
2. **Heatmap on the on-screen keyboard is live, not just on the dashboard.**
   The original plan had `KeyHeatmap` only on `/dashboard`. We added
   per-session usage + error tinting directly to `OnScreenKeyboard`
   so it's visible during practice. The dashboard heatmap (lifetime,
   from `key_stats_user`) is still planned but not built.
3. **Heatmap encodes both axes** — intensity by usage (saturates at
   ~15 presses), hue by error rate (lerp phosphor green → rust).
   Constants `HEAT_SATURATION_PRESSES` and `HEAT_MAX_OPACITY` at the
   top of `OnScreenKeyboard.tsx` if you need to tune.
4. **No `/practice/$sessionId` route yet.** Just `/practice` with an
   in-memory passage picker. Splitting into picker + run routes can
   wait until persistence is wired and there's a real concept of a
   session id.
5. **`shadcn` not yet initialized.** `clsx` + `tailwind-merge` + `cn`
   are in place. Run `pnpm dlx shadcn@latest init` when you need
   the first primitive (Button, Dialog).
6. **Vite sometimes binds 5174** because 5173 is taken on this box.
   Just check the dev server output.
7. **`src/routeTree.gen.ts` is gitignored** — the Vite plugin
   regenerates it on every dev/build. First-time typecheck will fail
   until you've run `pnpm dev` once. The `build` script is therefore
   `vite build && tsc -b --noEmit` (vite-first so the plugin generates
   the file before tsc reads it).
8. **`api/*.ts` relative imports use `.js` extensions** — Vercel's TS
   function runtime uses Node ESM resolution, which requires the `.js`
   extension on relative imports even when the source is `.ts`. So
   `import { sql } from './_lib/db.js'` (not `'./_lib/db'`).
9. **SPA fallback in `vercel.json`** — `rewrites` rule sends any
   non-`/api/` path to `/` so TanStack Router can handle client-side
   routes (e.g. `/auth/sign-in`) on direct page loads.
10. **JWT bearer instead of cookie forwarding for server auth** —
    Neon Auth cookies are scoped to `*.neonauth.*.aws.neon.tech`, so
    the browser never sends them to our API. Client fetches a JWT from
    `/token`, sends as `Authorization: Bearer <jwt>`, server verifies
    against the JWKS endpoint with `jose`.

---

## Monetization hooks (still hooks-only, both paths)

- **Subscriptions** — `profiles.plan` defaults `'free'`. RLS prevents
  user-side updates; future Stripe webhook (Edge Function) will be
  the only writer. `lib/plan.ts` `can()` is the single gate.
- **Display ads** — `<AdSlot placement="...">` is a no-op render in
  v1. When a network is chosen later, only that one component changes.
  Ads NEVER appear on the typing surface — chrome regions only.

Tier definitions in `lib/plan.ts` are placeholder; user explicitly
deferred the actual tier design.

---

## What's NOT built (next steps, roughly in dependency order)

### Highest leverage next
1. **Persistence on session finish** — `engine/persist.ts` calls
   `apiFetch('POST /api/sessions')` then `apiFetch('PATCH /api/sessions/[id]')`
   + `apiFetch('POST /api/key-stats')` on `status === 'finished'`. Skip
   `keystrokes` until paid tiers exist. Use `apiFetch` from `src/lib/api.ts`
   so the JWT bearer header attaches automatically.
2. **Sign-in entry point** — header avatar / sign-in button that links
   to `/auth/sign-in`. The Neon `<AuthView>` page is the actual UI; we
   just need an entry point from the landing/practice chrome.
3. **Replace hardcoded passages with `/api/content`** — fetch via
   TanStack Query (calling `apiFetch('/api/content')`; that endpoint is
   public so no token is required, but going through `apiFetch` is fine).
   Keep `samplePassages.ts` as a fallback when env is missing.

### Pre-launch
4. **Replace shared Google OAuth credentials** with our own Google Cloud
   OAuth client. See `docs/neon-provisioning-checklist.md` §"TODO before
   production launch". Without this, users see "Continue to Neon" instead
   of "Continue to KeyBandit" on the consent screen.

### Brand layer
5. **Raccoon mascot** — `components/raccoon/Raccoon.tsx`,
   `quips.ts` (~60 lines bucketed by trigger), `triggers.ts` that
   subscribes to engine events with a cooldown.

### Analytics view
6. **Dashboard** — query `sessions` for history (sparkline of WPM
   over time) + query `key_stats_user` for the lifetime heatmap.
   Reuse the keyboard layout component logic.

### Quality / production-ready
8. **Engine unit tests** — pure reducer is the easy win. Cover:
   correct sequence, wrong-char advance, backspace, code auto-indent,
   prose smart-quote normalization, finish detection.
9. **Mobile bounce on `/practice`** — `requireDesktop` guard in
   `beforeLoad`; mobile redirects to landing with a friendly note.
10. **shadcn init** + restyle Button/Dialog primitives to the warm
    palette before they spread.
11. **Esc to reset / Tab to next passage** — small keyboard
    shortcuts the engine can absorb without UI churn.
12. **Code-split the auth UI bundle** — Vercel build warns about a
    1 MB main chunk; the Neon `<AuthView>` library is pulling in a
    lot. Splitting the auth route would help cold-start LCP.

### Future (explicitly NOT in v1)
- Beginner lessons / curriculum
- Custom user-pasted text
- LLM-generated raccoon quips (gated behind `raccoon.dynamic`)
- Leaderboards, real-time multiplayer races
- Stripe billing UI (only the schema hooks exist)
- Live ad network integration (only the slot exists)
- `keystrokes` table writes (table exists, writer disabled)
- Mobile typing experience
- i18n

---

## Verification — how to know it still works

### Local
```bash
cd /home/jonat/projects/typing-tutor
pnpm install                         # if deps changed
pnpm dev                             # vite only — generates routeTree.gen.ts
pnpm dlx vercel dev                  # vite + api/* serverless functions
pnpm typecheck                       # tsc -b --noEmit, should be silent
pnpm build                           # vite build && tsc -b --noEmit
```

Build order matters: `vite build` runs first so the TanStack Router
plugin generates `routeTree.gen.ts`, *then* tsc validates against it.
Reversing the order breaks Vercel's clean-checkout deploy.

### Production
- Frontend: https://key-bandit.vercel.app
- API: https://key-bandit.vercel.app/api/content (public read sanity test)
- Auth: https://key-bandit.vercel.app/auth/sign-in (Google OAuth)

### Server-side auth — how it works
1. Browser fetches a JWT from `${VITE_NEON_AUTH_URL}/token` (cookies
   work browser → Neon Auth domain).
2. `src/lib/api.ts` `apiFetch()` caches the JWT and injects
   `Authorization: Bearer <jwt>` on every `/api/*` call.
3. `api/_lib/auth.ts` verifies the JWT signature against
   `${VITE_NEON_AUTH_URL}/.well-known/jwks.json` using `jose` (no
   per-request callback to Neon).

Cookies cannot reach our API directly because Neon Auth's session
cookies are scoped to `*.neonauth.*.aws.neon.tech`. The JWT bearer is
the cross-domain workaround.

Manual frontend smoke (no DB needed yet — passages are hardcoded fallback):
1. Visit `/` — landing renders, IBM Plex fonts loaded, amber + cream
   palette visible.
2. Click "Start typing" → land on `/practice`.
3. Type the passage. Wrong chars highlight rust, cursor still advances.
4. Watch the on-screen keyboard tint up — intensity by usage, hue
   by error rate.
5. Finish the passage → results panel appears with WPM / accuracy /
   errors and a "next passage" button.
6. Switch to a code passage (fizzbuzz / fib) — Enter auto-skips
   indentation, whitespace renders as `↵` glyph.

---

## Pointers

- Original architecture plan: `~/.claude/plans/we-are-going-to-wise-lark.md`
- Brand-direction memory: `~/.claude/projects/-home-jonat-projects-typing-tutor/memory/brand_direction.md`
- Monetization memory: `~/.claude/projects/-home-jonat-projects-typing-tutor/memory/monetization.md`
