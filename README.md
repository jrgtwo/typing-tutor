# Typing Tutor

A reluctantly encouraging typing speed gauge. A sarcastic raccoon will, on
occasion, applaud you. Probably.

---

## What it is

Typing Tutor is a practice app for people who'd rather type real writing
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

## Design exploration

We're still figuring out what the typing surface itself should feel
like, so the `/practice` route currently ships alongside a handful of
skins — same engine, different aesthetic bets. They exist as a live
lookbook, not as user-facing settings. The current variants, by route:

- **`/practice`** — the default warm-paper Apple II treatment.
- **`/practice/terminal`** — full phosphor-green CRT terminal.
- **`/practice/typewriter`** — noir parchment on a dark walnut desk.
- **`/practice/arcade`** — neon attract-screen with a glowing score.
- **`/practice/focus`** — zen indigo void; almost everything fades out.
- **`/practice/synth`** — retrowave deck with sun-over-grid horizon.
- **`/practice/cockpit`** — amber military HUD with analog gauges.
- **`/practice/karaoke`** — stage-lit single-line focus, lyrics style.
- **`/practice/chat`** — iMessage-style thread; the raccoon DMs you the
  passage and you type the reply.
- **`/practice/desk`** — 2D tactile workspace; notepad, sticky notes,
  torn typo receipt, scattered across a dark-wood desk.

Each skin reads from the same typing engine, so the numbers, the
typo-tracking, and the keyboard heatmap all behave identically — only
the layout and palette change. Most will not survive. A few might.

## What's coming

- A real content library (not four hardcoded passages).
- Progress tracking tied to an account — streaks, per-key long-term
  accuracy, a dashboard that shows where your fingers keep tripping.
- A free tier that's generous, and a paid tier that's worth paying for.
- More raccoon.

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
