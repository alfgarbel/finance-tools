/* ============================================================
   Finance Tools — embedded calculator for guide pages
   ------------------------------------------------------------
   Guides answer "what has the market returned?" with static
   tables. The reader's next question is "what would MY money
   do?", which until now meant following a link. This turns a
   placeholder into a working calculator, pre-filled with the
   scenario that page is about:

     <div class="embed-calc" data-calc="compound"
          data-principal="10000" data-monthly="400"
          data-rate="7" data-years="20"></div>

   It emits the same #calcForm / .results markup the tool pages
   use, so share.js, analytics.js and the existing styles pick
   it up with no special-casing. It must therefore run BEFORE
   share.js, which looks for #calcForm when it initialises.
   ============================================================ */

(function () {
  "use strict";

  var host = document.querySelector(".embed-calc");
  if (!host || document.getElementById("calcForm")) return;

  /* Field definitions per calculator type. Only the compound-growth
     shape is needed so far; add a key here to support another. */
  var CALCS = {
    compound: {
      title: "Try it with your own numbers",
      fields: [
        { id: "principal", label: "Initial Investment",   prefix: "$", min: "0", step: "any" },
        { id: "monthly",   label: "Monthly Contribution", prefix: "$", min: "0", step: "any" },
        { id: "rate",      label: "Annual Return Rate",   suffix: "%", min: "0", max: "100", step: "any" },
        { id: "years",     label: "Investment Period",    suffix: "yrs", min: "1", max: "100", step: "1" }
      ],
      results: [
        { id: "totalValue",         label: "Total Final Value",   tone: "blue"  },
        { id: "totalContributions", label: "Total Contributions", tone: "green" },
        { id: "totalInterest",      label: "Interest Earned",     tone: "amber" }
      ]
    }
  };

  var spec = CALCS[host.getAttribute("data-calc") || "compound"];
  if (!spec) return;

  /** Preset for this page, taken from the data- attributes. */
  function preset(id) {
    return host.getAttribute("data-" + id) || "";
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---- Build the form, matching the tool pages' markup ---- */
  var card = el("div", "card embed-calc-card");
  card.appendChild(el("h2", "card-title", host.getAttribute("data-title") || spec.title));

  var form = document.createElement("form");
  form.id = "calcForm";
  var grid = el("div", "form-grid");

  spec.fields.forEach(function (f) {
    var group = el("div", "form-group");
    var label = el("label", null, f.label);
    label.setAttribute("for", f.id);
    group.appendChild(label);

    var wrap = el("div", "input-wrap " + (f.prefix ? "has-prefix" : "has-suffix"));
    if (f.prefix) wrap.appendChild(el("span", "prefix", f.prefix));

    var input = document.createElement("input");
    input.type = "number";
    input.id = f.id;
    input.value = preset(f.id);
    input.required = true;
    if (f.min !== undefined) input.min = f.min;
    if (f.max !== undefined) input.max = f.max;
    if (f.step !== undefined) input.step = f.step;
    wrap.appendChild(input);

    if (f.suffix) wrap.appendChild(el("span", "suffix", f.suffix));
    group.appendChild(wrap);
    grid.appendChild(group);
  });

  form.appendChild(grid);
  form.appendChild(el("button", "btn", "Calculate")).type = "submit";

  var err = el("div", "error-msg");
  err.id = "errorMsg";
  form.appendChild(err);
  card.appendChild(form);

  var results = el("div", "results");
  results.id = "results";
  spec.results.forEach(function (r) {
    var item = el("div", "result-item " + r.tone);
    item.appendChild(el("div", "label", r.label));
    var v = el("div", "value", "—");
    v.id = r.id;
    item.appendChild(v);
    results.appendChild(item);
  });
  card.appendChild(results);

  host.appendChild(card);

  /**
   * Monthly compounding, contribution applied at the end of each month.
   * Deliberately identical to the compound interest tool page, so the
   * embed and the full calculator never disagree.
   */
  function grow(P, M, r, years) {
    var monthlyRate = r / 12 / 100;
    var months = years * 12;
    var balance = P;
    for (var m = 1; m <= months; m++) {
      balance = balance * (1 + monthlyRate) + M;
    }
    var contributed = P + M * months;
    return {
      finalValue: balance,
      totalContrib: contributed,
      totalInterest: balance - contributed
    };
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    setError("errorMsg", "");

    var P = parseNum(document.getElementById("principal").value);
    var M = parseNum(document.getElementById("monthly").value);
    var r = parseNum(document.getElementById("rate").value);
    var t = parseInt10(document.getElementById("years").value, 1);

    if (P < 0 || M < 0) { setError("errorMsg", "Amounts cannot be negative."); return; }
    if (r < 0) { setError("errorMsg", "Return rate cannot be negative."); return; }
    if (t < 1) { setError("errorMsg", "Investment period must be at least 1 year."); return; }

    var res = grow(P, M, r, t);
    if (!isFinite(res.finalValue)) {
      setError("errorMsg", "Result is too large. Try a lower rate or shorter period.");
      return;
    }

    setText("totalValue", formatCurrency(res.finalValue));
    setText("totalContributions", formatCurrency(res.totalContrib));
    setText("totalInterest", formatCurrency(res.totalInterest));
    showResults("results");
  });

  /* Run once on load so the reader sees a worked answer without
     having to click. Flagged as `preset` so that auto-runs are not
     counted as people actually using the calculator. */
  window.__ftCalcSource = "preset";
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  window.__ftCalcSource = null;
})();
