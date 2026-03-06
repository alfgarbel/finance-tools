# Finance Tools

A collection of free, lightweight financial calculators built with HTML, CSS, and vanilla JavaScript. No frameworks, no build step — just open `index.html` in a browser.

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
  index.html                                  # Homepage
  style.css                                   # Shared stylesheet
  script.js                                   # Shared JavaScript helpers
  README.md
  tools/
    compound-interest-calculator.html
    dividend-yield-calculator.html
    percentage-increase-calculator.html
    investment-return-calculator.html
    salary-after-tax-spain.html
```

## Tech Stack

- **HTML5** — semantic markup with SEO meta tags
- **CSS3** — custom properties, grid, flexbox, responsive design
- **Vanilla JavaScript** — no frameworks or transpilation
- **Chart.js 4.x** (CDN) — used only for the compound interest growth chart

## License

For educational purposes only.
