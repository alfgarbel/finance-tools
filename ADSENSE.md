# Google AdSense setup

Ad rendering is driven from a single file: **`ads.js`**. No page markup needs
to change to turn ads on, off, or to swap ad units.

## How it works

Every page loads `ads.js` from `<head>` and contains one or two placeholders:

```html
<div class="ad-slot" data-ad-position="content">
  <span class="ad-slot-label">Advertisement</span>
</div>
```

`ads.js` reads `ADSENSE_CONFIG`, and:

* **If no publisher ID is set** (the default), it does nothing. Pages keep
  rendering the dashed grey placeholder, exactly as before.
* **If a publisher ID is set**, it adds `ads-live` to `<html>`, injects the
  AdSense loader into `<head>`, and turns each placeholder into a real
  `<ins class="adsbygoogle">` unit.

It also:

* Skips ad requests on `localhost` and `file://` so development traffic never
  produces impressions or clicks (invalid traffic is the fastest way to get an
  AdSense account suspended).
* Collapses a slot when AdSense reports `data-ad-status="unfilled"`, so unsold
  inventory does not leave a blank hole mid-article.
* Reserves `min-height` on each slot to limit Cumulative Layout Shift.

## Positions in use

| `data-ad-position` | Where it sits | Pages |
|---|---|---|
| `content` | Directly below the calculator result / after the second section on guides | 130 |
| `bottom` | Below the FAQ block, above the related-tools grid | 124 |

## Turning ads on

1. **Get approved.** Apply at [adsense.google.com](https://adsense.google.com)
   with `financialtoolkit.net`. Approval requires a reachable privacy policy
   (`/privacy`), an about page (`/about`), and original content — all present.
2. **Create two ad units** in AdSense → *Ads* → *By ad unit*:
   * an **In-article** unit for the `content` position
   * a **Display** unit (responsive) for the `bottom` position

   Copy the 10-digit `data-ad-slot` value out of each snippet.
3. **Fill in `ads.js`:**

   ```js
   var ADSENSE_CONFIG = {
     client: "ca-pub-1234567890123456",
     units: {
       content: { slot: "1234567890", format: "fluid", layout: "in-article" },
       bottom:  { slot: "0987654321", format: "auto", fullWidthResponsive: true }
     },
     ...
   };
   ```
4. **Fill in `/ads.txt`** with the same publisher ID (without the `ca-`
   prefix). AdSense will flag the site as "earnings at risk" until this
   matches.
5. **Enable Google's consent message.** In AdSense → *Privacy & messaging* →
   *GDPR*, publish the EEA/UK consent message and the *Privacy & terms*
   message. Google requires a certified CMP for European traffic; using
   Google's own message means no extra code in this repo.
6. Deploy and confirm ads render on a couple of pages.

## Notes

* `/ads.txt` is served as a static file by Vercel; `cleanUrls` does not affect
  it.
* Two units per page is deliberate. AdSense allows more, but a calculator page
  where the tool is the reason people arrived from search loses more in
  bounce rate than it gains in impressions.
* Never click your own ads, including from a phone on the same network.
