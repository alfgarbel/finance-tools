# Design system

## Palette

One accent hue, one neutral family, two quiet supporting tones. Named by
role in `style.css`; the Tailwind-shaped names (`--blue-600`, `--slate-500`
and so on) remain as an alias layer so existing rules keep working.

| Token | Value | Used for |
|---|---|---|
| `--accent` | `#0E5C4A` | The answer, primary actions, links |
| `--sage` / `--sage-deep` | `#5C7A63` / `#47614D` | Secondary figures |
| `--sand` / `--sand-deep` | `#9A7C39` / `#80642C` | Tertiary figures |
| `--negative` | `#9B3A22` | Validation errors and losses only |
| `--n-50` … `--n-900` | `#F5F6F3` … `#14181A` | Neutrals, faint green cast |

Neutrals carry a slight green bias so they sit with the accent rather than
fighting it. Shadows are tinted `rgba(20,24,26,…)` rather than neutral
black, so they read as shade rather than as a grey wash.

New rules should use the role names. The alias block exists to avoid a
sweep through 228 selectors, not as the preferred API.

## Type

| Token | Face | Used for |
|---|---|---|
| `--font-sans` | Geist | Everything not a figure |
| `--font-mono` | Geist Mono | Every figure, computed or typed |

Any element displaying a number carries `font-variant-numeric: tabular-nums`
so digits keep their column as values change — result tiles, data tables,
number inputs, and the amortization summary. Without it, a figure shifts
width while someone types it.

## Contrast

Every foreground/background pair in use meets WCAG AA (4.5:1) against the
surface it actually renders on, verified from the rendered page rather than
from the token values.

`--n-400` is deliberately darker than a mid-grey would suggest: it is only
ever used as a text colour, and it has to clear 4.5:1 on white, on the
`#F5F6F3` footer, and on `#ECEFE9` panels. The palette it replaced failed
that test in three places.

## Results

The first `.result-item` on every calculator is the figure people came for;
the rest support it. That holds on all 97 pages, so the hierarchy is
expressed with `:first-child` rather than a new class — no markup had to
change, which is why the reordering carried no risk to the calculation code.

The headline spans the full grid row in the accent at 2.75rem; supporting
figures sit below a rule at 1.125rem in near-black. `.results.cols-2` stacks
its pair, `.results.cols-4` puts three supporting figures in a row.

The `.blue` / `.green` / `.amber` classes on result items are now inert.
They remain in the markup of 97 pages, but colour no longer decorates a
result — it marks the answer.

## Form fields

Inputs are a baseline rule rather than a box. Focus thickens and colours
that rule; keyboard focus additionally draws a real outline, so removing the
old focus ring did not cost the affordance.

## What has not changed yet

**Phase 4** — unboxing the content sections, left-aligning the heroes and
simplifying the footer — is not applied.

Form labels are sentence-cased in style but the markup still reads
`Home Price` rather than `Home price`. Converting it means editing label
text on 97 pages, and the abbreviations in play (PMI, APY, IRPF, CAGR) make
a blind lowercase unsafe, so it is left for a deliberate pass.
