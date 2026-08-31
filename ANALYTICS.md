# GA4 event instrumentation

All tracking lives in **`analytics.js`**, loaded on every page. It is
delegated from `document`, so no calculator page carries its own tracking
code and new pages are instrumented automatically.

Property: `G-GRJ4BNC69E`

## Events

| Event | Fires when | Parameters |
|---|---|---|
| `calculate` | A calculator form is submitted | `tool_id`, `page_type`, `calc_status` |
| `ad_slot_view` | An ad slot scrolls 50% into view (once per slot per page view) | `tool_id`, `page_type`, `ad_position` |
| `outbound_click` | A link to another domain is clicked | `tool_id`, `page_type`, `link_domain`, `link_url` |

`calc_status` is `success`, `error` (validation rejected the input), or
`unknown`.

## Page identity

Every event carries `tool_id` and `page_type`, derived from the URL:

| URL | `page_type` | `tool_id` |
|---|---|---|
| `/` | `home` | `home` |
| `/tools/mortgage-payment-calculator` | `tool` | `mortgage-payment-calculator` |
| `/guides/how-to-save-50000` | `guide` | `how-to-save-50000` |
| `/investing-calculators` | `hub` | `investing-calculators` |
| `/about`, `/privacy` | `page` | `about` / `privacy` |

## Required GA4 setup

**Event parameters do not appear in reports until they are registered as
custom dimensions.** Data collection starts immediately, but it is not
backfilled into reports — register these as soon as the code deploys, or
the first weeks are only queryable through BigQuery/Explore.

In GA4 → **Admin** → **Custom definitions** → **Create custom dimension**,
add one per row, all scoped to **Event**:

| Dimension name | Scope | Event parameter |
|---|---|---|
| Tool ID | Event | `tool_id` |
| Page type | Event | `page_type` |
| Calc status | Event | `calc_status` |
| Ad position | Event | `ad_position` |
| Link domain | Event | `link_domain` |

Then mark `calculate` as a key event: **Admin** → **Events** → toggle
**Mark as key event**.

## Reading the data

Once dimensions are registered, the reports worth building in **Explore**:

* **Which calculators actually get used** — `calculate` count broken down by
  `tool_id`. Compare against page views for the same page: a page with high
  views and few calculations is attracting the wrong search intent.
* **Which pSEO variants are dead** — `tool_id` values with page views but
  near-zero `calculate` events are consolidation candidates.
* **Whether people reach the ads** — `ad_slot_view` by `ad_position` and
  `tool_id`, as a share of page views. This predicts ad revenue per page
  before the ads earn anything.
* **Broken calculators** — a `tool_id` with a high share of
  `calc_status = error` usually means confusing input labels, not users
  making mistakes.

## Notes

* If `gtag` is blocked by an ad blocker, every call is a silent no-op. A
  calculator never breaks because measurement failed.
* Calculator inputs are never recorded — only that a calculation happened.
  This matches what `/privacy` tells visitors.

## `calc_source`

`calculate` events also carry `calc_source`:

* `user` — someone filled in the form and ran it
* `link` — the page auto-ran because it was opened from a shared result link

Register it as a custom dimension alongside the others if you want usage
numbers that exclude shared-link replays.
