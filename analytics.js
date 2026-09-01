/* ============================================================
   Finance Tools — GA4 event instrumentation
   ------------------------------------------------------------
   GA4's built-in measurement only records page views, which
   cannot distinguish a page people land on from a page whose
   calculator they actually use. This adds three events:

     calculate       a calculator was run (and whether it worked)
     ad_slot_view    an ad slot was scrolled into view
     outbound_click  a link to another site was clicked

   Every event carries `tool_id` and `page_type` so results can
   be broken down per calculator. Both must be registered as
   custom dimensions in GA4 before they appear in reports —
   see ANALYTICS.md.

   All work is delegated from `document`, so no calculator page
   needs its own tracking code.
   ============================================================ */

(function () {
  "use strict";

  /**
   * Send an event to GA4, if the tag loaded at all.
   * Silently does nothing when gtag is blocked or absent.
   * @param {string} name
   * @param {Object} params
   */
  function track(name, params) {
    if (typeof window.gtag !== "function") return;
    try {
      window.gtag("event", name, params);
    } catch (e) {
      /* Never let measurement break a calculator. */
    }
  }

  /**
   * Derive page identity from the URL, so no page needs to
   * declare its own name.
   * @returns {{page_type: string, tool_id: string}}
   */
  function pageInfo() {
    var path = location.pathname.replace(/\.html$/, "").replace(/\/+$/, "");
    var parts = path.split("/").filter(Boolean);
    if (parts.length === 0 || parts[0] === "index") {
      return { page_type: "home", tool_id: "home" };
    }
    if (parts[0] === "tools") return { page_type: "tool", tool_id: parts[1] };
    if (parts[0] === "guides") return { page_type: "guide", tool_id: parts[1] };
    if (parts[0] === "about" || parts[0] === "privacy") {
      return { page_type: "page", tool_id: parts[0] };
    }
    return { page_type: "hub", tool_id: parts[0] };
  }

  var PAGE = pageInfo();

  /** Merge the page identity into an event's parameters. */
  function withPage(params) {
    var out = { page_type: PAGE.page_type, tool_id: PAGE.tool_id };
    for (var k in params) {
      if (Object.prototype.hasOwnProperty.call(params, k)) out[k] = params[k];
    }
    return out;
  }

  /* ---- calculate ----------------------------------------------------
     Delegated from `document`, so it runs during the bubble phase after
     the page's own submit handler has already written the results. That
     lets us read the outcome synchronously: a visible .error-msg means
     validation rejected the input, otherwise visible results mean the
     calculation ran. None of the page handlers call stopPropagation. */
  document.addEventListener("submit", function (e) {
    var form = e.target;
    if (!form || form.id !== "calcForm") return;

    var failed = !!document.querySelector(".error-msg.visible");
    var shown = !!document.querySelector(".results.visible");

    track("calculate", withPage({
      calc_status: failed ? "error" : (shown ? "success" : "unknown"),
      /* Set by share.js when reopening a shared link, and by
         embed-calc.js for the worked answer it runs on page load, so
         neither inflates the count of people actually using the tool.
         A real interaction reports "user". */
      calc_source: window.__ftCalcSource || "user"
    }));
  });

  /* ---- ad_slot_view --------------------------------------------------
     Which pages actually get scrolled far enough to reach an ad slot.
     Fires at most once per slot per page view. */
  function watchAdSlots() {
    var slots = document.querySelectorAll(".ad-slot[data-ad-position]");
    if (!slots.length || !window.IntersectionObserver) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        track("ad_slot_view", withPage({
          ad_position: entry.target.getAttribute("data-ad-position")
        }));
      });
    }, { threshold: 0.5 });

    for (var i = 0; i < slots.length; i++) observer.observe(slots[i]);
  }

  /* ---- outbound_click ------------------------------------------------
     Clicks leaving the site. This is the signal that shows whether the
     affiliate blocks are worth filling in, and which pages send traffic. */
  document.addEventListener("click", function (e) {
    var link = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!link) return;

    var href = link.getAttribute("href") || "";
    if (href.charAt(0) === "#" || href.indexOf("mailto:") === 0) return;

    var url;
    try {
      url = new URL(link.href, location.href);
    } catch (err) {
      return;
    }
    if (url.hostname === location.hostname) return;

    track("outbound_click", withPage({
      link_domain: url.hostname,
      link_url: url.href
    }));
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watchAdSlots);
  } else {
    watchAdSlots();
  }
})();
