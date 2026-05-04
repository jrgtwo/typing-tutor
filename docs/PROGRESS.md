# KeyBandit — Progress & Plan Snapshot

Updated 2026-05-03 — Auth + persistence + dashboard are end-to-end wired
locally and on production at https://key-bandit.vercel.app. Sign-in is
a Google-only modal (no separate `/auth/sign-in` page in the user flow).
Finished sessions persist `sessions` + `key_stats_user` + `key_stats_session`
when signed in; anonymous runs stay local. `/dashboard` reads the data
back as summary stats, a WPM line chart, a lifetime keyboard heatmap, and
a recent-runs table. Pick this up next time to know where we left off
without re-reading the original plan.

The full v1 architecture plan is at `~/.claude/plans/we-are-going-to-wise-lark.md`
and remains the source of truth for *why* things are shaped this way.

---

## TL;DR — current state

You can type, sign in, and see your runs.

- Anonymous: `/practice/desk` (and the other variants) work — engine
  runs locally, the on-screen keyboard heatmaps live usage, no API
  calls. Nothing persists.
- Signed in: a finished passage POSTs `/api/sessions`, PATCHes
  `/api/sessions/[id]`, and POSTs `/api/key-stats` from
  `src/engine/persist.ts`. Failures log but never throw.
- `/dashboard`: TanStack Query hits `/api/dashboard` on every visit
  (`refetchOnMount: 'always'` since the global default is `staleTime:
  60_000`). Renders summary stats, an SVG WPM chart, a lifetime
  `KeyHeatmap`, and a recent-runs table. Auth-gated in-component
  (signed-out gets a sign-in CTA, not a redirect).

Hardcoded passages still in use; `/api/content` not consumed yet.

Routes:
- `/` — marketing landing. Sign-in pill in the header.
- `/practice` — default warm-paper typing session. Sign-in pill in header.
- `/practice/desk` — **the focus variant**. Sign-in pill in header.
- `/practice/<other-variant>` — focus, terminal, arcade, etc. Lookbook only;
  do **not** spend effort wiring features into them. They share
  `usePracticeSession` so cross-cutting features inherit automatically
  if any variant gets revived.
- `/dashboard` — auth-gated runs ledger.
- `/auth/$pathname` — Neon `<AuthView>` route. **No longer linked to from
  the user flow** — sign-in is a modal triggered by `<SignInButton>`. The
  route still exists in case a deep link is ever useful.

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

Run `pnpm dev` for the Vite client only, or `pnpm dev:api` (which runs
`pnpm dlx vercel dev`) when you need the `api/*` serverless routes too.
`pnpm typecheck` and `pnpm build` both pass.

**Local env files**: the project uses two:
- `.env` — read by `vercel dev` for the Node serverless runtime. Must
  contain `DATABASE_URL` and `VITE_NEON_AUTH_URL`.
- `.env.local` — read by Vite for the client bundle. Same variables.

Both are gitignored. `.env.development.local` is **not** read by Vercel
CLI — that's a Next.js convention. If `vercel dev` complains about
`VITE_NEON_AUTH_URL must be set in the server runtime`, copy `.env.local`
to `.env`. Long term: rename the server var to `NEON_AUTH_URL` (no
`VITE_` prefix) since that prefix is Vite client-side convention.

---

## What's built — file map

