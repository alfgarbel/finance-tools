# Querying GA4 from Claude Code

Google publishes an official MCP server for Google Analytics
([googleanalytics/google-analytics-mcp](https://github.com/googleanalytics/google-analytics-mcp),
PyPI package `analytics-mcp`). With it, Claude Code can read this site's GA4
data directly and answer questions like *"which calculators were actually
run last week?"* instead of you exporting reports by hand.

This repo ships the server config in `.mcp.json`. The one-time setup below
runs on **your own machine** — it cannot be done from a Claude Code web/cloud
session, because the Google sign-in needs an interactive browser and a cloud
container is discarded when the session ends.

## What it can do

| Tool | Use |
|---|---|
| `get_account_summaries` | List the GA4 accounts and properties you can access |
| `get_property_details` | Metadata for one property |
| `get_custom_dimensions_and_metrics` | Confirm the custom dimensions from `ANALYTICS.md` registered correctly |
| `run_report` | Any core report — the main one |
| `run_realtime_report` | Last 30 minutes |
| `run_funnel_report` | Multi-step funnels |
| `list_google_ads_links` | Linked Google Ads accounts |

It is **read-only**. It cannot change GA4 configuration, so it cannot register
the custom dimensions for you — that stays a manual step in the GA4 UI.

## Setup

### 1. Prerequisites

* Python 3.10 or newer
* [`pipx`](https://pipx.pypa.io/stable/installation/) — or use `uv`, see the note at the end
* The [gcloud CLI](https://cloud.google.com/sdk/docs/install)

### 2. Create a Google Cloud project and enable the APIs

A Cloud project is only used for authentication and quota — the GA4 data
itself stays in Analytics. A free-tier project is fine.

```shell
gcloud projects create finance-tools-analytics   # or reuse an existing project
gcloud config set project finance-tools-analytics

gcloud services enable analyticsadmin.googleapis.com
gcloud services enable analyticsdata.googleapis.com
```

### 3. Authenticate

Sign in as the Google account that has access to the GA4 property
(`G-GRJ4BNC69E`):

```shell
gcloud auth application-default login \
  --scopes=https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/cloud-platform
```

This writes Application Default Credentials to a well-known path that the
server discovers automatically — no credential file path needs configuring,
and no key material is stored in this repo.

### 4. Point the config at your project

`.mcp.json` reads the project ID from the environment so no IDs are committed:

```shell
export GOOGLE_PROJECT_ID=finance-tools-analytics
```

Add that to your shell profile (`~/.zshrc`, `~/.bashrc`) so it persists.

### 5. Start Claude Code in this repo

```shell
claude
```

Claude Code will ask once whether to trust the project-scoped MCP server in
`.mcp.json`. Approve it, then check it connected with `/mcp`.

## Verifying it works

Ask Claude:

> List my GA4 properties.

You should get the property behind `G-GRJ4BNC69E`. Note its **numeric
property ID** — reports are addressed by that, not by the `G-` measurement ID.

Then, once traffic has accumulated:

> Using GA4, show `calculate` event counts by `tool_id` for the last 28 days,
> next to page views for the same pages.

That is the report that identifies which of the pSEO variants are dead weight.

## Useful questions once data exists

* Which `tool_id` values have page views but almost no `calculate` events?
* What share of `calculate` events have `calc_status = error`, by `tool_id`?
* What percentage of page views produce an `ad_slot_view`, by `page_type`?
* Which pages generate `outbound_click` events, and to which domains?

These depend on the custom dimensions in `ANALYTICS.md` being registered in
GA4 first. Until they are, the parameters exist in the raw event stream but
are not queryable as dimensions.

## Using uv instead of pipx

If you have [`uv`](https://docs.astral.sh/uv/) but not `pipx`, change the
command in `.mcp.json`:

```json
"command": "uvx",
"args": ["analytics-mcp"]
```

## Troubleshooting

| Symptom | Cause |
|---|---|
| Server does not appear in `/mcp` | `pipx` not on PATH, or the project-scoped server was not approved — re-run `claude` and accept, or check `claude mcp list` |
| `PermissionDenied` on the Admin API | APIs not enabled on the project in step 2 |
| Empty property list | Signed in as an account without access to the GA4 property |
| `GOOGLE_PROJECT_ID` unset | The export in step 4 is missing from the current shell |
