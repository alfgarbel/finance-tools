# Embeddable calculators

Other sites can drop a working calculator into their own page. They get a
free interactive tool; the site gets an in-content link from a topically
relevant page. It is the one link channel that keeps earning after the work
stops.

## What a host site pastes

```html
<iframe src="https://financialtoolkit.net/embed/mortgage-payment-calculator"
        width="100%" height="460" style="border:0"
        loading="lazy" title="Mortgage Payment Calculator"></iframe>
<script src="https://financialtoolkit.net/embed-host.js" async></script>
```

The second line is optional. With it the frame resizes to fit its content;
without it the frame keeps whatever height was set. A missing host script
degrades to a fixed-height embed, never a broken one.

## Available embeds

| Path | Calculator |
|---|---|
| `/embed/compound-interest-calculator` | Compound Interest |
| `/embed/mortgage-payment-calculator` | Mortgage Payment |
| `/embed/loan-payment-calculator` | Loan Payment |
| `/embed/retirement-calculator` | Retirement |
| `/embed/savings-goal-calculator` | Savings Goal |

## How it fits together

| File | Role |
|---|---|
| `embed/<slug>.html` | The frame: calculator, results, attribution. No site chrome. |
| `embed-calc.js` | Renders the calculator from `data-` attributes; also used by the guide pages |
| `embed-frame.js` | Runs inside the frame — reports height, tags analytics |
| `embed-host.js` | Runs on the host site — applies the reported height |
| `embed-snippet.js` | The "Embed this calculator" panel on each tool page |

`embed-calc.js` holds one entry per calculator, and each `compute()` is
deliberately identical to the corresponding tool page's own function, so an
embed and the full calculator can never disagree. Adding a sixth embed means
adding a registry entry and an `embed/<slug>.html` shell — nothing else.

## Deliberate choices

**The attribution link is followed, not `nofollow`.** The link is editorial:
a host chose to place the calculator. `rel="noopener"` is set for the
`target="_blank"`, which does not affect link following.

Keep the attribution modest and the anchor text honest — the calculator's own
name, never a keyword-stuffed phrase. Google has historically discounted
widget links where the attribution looked like a payment for the tool.
Overreach is what turns this from an asset into a liability.

**Frames are `noindex, follow` and canonical to the full tool page**, so the
stripped frame never competes with the real page in search results while
still passing link equity onward.

**The panel is self-serve.** Someone can find a calculator, decide to embed
it, and do so without contacting anyone. That is the point — the asset has to
work while nobody is watching it.

## Measuring it

| Event | Fires when | Parameters |
|---|---|---|
| `embed_view` | An embedded frame loads | `page_type: "embed"`, `tool_id`, `embed_host` |
| `embed_snippet_copy` | Someone copies a snippet | `tool_id` |

`embed_host` records only the hostname of the embedding page, never its path.
Register it as a custom dimension in GA4 to see which sites are using the
calculators and how much traffic each returns.
