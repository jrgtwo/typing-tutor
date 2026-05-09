# Desk Variant — Stolen-Pile Redesign

**Date:** 2026-05-09
**Variant:** `/practice/desk` (`src/routes/practice_.desk.tsx`)
**Problem:** Current layout reads as disorganized — cluttered and sparse simultaneously. Side props sit in two tidy columns with even gaps. Wood-grain real estate between columns is dead space. Props are matching stationery, so the "raccoon stole this" premise never lands.

## Goal

Make the desk feel like the raccoon dumped a haul of stolen stuff against your notepad. Asymmetric on purpose: a dense overlapping pile on the left, a calm zone on the right.

## Aesthetic anchors

Primary signal: **damaged goods** — every prop carries at least one of {tear, stain, scratch, bite, scratched-out name, foreign stamp}. No prop is pristine.

Reinforcing signals:
- **Mismatched origins** — props clearly come from different places (a hotel matchbook, a body-shop calendar, a polaroid, a gum wrapper, a stranger's day-planner page).
- **Wrong-owner tells** — names crossed out, "PROPERTY OF —" scratched, foreign stamps still visible.

The "crime scene" framing is rejected — the right metaphor is a *fence's desk*, not a violent scene.

## Spatial strategy

**Notepad-anchored asymmetric pile.**

- The notepad stays centered as the magnet. Tear animation, page measurement, and content rendering inside the notepad are **untouched**.
- The scatter section drops the existing `grid-cols-[220px_1fr_220px]` layout. It becomes a `relative` container with explicit height (notepad height + breathing room). Children use absolute positioning with rotation, scale, and z-index variance.
- **Left side** = dense overlapping cluster. Props lean into and touch the notepad's left edge, and overlap each other.
- **Right side** = calm. Two clean items with breathing room. Wood grain on the right is intentional negative space that frames the pile.

Rotation range widens from current ±5° to roughly ±14° with no clustering at one angle. Shadow stack overlaps so items read as physically resting on each other.

## Prop inventory

### Left pile (5 items, overlapping)

1. **Day-planner page** — backdrop of the pile. Torn-out left edge (jagged clip-path). Pre-printed "MAR 14 · TUE" header. Faint "L. KOWALSKI" inked stamp at top. Two pre-existing handwritten lines crossed out below. **Hosts WPM** via a sticky note slapped over part of her notes.
2. **Typo receipt** — keep current component, restyled subtly. Narrow vertical, upper-left of the pile, partially behind the planner page. Already feels stolen — diner-receipt typography reads as taken.
3. **Polaroid** — square, mid-pile. White border with a jagged bite missing from the top-right corner (raccoon teeth). Faint coffee ring on the white border. **Hosts ACC** value handwritten in marker on the bottom strip.
4. **Foil gum wrapper** — small, slapped at the front of the pile (highest z in the pile). Silver gradient with crinkle highlights. Jagged torn edges via clip-path. **Hosts ERR** count scrawled in ballpoint directly on the foil.
5. **Matchbook** — tiny accent, peeks from behind the planner page near the bottom. Cardboard rectangle with "STARLIGHT LOUNGE — 1402 PINE" in deco type. Two parallel claw scratches across the cover. Atmosphere only, no live data.

### Right zone (2 items, clean separation)

1. **Vinny's Auto Body promo calendar** — upper-right. Red header with shop name and a fake phone number. Today's date circled in red marker. A couple of past dates X'd out (raccoon's been counting days). Replaces current `Calendar` component styling but keeps the same `total / index` data binding.
2. **File cards** — lower-right, clear breathing room. Top card reads "PROPERTY OF —" with a thick scribbled scratch-out where the name was, "FRESH HAUL" hand-lettered underneath. Otherwise the existing `CardStack` interaction (wheel, ▲/▼ buttons, tap-to-load) is preserved.

## Layout geometry (concrete)

The scatter section becomes a single `relative` container, not a 3-column grid.

```
┌───────────────────────────────────────────────────────────────┐
│  receipt(-12°)                                                │
│      planner(-8°)         NOTEPAD(-0.8°)        calendar(+3°) │
│         polaroid(+6°)        │                                │
│            wrapper(-3°)      │                                │
│         matchbook(+14°)      │                  cards(-2°)    │
└───────────────────────────────────────────────────────────────┘
```

