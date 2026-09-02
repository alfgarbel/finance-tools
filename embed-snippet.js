/* ============================================================
   Finance Tools — "Embed this calculator" panel
   ------------------------------------------------------------
   Turns a placeholder on a tool page into a live preview plus a
   copy-paste snippet, so another site can take the calculator
   without contacting anyone.
   ============================================================ */

(function () {
  "use strict";

  var host = document.getElementById("embedSnippet");
  if (!host) return;

  var slug = host.getAttribute("data-embed");
  var name = host.getAttribute("data-name") || "Calculator";
  if (!slug) return;

  var ORIGIN = "https://financialtoolkit.net";
  /* The snippet must quote the absolute production URL, since that is what a
     host site pastes. The on-page preview uses a relative path so it renders
     on any origin — local, preview deploy, or production. */
  var src = ORIGIN + "/embed/" + slug;
  var previewSrc = "../embed/" + slug;

  /** The snippet a host site pastes. */
  function snippet(height) {
    return '<iframe src="' + src + '"\n' +
           '        width="100%" height="' + height + '" style="border:0"\n' +
           '        loading="lazy" title="' + name + '"></iframe>\n' +
           '<script src="' + ORIGIN + '/embed-host.js" async><\/script>';
  }

  host.innerHTML =
    '<h2>Embed this calculator</h2>' +
    '<p>Free to use on your own site. Paste the snippet below — the second line is optional and lets the frame resize itself to fit.</p>' +
    '<div class="embed-controls">' +
      '<label for="embedHeight">Height</label>' +
      '<input type="number" id="embedHeight" value="460" min="200" max="1200" step="10">' +
      '<span class="embed-unit">px</span>' +
      '<button type="button" class="embed-copy" id="embedCopy">Copy snippet</button>' +
    '</div>' +
    '<pre class="embed-code"><code id="embedCode"></code></pre>' +
    '<p class="embed-preview-label">Preview</p>' +
    '<iframe class="embed-preview" id="embedPreview" src="' + previewSrc + '" ' +
      'width="100%" height="460" style="border:0" loading="lazy" title="' + name + ' preview"></iframe>';

  var heightInput = document.getElementById("embedHeight");
  var codeEl = document.getElementById("embedCode");
  var preview = document.getElementById("embedPreview");
  var copyBtn = document.getElementById("embedCopy");

  function currentHeight() {
    var n = parseInt(heightInput.value, 10);
    return isFinite(n) && n >= 200 && n <= 1200 ? n : 460;
  }

  function render() {
    var h = currentHeight();
    codeEl.textContent = snippet(h);
    preview.style.height = h + "px";
  }

  heightInput.addEventListener("input", render);
  render();

  copyBtn.addEventListener("click", function () {
    var text = codeEl.textContent;
    function done(ok) {
      copyBtn.textContent = ok ? "Copied" : "Press Ctrl+C to copy";
      setTimeout(function () { copyBtn.textContent = "Copy snippet"; }, 2000);
      if (ok && typeof window.gtag === "function") {
        window.gtag("event", "embed_snippet_copy", { tool_id: slug });
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      return;
    }
    var tmp = document.createElement("textarea");
    tmp.value = text;
    document.body.appendChild(tmp);
    tmp.select();
    try { document.execCommand("copy"); done(true); } catch (e) { done(false); }
    document.body.removeChild(tmp);
  });
})();
