/* ============================================================
   Finance Tools — Shared JavaScript Helpers
   Reusable formatting, validation, and UI utilities used
   across all calculator pages.
   ============================================================ */

/* Formatters are built once — constructing an Intl.NumberFormat per call is
   markedly slower, and the year-by-year tables format thousands of values. */
var CURRENCY_FORMATTERS = {};

/**
 * Look up (or build) a cached currency formatter.
 * @param {string} currency  ISO 4217 code, e.g. "USD"
 * @returns {Intl.NumberFormat}
 */
function currencyFormatter(currency) {
  if (!CURRENCY_FORMATTERS[currency]) {
    CURRENCY_FORMATTERS[currency] = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency
    });
  }
  return CURRENCY_FORMATTERS[currency];
}

/**
 * Format a number as USD currency string.
 * Uses Intl so that very large results stay readable — hand-rolled grouping
 * breaks above 1e21, where Number#toFixed switches to exponential notation
 * and renders as "$1e+21".
 * @param {number} value
 * @returns {string} e.g. "$12,345.67"
 */
function formatCurrency(value) {
  if (!isFinite(value)) return "$0.00";
  /* Fold -0 and values that round to zero, so nothing shows as "-$0.00". */
  if (Math.abs(value) < 0.005) value = 0;
  return currencyFormatter("USD").format(value);
}

/**
 * Format a number as EUR currency string.
 * @param {number} value
 * @returns {string} e.g. "€12,345.67"
 */
function formatEUR(value) {
  if (!isFinite(value)) return "€0.00";
  if (Math.abs(value) < 0.005) value = 0;
  return currencyFormatter("EUR").format(value);
}

/**
 * Format a number as a percentage string.
 * @param {number} value  Already in percentage form (e.g. 7.5 for 7.5%)
 * @param {number} [decimals=2]
 * @returns {string} e.g. "7.50%"
 */
function formatPercent(value, decimals) {
  if (decimals === undefined) decimals = 2;
  if (!isFinite(value)) return "0.00%";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value) + "%";
}

/**
 * Safely parse a numeric input value.
 * Returns the parsed float, or the provided fallback if the value
 * is empty, NaN, or non-finite.
 * @param {string|number} raw
 * @param {number} [fallback=0]
 * @returns {number}
 */
function parseNum(raw, fallback) {
  if (fallback === undefined) fallback = 0;
  var n = parseFloat(raw);
  return isFinite(n) ? n : fallback;
}

/**
 * Safely parse an integer input value.
 * @param {string|number} raw
 * @param {number} [fallback=0]
 * @returns {number}
 */
function parseInt10(raw, fallback) {
  if (fallback === undefined) fallback = 0;
  var n = parseInt(raw, 10);
  return isFinite(n) ? n : fallback;
}

/**
 * Show a results container by adding the "visible" class.
 * @param {string} id  Element ID
 */
function showResults(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add("visible");
}

/**
 * Show or hide an error message element.
 * @param {string} id  Element ID of the .error-msg
 * @param {string} [message]  If provided, sets text and shows; if falsy, hides.
 */
function setError(id, message) {
  var el = document.getElementById(id);
  if (!el) return;
  if (message) {
    el.textContent = message;
    el.classList.add("visible");
  } else {
    el.textContent = "";
    el.classList.remove("visible");
  }
}

/**
 * Set the text content of an element by ID.
 * @param {string} id
 * @param {string} text
 */
function setText(id, text) {
  var el = document.getElementById(id);
  if (el) el.textContent = text;
}
