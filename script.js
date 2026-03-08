/* ============================================================
   Finance Tools — Shared JavaScript Helpers
   Reusable formatting, validation, and UI utilities used
   across all calculator pages.
   ============================================================ */

/**
 * Format a number as USD currency string.
 * @param {number} value
 * @returns {string} e.g. "$12,345.67"
 */
function formatCurrency(value) {
  if (!isFinite(value)) return "$0.00";
  var sign = value < 0 ? "-" : "";
  return sign + "$" + Math.abs(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Format a number as EUR currency string.
 * @param {number} value
 * @returns {string} e.g. "€12,345.67"
 */
function formatEUR(value) {
  if (!isFinite(value)) return "€0.00";
  var sign = value < 0 ? "-" : "";
  return sign + "€" + Math.abs(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
  return value.toFixed(decimals) + "%";
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
