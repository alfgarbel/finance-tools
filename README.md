# Finance Tools

Free, lightweight financial calculators built with HTML, CSS, and vanilla JavaScript.
No frameworks, no build step — just open `index.html` in a browser.

Live at [financialtoolkit.net](https://financialtoolkit.net). 97 calculator pages,
27 guides, and 5 hub pages, deployed on Vercel.

## Calculators

| Tool | Description |
|------|-------------|
| **Compound Interest Calculator** | Project investment growth with monthly contributions and compound interest. Includes a Chart.js line chart. |
| **Dividend Yield Calculator** | Calculate dividend yield, annual income, and estimated monthly income from any stock. |
| **Percentage Increase Calculator** | Find the percentage increase or decrease between two values. |
| **Investment Return Calculator** | Measure total return, annualized return (CAGR), and profit from any investment. |
| **Salary After Tax — Spain** | Estimate net salary in Spain after income tax (IRPF) and social security. |

## How to Run

1. Clone or download this repository.
2. Open `index.html` in any modern web browser.
3. Click any calculator card to navigate to the tool.

No server, no build tools, no dependencies required (Chart.js is loaded via CDN only on the compound interest page).

## Project Structure

```
finance-tools/
  index.html                    # Homepage
  all-calculators.html          # Full directory
  about.html                    # About
  privacy.html                  # Privacy policy
  investing-calculators.html    # Topic hubs
  mortgage-and-loan-calculators.html
  savings-and-financial-planning.html
  inflation-and-money-tools.html
  style.css                     # Shared stylesheet
  script.js                     # Shared JS helpers (formatting, parsing, UI)
  ads.js                        # Google AdSense integration — see ADSENSE.md
  ads.txt                       # Authorized digital sellers
  robots.txt
  sitemap.xml
  vercel.json
  tools/                        # 97 calculator pages
  guides/                       # 27 explainer articles
```

## Tech Stack

- **HTML5** — semantic markup with SEO meta tags
- **CSS3** — custom properties, grid, flexbox, responsive design
- **Vanilla JavaScript** — no frameworks or transpilation
- **Chart.js 4.x** (CDN) — used only for the compound interest growth chart

## Monetization

Ads are served through Google AdSense and configured entirely in `ads.js`.
Until a publisher ID is filled in, pages render inert grey placeholders.
See [ADSENSE.md](ADSENSE.md) for the setup steps.

## License

For educational purposes only.
