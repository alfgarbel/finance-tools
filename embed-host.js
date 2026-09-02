/* ============================================================
   Finance Tools — host-side embed resizer
   ------------------------------------------------------------
   Optional. Sites that include this alongside the iframe get a
   frame that grows and shrinks with its content instead of a
   fixed height. Everything still works without it.
   ============================================================ */

(function () {
  "use strict";

  var ORIGIN = "https://financialtoolkit.net";

  window.addEventListener("message", function (event) {
    /* Only act on messages from the calculator, and only ones shaped
       the way this script expects. */
    if (event.origin !== ORIGIN) return;
    var data = event.data;
    if (!data || data.type !== "financialtoolkit:height") return;

    var height = parseInt(data.height, 10);
    if (!isFinite(height) || height < 80 || height > 4000) return;

    var frames = document.querySelectorAll('iframe[src^="' + ORIGIN + '/embed/"]');
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow === event.source) {
        frames[i].style.height = height + "px";
      }
    }
  });
})();
