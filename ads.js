/* ============================================================
   Finance Tools — Google AdSense integration
   ------------------------------------------------------------
   All ad configuration lives in ADSENSE_CONFIG below. Nothing
   else in the codebase needs to change to turn ads on or off.

   SETUP (see ADSENSE.md for the full walkthrough):
     1. Replace `client` with your publisher ID (ca-pub-...).
     2. Create two ad units in AdSense and paste their slot IDs.
     3. Copy the same publisher ID into /ads.txt.

   Until a real publisher ID is present the script does nothing
   and the pages keep rendering the dashed grey placeholders.
   ============================================================ */

var ADSENSE_CONFIG = {
  /* Your AdSense publisher ID, e.g. "ca-pub-1234567890123456". */
  client: "ca-pub-4819786472653123",

  /* One entry per ad position used in the HTML
     (`<div class="ad-slot" data-ad-position="...">`).
     `slot` is the 10-digit ad unit ID from the AdSense dashboard.
     Leave a slot as "" to skip that position entirely. */
  units: {
    /* Mid-article unit, sits directly under the calculator result. */
    content: { slot: "XXXXXXXXXX", format: "fluid", layout: "in-article" },
    /* End-of-article unit, sits below the FAQ block. */
    bottom:  { slot: "XXXXXXXXXX", format: "auto", fullWidthResponsive: true }
  },

  /* Visible disclosure printed above every unit. Required by the
     AdSense policy on ads that could be mistaken for site content. */
  label: "Advertisement",

  /* Hide a slot when AdSense returns no ad, so unsold inventory
     does not leave a blank gap in the middle of the page. */
  collapseUnfilled: true,

  /* Never request ads from local development environments —
     accidental impressions and clicks there count as invalid
     traffic and can get an account suspended. */
  disableOnLocalhost: true
};

(function () {
  "use strict";

  var LOADER = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
  var root = document.documentElement;

  /** True once a real publisher ID has been filled in. */
  function isConfigured() {
    var c = ADSENSE_CONFIG.client;
    return typeof c === "string" && /^ca-pub-\d{16}$/.test(c);
  }

  /** True on file:// and local dev hosts. */
  function isLocal() {
    var h = location.hostname;
    return location.protocol === "file:" ||
      h === "localhost" || h === "127.0.0.1" || h === "" || h === "::1";
  }

  if (!isConfigured() || (ADSENSE_CONFIG.disableOnLocalhost && isLocal())) {
    /* Leave the placeholder styling in place and stop here. */
    return;
  }

  root.className += (root.className ? " " : "") + "ads-live";

  /* ---- Load the AdSense library ----
     Every page carries the loader statically in <head> so that Google's
     site review and crawler see the tag without executing JavaScript.
     Only inject a copy if that tag is missing — loading the library
     twice makes it drop ad requests. */
  if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
    var loader = document.createElement("script");
    loader.async = true;
    loader.crossOrigin = "anonymous";
    loader.src = LOADER + "?client=" + encodeURIComponent(ADSENSE_CONFIG.client);
    (document.head || document.documentElement).appendChild(loader);
  }

  /**
   * Watch a rendered unit and collapse its container if AdSense
   * reports that it had nothing to fill the space with.
   * @param {HTMLElement} container
   * @param {HTMLElement} ins
   */
  function collapseIfUnfilled(container, ins) {
    if (!ADSENSE_CONFIG.collapseUnfilled || !window.MutationObserver) return;
    var observer = new MutationObserver(function () {
      var status = ins.getAttribute("data-ad-status");
      if (!status) return;
      observer.disconnect();
      if (status === "unfilled") container.hidden = true;
    });
    observer.observe(ins, { attributes: true, attributeFilter: ["data-ad-status"] });
  }

  /**
   * Replace one placeholder with a live AdSense unit.
   * @param {HTMLElement} container  A `.ad-slot` element.
   */
  function renderSlot(container) {
    if (container.getAttribute("data-ad-rendered") === "true") return;

    var position = container.getAttribute("data-ad-position");
    var unit = ADSENSE_CONFIG.units[position];
    if (!unit || !unit.slot || unit.slot.indexOf("X") !== -1) return;

    var ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "block";
    ins.setAttribute("data-ad-client", ADSENSE_CONFIG.client);
    ins.setAttribute("data-ad-slot", unit.slot);
    if (unit.format) ins.setAttribute("data-ad-format", unit.format);
    if (unit.layout) ins.setAttribute("data-ad-layout", unit.layout);
    if (unit.fullWidthResponsive) ins.setAttribute("data-full-width-responsive", "true");

    container.appendChild(ins);
    container.setAttribute("data-ad-rendered", "true");
    collapseIfUnfilled(container, ins);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      /* Blocked by an ad blocker or offline — leave the slot empty. */
      container.hidden = true;
    }
  }

  function renderAll() {
    var slots = document.querySelectorAll(".ad-slot[data-ad-position]");
    for (var i = 0; i < slots.length; i++) renderSlot(slots[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderAll);
  } else {
    renderAll();
  }
})();