```
src/
├── main.tsx                         # mount: QueryClient + RouterProvider + fonts + globals
├── styles/globals.css               # Tailwind v4 import, palette tokens, scanline + caret animation
├── routes/
│   ├── __root.tsx                   # router root
│   ├── index.tsx                    # ✅ marketing landing (sign-in pill in header)
│   ├── practice.tsx                 # ✅ default warm-paper session (sign-in pill in header)
│   ├── practice_.desk.tsx           # ✅ FOCUS variant — sign-in pill in header
│   ├── practice_.<other>.tsx        # 🟡 lookbook only; do not feature-target
│   ├── dashboard.tsx                # ✅ summary + WPM chart + heatmap + recent runs
│   └── auth.$pathname.tsx           # ✅ Neon <AuthView> (route exists, not in user flow)
├── lib/
│   ├── auth-client.ts               # ✅ Better Auth client (createAuthClient + BetterAuthReactAdapter)
│   ├── auth.ts                      # ✅ useSession, requireAuth, signOut, signInWithGoogle
│   ├── api.ts                       # ✅ apiFetch with cached JWT bearer
│   ├── queries.ts                   # ✅ TanStack Query hooks (useDashboard so far)
│   ├── plan.ts                      # ✅ can() capability gating (free/pro/power table)
│   ├── device.ts                    # ✅ isDesktop()
│   └── utils.ts                     # ✅ cn() for Tailwind class merging
├── hooks/
│   ├── usePracticeSession.ts        # ✅ shared hook — passage select, keydown bridge, persistence
│   ├── useEngineElapsedMs.ts        # ✅ live elapsed-ms hook for HUDs
│   └── useCaretScroll.ts            # ✅ keep caret in viewport
├── engine/
│   ├── types.ts                     # ✅ EngineState / EngineEvent / Mode types
│   ├── reducer.ts                   # ✅ pure reducer; non-halting errors
│   ├── store.ts                     # ✅ Zustand wrapper
│   ├── metrics.ts                   # ✅ computeWpm / computeAccuracy
│   ├── persist.ts                   # ✅ POST/PATCH session + key-stats on finish (signed-in only)
│   └── modes/
│       ├── prose.ts                 # ✅ smart-quote + whitespace normalization
│       └── code.ts                  # ✅ code mode with auto-indent on Enter
├── components/
│   ├── chrome/
│   │   ├── PaperPanel.tsx           # ✅ cream-paper card primitive
│   │   └── CRTFrame.tsx             # ✅ scanline + vignette wrapper
│   ├── ads/
│   │   └── AdSlot.tsx               # ✅ no-op v1 placeholder
│   ├── auth/
│   │   ├── SignInButton.tsx         # ✅ chrome pill — opens modal when out, dropdown when in
│   │   └── SignInModal.tsx          # ✅ Google-only modal (replaces /auth/sign-in in user flow)
│   ├── analytics/
│   │   ├── KeyHeatmap.tsx           # ✅ static keyboard heatmap from aggregated stats
│   │   └── WpmChart.tsx             # ✅ inline SVG sparkline of WPM over recent runs
│   ├── mascot/
│   │   └── RaccoonCameos.tsx        # 🟡 raccoon visuals only; full mascot/triggers TBD
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

All client-side calls to `api/*` go through `src/lib/api.ts` `apiFetch()`
so the JWT bearer header is automatically attached. Active call sites:
`src/engine/persist.ts` (session finish) and `src/lib/queries.ts`
(dashboard).

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
11. **Sign-in is a modal, not a route.** The Neon `<AuthView>` page
    looked like a generic Better Auth panel and didn't match the
    aesthetic. `SignInModal` calls `authClient.signIn.social({ provider:
    'google', callbackURL: window.location.href })` directly so the user
    lands back where they triggered sign-in. `/auth/$pathname` route
    still exists; nothing in the user flow links to it.
12. **Persistence rounds integers.** `state.startedAt` / `state.finishedAt`
    come from `performance.timeOrigin + performance.now()`, which is
    fractional. The DB columns `duration_ms` / `total_latency_ms` are
    `int`/`bigint` and reject decimals (saw `invalid input syntax for
    type integer: "343.5"` in dev). `engine/persist.ts` `Math.round`s
    those before sending. `wpm` and `accuracy` stay decimal — those
    columns are `numeric`.
13. **Dashboard refetches on every visit.** Global `QueryClient` default
    is `staleTime: 60_000`. The dashboard query overrides with
    `refetchOnMount: 'always'` so finishing a passage and clicking
    through always shows the new run. Other queries can keep cache.
14. **Variant focus narrowed to Desk.** Earlier rule required feature
    parity across all variants because the direction wasn't picked.
    Now: only `/practice/desk` is the active product target. Other
    variants stay in the tree as a lookbook. Cross-cutting features
    still live in `usePracticeSession` (or sibling hooks) so any
    variant inherits if revived later — only routes/layouts diverge.

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
1. **Replace hardcoded passages with `/api/content`** — fetch via
   TanStack Query through `apiFetch('/api/content')`; endpoint is
   public so no token required. Keep `samplePassages.ts` as a fallback
   when env is missing.
2. **Anonymous "save this run" nudge** — when a signed-out user finishes
   a passage, drop a small raccoon-flavored prompt in the results area
   pointing to the sign-in modal. Soft, dismissible. Schema and
   persistence already handle the signed-in path; this is pure UI.

### Pre-launch
3. **Replace shared Google OAuth credentials** with our own Google Cloud
   OAuth client. See `docs/neon-provisioning-checklist.md` §"TODO before
   production launch". Without this, users see "Continue to Neon" instead
   of "Continue to KeyBandit" on the consent screen.
4. **Rename server-side `VITE_NEON_AUTH_URL` → `NEON_AUTH_URL`.** The
   `VITE_` prefix is Vite client convention; using it for the Node
   serverless runtime is misleading. One env-var rename + update
   `api/_lib/auth.ts`. Keep `VITE_NEON_AUTH_URL` for the client.

### Brand layer
5. **Raccoon mascot** — `components/raccoon/Raccoon.tsx`,
   `quips.ts` (~60 lines bucketed by trigger), `triggers.ts` that
   subscribes to engine events with a cooldown. `RaccoonCameos.tsx`
   is the only mascot file in the tree right now.

### Quality / production-ready
6. **Engine unit tests** — pure reducer is the easy win. Cover:
   correct sequence, wrong-char advance, backspace, code auto-indent,
   prose smart-quote normalization, finish detection.
7. **Mobile bounce on `/practice/desk`** — `requireDesktop` guard in
   `beforeLoad`; mobile redirects to landing with a friendly note.
8. **shadcn init** + restyle Button/Dialog primitives to the warm
   palette before they spread.
9. **Esc to reset / Tab to next passage** — small keyboard
   shortcuts the engine can absorb without UI churn.
10. **Code-split the auth UI bundle** — Vercel build warns about a
    1 MB main chunk; the Neon `<AuthView>` library is pulling in a
    lot. Since the modal-based sign-in skips `<AuthView>` for users,
    lazily importing the `/auth/$pathname` route would shed most of
    the weight from the initial bundle.

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
pnpm dev:api                         # = pnpm dlx vercel dev (vite + api/*)
pnpm typecheck                       # tsc -b --noEmit, should be silent
pnpm build                           # vite build && tsc -b --noEmit
```

Build order matters: `vite build` runs first so the TanStack Router
plugin generates `routeTree.gen.ts`, *then* tsc validates against it.
Reversing the order breaks Vercel's clean-checkout deploy.

`pnpm dev:api` requires `.env` (Vercel CLI's serverless-runtime convention),
not `.env.local` (Vite's). Easiest: keep both files in sync — they hold the
same `DATABASE_URL` + `VITE_NEON_AUTH_URL`. Both are gitignored.

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
