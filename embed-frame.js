/* ============================================================
   Finance Tools — embed frame helpers
   ------------------------------------------------------------
   Loaded only inside /embed/* pages. Reports the page's real
   height to the host so the iframe fits its content, and tags
   analytics so embedded use is separable from site traffic.
   ============================================================ */

(function () {
  "use strict";

  /* ---- Tell the host how tall we are ----
     Hosts run embed-host.js, which listens for this message. Sites that
     do not run it simply keep the height they set on the iframe, so a
     missing host script degrades to a fixed-height embed rather than a
     broken one. */
  function reportHeight() {
    if (window.parent === window) return;
    var h = Math.ceil(document.documentElement.getBoundingClientRect().height);
    try {
      window.parent.postMessage({ type: "financialtoolkit:height", height: h }, "*");
    } catch (e) {
      /* Cross-origin restrictions — nothing to do. */
    }
  }

  window.addEventListener("load", reportHeight);
  window.addEventListener("resize", reportHeight);
  if (window.ResizeObserver) {
    new ResizeObserver(reportHeight).observe(document.documentElement);
  }
  /* Results appearing changes the height, so re-report after a run. */
  document.addEventListener("submit", function () { setTimeout(reportHeight, 0); });

  /* ---- Analytics ----
     page_type reports "embed" and embed_host records which site is
     showing it, so referred traffic can be attributed. document.referrer
     is the host page; only its hostname is recorded, never the path. */
  if (typeof window.gtag === "function") {
    var host = "";
    try {
      if (document.referrer) host = new URL(document.referrer).hostname;
    } catch (e) { host = ""; }
    window.gtag("event", "embed_view", {
      page_type: "embed",
      tool_id: (location.pathname.split("/").pop() || "").replace(/\.html$/, ""),
      embed_host: host || "(direct)"
    });
  }
})();