Left pile items overlap each other and tuck their right edges **under** the notepad's left edge by ~24px (lower z than the notepad). Right zone items sit clear of the notepad with no overlap.

The container's height is computed from the notepad height plus padding so the layout doesn't depend on viewport math beyond what the existing notepad already imposes.

## Z-order

```
notepad surface (z 20-50, including binding)
│
├─ left pile (front to back):
│    gum wrapper        z 18
│    polaroid           z 16
│    day-planner page   z 14
│    typo receipt       z 12
│    matchbook          z 10
│
└─ right zone:
     calendar           z 14
     file cards         z 14
```

Items in the left pile that tuck under the notepad's edge use z below the notepad's z 20 baseline so the notepad visually sits on top of the pile's right edge.

## Damage primitives

A small CSS/SVG kit shared across props:

- **Jagged tear edge** — a clip-path generated from a small set of irregular polygon points, applied to the planner-page left edge, gum-wrapper edges, polaroid corner.
- **Coffee ring** — already exists in the file as decor; can be reused as an inline style on the polaroid border.
- **Claw scratches** — two parallel rotated `linear-gradient` stripes with low opacity, applied to the matchbook cover.
- **Marker scribble scratch-out** — a thick `repeating-linear-gradient` block over text to obscure a name on the file card.
- **Foil texture** — a multi-stop linear-gradient with subtle highlights to fake brushed silver on the gum wrapper.

These are inline styles, not a new global stylesheet, to keep changes scoped to the desk variant.

## Live-data wiring

Per the brand commitment to plug-and-play features, the engine state subscriptions stay where they were:

- WPM sticky → `charsCorrect`, elapsed → `computeWpm`
- ACC marker text → `charsCorrect`, `charsTyped` → `computeAccuracy`
- ERR scrawl → `errors`
- Typo receipt → `typed`, `target`, `cursor` (existing)
- Calendar → `total / index` from `usePracticeSession` (existing)
- Card stack → `passages`, `index`, `pickPassage` (existing)

The only change is the visual host for each value. The `StickyStat` helper is repointed to render inside whichever new prop hosts it.

## Out of scope

- Notepad internals, tear animation, page-flip math, snapshot tear (untouched).
- `OnScreenKeyboard` and its "Model F · Walnut" wrapper (untouched).
- `StampTray` mode picker strip at the top (untouched).
- `IndexCard` in the header showing file-no/title (untouched).
- `RaccoonCameos` (untouched).
- Other practice variants (`/cockpit`, `/arcade`, `/synth`, `/terminal`, `/typewriter`, `/focus`) — all unchanged.
- New typing modes, new HUD variants, new ad placements.

## Non-goals

- Draggable or interactive props. Props are decoration plus stat hosts; not a desktop OS.
- Procedural variation per session. Prop positions and rotations are fixed; "Vinny's" and "L. KOWALSKI" are constants.
- Dark/light theme switch. Dark only, per existing project rule.

## Files touched

- `src/routes/practice_.desk.tsx` — scatter section rewrite, prop placement, replace `Sticky` and `Calendar` with new components, repoint `StickyStat`.
- New small components either in the same file or under `src/components/desk/` for cleanliness (decision deferred to implementation):
  - `DayPlannerPage`
  - `Polaroid`
  - `GumWrapper`
  - `Matchbook`
  - `VinnyCalendar` (replaces `Calendar`)
  - `PropertyOfCards` (restyles `CardStack`)

## Verification

- Dev server (`pnpm dev`), open `/practice/desk`.
- Visual checks:
  - Left side reads as a tight overlapping pile, items touch each other and the notepad.
  - Right side has only two items with obvious wood breathing room.
  - At least 4 distinct rotation angles visible across props.
  - Every prop shows at least one damage detail.
  - No items in tidy column lanes.
- Functional checks:
  - WPM, ACC, ERR all update during typing.
  - Typo receipt logs typos.
  - Calendar shows today's day and current passage index.
  - Card stack still cycles with wheel and arrow buttons; tap-to-load still works.
  - Tear animation still fires on page break and passage swap.
  - On-screen keyboard still responds.
- Reading the typing target on the notepad is unimpeded; nothing in the pile occludes the typing area.
