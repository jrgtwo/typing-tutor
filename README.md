# KeyBandit

A reluctantly encouraging typing speed gauge. A sarcastic raccoon will, on
occasion, applaud you. Probably.

---

## What it is

KeyBandit is a practice app for people who'd rather type real writing
than the same 200 random English words on a loop. Passages are short
pieces of prose or code — a poem, a workshop proverb, a fizzbuzz — and
the app judges your speed and accuracy with gentle contempt.

It's built around three ideas:

1. **Real text beats word lists.** You retain more if the thing you're
   typing is something you'd enjoy reading. The passage library is meant
   to grow into a small, opinionated collection of literature and code —
   never filler.
2. **Tactile, analog feel.** The default look is a warm cream paper, IBM
   Plex Mono and Serif, amber accents, rust for mistakes, soft phosphor
   green for the on-screen keyboard. Subtle CRT scanlines where they
   belong. The goal is "modern Apple II" — it should feel like something
   you left on a desk, not another SaaS dashboard.
3. **A raccoon with standards.** Copy, microcopy, and reactions are
   filtered through the voice of a mildly judgmental raccoon. Finishing
   a passage earns you something like "acceptable" or "okay okay okay.
   show-off" — never a confetti cannon.

## What you can do

- **Practice prose or code.** Prose runs as flowing paragraphs. Code
  mode visualizes whitespace, auto-skips indentation on Enter, and
  respects the exact characters in the source.
- **Live feedback without the noise.** WPM, accuracy, error count, and
  an elapsed clock update as you type. Correct characters darken to
  ink; the current character is a blinking amber block; mistypes
  persist in rust so you can see where you drifted.
- **A keyboard that remembers.** The on-screen keyboard draws a running
  heatmap from your session — heavily-used keys tint green, error-prone
  keys lean rust. It's pressure-sensitive in the metaphorical sense:
  the more you use a key, the more you'll see it.
- **Session results that read like a verdict.** When you finish, the
  results panel lands in a small paper card with a terse headline. No
  animated celebration. The raccoon nods, almost imperceptibly.
- **A ledger if you sign in.** Sign in (Google) and finished passages
  persist to your account. The dashboard shows recent runs, a WPM
  trend, summary stats, and a lifetime keyboard heatmap that
  accumulates across sessions. Anonymous typing still works — it just
  doesn't follow you to next time.
- **Tune the raccoon.** Settings control how often the mascot pops in:
  chatty, normal, rare, or off. Default is normal. Display name lives
  there too.

## Design exploration

The active practice variant is **`/practice/desk`** — a 2D tactile
workspace where the typing surface lives on a notepad, with sticky
notes for live stats, a torn typo receipt, and the on-screen keyboard
laid out across a dark-wood desk. The bare `/practice` URL redirects
to this variant.

A handful of other skins (`terminal`, `typewriter`, `arcade`, `focus`,
`synth`, `cockpit`, `karaoke`, `chat`) still exist on disk under
`src/routes/practice_.*.tsx` as a lookbook, but they're no longer
linked from anywhere in the UI. Each skin reads from the same typing
engine and shares `usePracticeSession`, so if a variant is ever revived
the numbers, typo-tracking, and keyboard heatmap will already work — the
files diverge only in layout and palette. To bring the lookbook back,
restore the early-returning body in `src/components/DesignNav.tsx`.

## What's coming

- A growing content library — passages now load from the database, and
  there's a small admin dashboard for adding/editing them. The four
  hardcoded passages stay as an offline fallback only.
- A free tier that's generous, and a paid tier that's worth paying for
  (the schema and `can()` capability gate already exist; checkout flow
  doesn't).
- More raccoon — currently a static copy bank; later, optional
  LLM-generated quips for the paid tier.

---

## Running locally

Requires Node 20+ and [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev
```

The dev server prints a local URL (defaults to `http://localhost:5173`).
Open it, pick a passage, and start typing.

Useful scripts:

- `pnpm typecheck` — run the TypeScript project build in `--noEmit` mode.
- `pnpm build` — production build (regenerates the TanStack Router
  route tree as a side effect).
- `pnpm test` — Vitest, for the typing engine.
