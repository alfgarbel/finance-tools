# IndexNow

[IndexNow](https://www.indexnow.org/) lets a site tell search engines that
pages changed, instead of waiting to be re-crawled. **Bing, Yandex and
Seznam participate. Google does not.**

That is still worth having here: Bing's index is where essentially all of
this site's search traffic comes from (Bing, DuckDuckGo, Yahoo and Ecosia
are all served from it), while Google currently sends close to none.

## How it is set up

| Piece | Purpose |
|---|---|
| `<key>.txt` at the site root | Ownership proof — the filename matches its own contents |
| `scripts/indexnow.mjs` | Builds and posts the payload |
| `.github/workflows/indexnow.yml` | Submits changed pages automatically on deploy |

The script finds the key by scanning the repo root for a `.txt` file whose
basename equals its contents, so rotating the key means replacing that one
file and nothing else.

## Manual use

```shell
node scripts/indexnow.mjs                  # pages changed in the last commit
node scripts/indexnow.mjs --all            # every URL in sitemap.xml
node scripts/indexnow.mjs a.html b.html    # specific pages
node scripts/indexnow.mjs --all --dry-run  # build the payload, send nothing
```

Non-HTML paths are ignored, `index.html` maps to `/`, and `.html` is
stripped to match the site's clean URLs.

## After the first deploy

1. Confirm the key file is live — it must return the key as plain text:
   `https://financialtoolkit.net/<key>.txt`
2. Run `node scripts/indexnow.mjs --all` once to submit the whole site.
3. After that the workflow handles it: every push to the deploy branch that
   touches an `.html` file or `sitemap.xml` submits just those URLs.

## Interpreting the response

| Status | Meaning |
|---|---|
| 200 | URLs accepted |
| 202 | Key accepted, still being validated — normal on a first run |
| 400 | Malformed payload |
| 403 | Key file missing or mismatched — check it is deployed |
| 422 | A URL does not belong to this host, or the key mismatches |
| 429 | Rate limited |

## Notes

* Submit changed URLs, not the whole site, on a routine basis. `--all` is
  for the initial submission or after a bulk content change.
* A submission is a hint, not a guarantee — it affects crawl scheduling,
  not whether a page is judged worth indexing.
* This has no effect on Google. Google discovery still depends on the
  sitemap, internal linking, and the domain earning crawl budget.
