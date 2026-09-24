# Design

## Visual Theme

**Light, dense, instrumental.** A financial instrument read on a laptop in a lit room,
not a console glowing in the dark. The page is a near-white sheet with hairline rules
doing the structural work; elevation is deliberately absent, because a shadow implies
a layer and there are no layers here. Colour carries state and nothing else.

Rejected outright: neon on black, gradient text, glassmorphism, glowing borders,
identical card grids, nested cards, the KPI-hero template.

## Color

Strategy: **Restrained.** Tinted neutrals plus one interactive accent, under 10% of
surface. Semantic green/red/amber are reserved for state and never used decoratively.
Neutrals are tinted toward the accent hue (chroma 0.003–0.008); nothing is `#000` or
`#fff`.

| Role | Token | Value |
|---|---|---|
| Page | `--color-page` | `oklch(0.982 0.003 264)` |
| Panel | `--color-surface` | `oklch(0.997 0.0015 264)` |
| Sunken (table heads, insets) | `--color-sunken` | `oklch(0.966 0.004 264)` |
| Hairline | `--color-line` | `oklch(0.906 0.006 264)` |
| Hairline, emphasised | `--color-line-strong` | `oklch(0.84 0.008 264)` |
| Ink | `--color-ink` | `oklch(0.25 0.014 264)` |
| Ink, muted | `--color-ink-muted` | `oklch(0.52 0.013 264)` |
| Ink, faint | `--color-ink-faint` | `oklch(0.63 0.011 264)` |
| Accent (interaction only) | `--color-accent` | `oklch(0.50 0.155 264)` |
| Accent, hover | `--color-accent-hover` | `oklch(0.44 0.16 264)` |
| Accent, soft fill | `--color-accent-soft` | `oklch(0.955 0.023 264)` |
| Allowed / paid | `--color-ok` | `oklch(0.45 0.115 155)` |
| …soft / line | `--color-ok-soft`, `--color-ok-line` | `oklch(0.958 0.028 155)`, `oklch(0.86 0.055 155)` |
| Denied / failed | `--color-bad` | `oklch(0.47 0.185 27)` |
| …soft / line | `--color-bad-soft`, `--color-bad-line` | `oklch(0.964 0.022 27)`, `oklch(0.87 0.06 27)` |
| Expired / caution | `--color-warn` | `oklch(0.50 0.11 70)` |
| …soft / line | `--color-warn-soft`, `--color-warn-line` | `oklch(0.966 0.035 75)`, `oklch(0.88 0.07 75)` |

Semantic *text* tones are darker than their fills so 11–12px text clears WCAG AA.
The one loud element on the page is the kill switch, and it is loud on purpose.

## Typography

One family for everything; system stack (native feel, no webfont fetch, nothing leaves
the machine). Monospace for anything that is machine output: hashes, addresses, ids,
epochs, amounts, receipt counts.

```
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui,
             "Helvetica Neue", Arial, "Noto Sans SC", "PingFang SC", sans-serif
--font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace
```

Fixed rem scale, ratio ≈1.2 (product register: no fluid type).

| Step | Size | Use |
|---|---|---|
| 0.6875rem | 11px | `.label` small caps, chips, IDs |
| 0.75rem | 12px | meta lines, table cells, reasons |
| 0.8125rem | 13px | row primary text |
| 0.9375rem | 15px | section titles |
| 1.25rem | 20px | page title |

`.mono` sets `font-variant-numeric: tabular-nums` so columns of figures align.

## Layout

Four horizontal bands, no floating cards:

1. **Top bar** (sticky): name, tagline, language control, kill switch. Hairline under.
2. **Status strip**: hairline-divided cells replacing what were three separate cards —
   anchoring, chain agreement, verification, evidence. Cells, not boxes.
3. **Work surface**: two columns. Authorizations narrow (~360px, a dense list), timeline
   wide. Different widths on purpose; equal halves would be the grid reflex.
4. **Footer**: provenance line.

Rules inside a panel carry the separation; a panel is a surface with a hairline border
and a section header, never a rounded box per fact. Spacing varies by band (24/16/12)
rather than one padding repeated everywhere.

Responsive is structural: the two columns stack under `lg`, the status strip wraps.

## Components

State vocabulary every interactive element must have: default, hover, focus-visible,
active, disabled, busy. Focus is a 2px accent outline at 2px offset, never removed.

- **Section header**: `.label` small caps + count in mono + optional action, hairline under.
- **Status chip**: 1px tinted border, tinted fill, dark semantic text, 11px semibold.
  The word is always present; colour never carries state alone.
- **Row**: CSS grid, columns per panel. Hover tints to `--color-sunken`. Traced rows take
  an accent-soft fill and a 2px accent inline-start marker drawn as a pseudo-element, not
  a side-stripe border.
- **Progress**: 3px track in `--color-sunken`, fill in the semantic colour.
- **Skeleton**: pulsing tinted bars at the row's real height. Never a spinner inside content.
- **Empty state**: teaches the next action, states it plainly, no illustration.
- **Hash**: middle-elided for display, full value in `title`, mono, copy-safe.

## Motion

150ms, `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint). Only state changes animate:
hover tints, trace highlighting, chip and bar transitions. No page-load choreography, no
decorative loops. Everything collapses to ~0ms under `prefers-reduced-motion`.

## Language

English is the default and the fallback for every key. English and Chinese are switchable
from the top bar, persisted locally. The document `lang` follows the choice.

Engine output is **never** translated: policy reasons, status values (`verified`,
`tampered`, `incomplete`, `paid`, `denied`) and every hash stay verbatim, because they are
the evidence and the screen must not paraphrase what the receipt proves.
