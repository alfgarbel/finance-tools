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

## Page structure

The calculator keeps its card — elevation there means "this is the tool".
Everything below it is prose, and a border around every paragraph block
flattens the hierarchy rather than building it, so `.card.section` unboxes
and a rule carries the separation the border used to.

Heroes are left-aligned, and the homepage's blue gradient is a flat ground
with a rule beneath it.

## Headings

Body `h2` and `h3` are sentence case. The conversion was driven by the
site's own vocabulary rather than a word list: a word is lowercased only if
it already appears lowercase at least twice in the site's prose, which
preserves proper nouns and abbreviations without having to enumerate them.

Two rules make it safe to run over 2,047 headings:

* **All or nothing.** If any interior word is capitalised and the site never
  writes it lowercase, the whole heading is left alone. A partial conversion
  reads as a typo — "Frequently Asked questions" is worse than the original.
* **Hyphenated compounds are judged per segment**, so "Inflation-Adjusted"
  becomes "inflation-adjusted" instead of surviving as a false abbreviation
  among lowered neighbours.

Product names are protected outright: any heading matching a page `h1`, a
tool name, or the brand keeps its capitals. `h1` and `<title>` are untouched.

`scripts/` holds no copy of this — it was a one-off migration, and rerunning
it on already-converted text would be a no-op.

## Footer

One footer, byte-identical on all 132 pages: brand on its own row, then four
columns — Calculators, Guides, Topics, Pages — on a `repeat(4, minmax(0,1fr))`
grid that steps to 2 columns at 768px and 1 at 560px. **No links were removed.** They are real internal-linking paths and
the crawl depends on them — a previous change deliberately added 50 of them
to give Google a route to pages it could otherwise only reach through the
sitemap. Thinning the footer would have worked against that.

## One system, not two

The homepage used to run a parallel `hp-*` design system: its own footer, its
own hero measure, its own type scale, its own section rhythm. Same palette, so
it never looked *wrong* — but it did not line up with any other page, which is
what made the site read as two sites stitched together.

Everything below is now shared, and is the thing to check before adding a page:

| | Value |
|---|---|
| Content column | `max-width: 800px`, `1.25rem` gutter (`1rem` under 768px) |
| Left edge | every `h1`, section, hero and footer starts on the same line |
| `h1` | 40px / 32px / 26px across the three breakpoints |
| Hero lede | 17px, `max-width: 520px` |
| Section heading | 20px, weight 700, `-0.015em` |
| Section rhythm | `2.25rem` top padding and margin, 1px rule, first rule suppressed |
| Bordered box | `1.5rem 1.5rem 1.25rem`, `--radius`, `--shadow-lg` on hover |

`.hp-*` classes still exist for components only the homepage has — the badge,
the trust bar, the featured card, the audience and "why" grids. They inherit
the shared values rather than redefining them.

Two things were folded back in on the way:

* **`.content-section`** was used on `about` and `privacy` and had **no CSS
  rule at all** — those two pages had been rendering with browser-default
  `h2` sizing and no section separation. They now use `.card.section`.
* **Prose links** were the browser default blue `#0000EE` on every page,
  the one element never given a colour by the palette. They are now
  `--accent`, underlined, scoped to unclassed anchors inside prose so the
  breadcrumb, nav, footer and tool cards keep their own rules.
* **`.btn`** never set `text-decoration`, so the same button was underlined
  as an `<a>` and not underlined as a `<button>`.

## What has not changed yet

Form labels are sentence-cased in style but the markup still reads
`Home Price` rather than `Home price`. Converting it means editing label
text on 97 pages, and the abbreviations in play (PMI, APY, IRPF, CAGR) make
a blind lowercase unsafe, so it is left for a deliberate pass.
