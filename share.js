/* ============================================================
   Finance Tools — shareable result links
   ------------------------------------------------------------
   Puts the calculator's inputs in the query string after a
   successful run, so a result can be linked, bookmarked, or
   sent to someone else and reopened exactly as it was:

     /tools/mortgage-payment-calculator?homePrice=300000&rate=6.5

   Opening such a link fills the form and runs it automatically.

   Delegated from `document` and driven entirely by the shared
   `#calcForm` / `.results` markup, so no calculator page needs
   its own code.
   ============================================================ */

(function () {
  "use strict";

  var form = document.getElementById("calcForm");
  if (!form || !window.URLSearchParams || !window.history) return;

  /** Inputs whose values make up a shareable scenario. */
  function fields() {
    return form.querySelectorAll("input[id], select[id]");
  }

  /** True once the page has rendered a result. */
  function hasResults() {
    return !!document.querySelector(".results.visible");
  }

  /** Current form state as a query string. */
  function serialize() {
    var params = new URLSearchParams();
    var els = fields();
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.value !== "" && el.value != null) params.set(el.id, el.value);
    }
    return params.toString();
  }

  /**
   * Apply any query-string values to the form.
   * Values are only ever assigned to `.value`, never to markup, and a
   * number input rejects anything non-numeric on its own, so a
   * hand-edited link cannot inject anything into the page.
   * @returns {boolean} whether anything was restored
   */
  function restore() {
    var params = new URLSearchParams(location.search);
    var restored = false;
    var els = fields();
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!params.has(el.id)) continue;
      el.value = params.get(el.id);
      if (el.value !== "") restored = true;
    }
    return restored;
  }

  /* ---- Share button, injected after the results block ---- */
  var button;

  function buildButton() {
    var results = document.querySelector(".results");
    if (!results || button) return;

    var row = document.createElement("div");
    row.className = "share-row";

    button = document.createElement("button");
    button.type = "button";
    button.className = "share-btn";
    button.textContent = "Copy link to these results";
    button.addEventListener("click", copyLink);

    row.appendChild(button);
    results.parentNode.insertBefore(row, results.nextSibling);
    row.hidden = true;
  }

  function flash(text) {
    var original = "Copy link to these results";
    button.textContent = text;
    setTimeout(function () { button.textContent = original; }, 2000);
  }

  function copyLink() {
    var url = location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        function () { flash("Link copied"); },
        function () { flash("Press Ctrl+C to copy"); }
      );
      return;
    }
    /* Older browsers: select the URL in a throwaway field. */
    var tmp = document.createElement("input");
    tmp.value = url;
    document.body.appendChild(tmp);
    tmp.select();
    try {
      document.execCommand("copy");
      flash("Link copied");
    } catch (e) {
      flash("Press Ctrl+C to copy");
    }
    document.body.removeChild(tmp);
  }

  /* ---- Keep the address bar in step with the last good result ----
     Runs in the bubble phase, after the page's own submit handler, so
     `.results.visible` already reflects this run. Nothing is written
     for a run that failed validation. */
  document.addEventListener("submit", function (e) {
    if (e.target !== form) return;
    if (!hasResults()) return;

    var qs = serialize();
    history.replaceState(null, "", qs ? location.pathname + "?" + qs : location.pathname);

    buildButton();
    if (button) button.parentNode.hidden = false;
  });

  /* ---- Reopen a shared link ---- */
  if (restore()) {
    /* Tell analytics this run came from a link rather than a person
       typing, so shared traffic does not inflate the usage numbers. */
    window.__ftCalcSource = "link";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    window.__ftCalcSource = null;
  }
})();
