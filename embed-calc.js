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

  /* One entry per calculator. `compute` is deliberately identical to the
     corresponding tool page's own function, so an embed and the full
     calculator can never disagree. */
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
      ],
      compute: function (v) {
        if (v.principal < 0 || v.monthly < 0) return "Amounts cannot be negative.";
        if (v.rate < 0) return "Return rate cannot be negative.";
        if (v.years < 1) return "Investment period must be at least 1 year.";
        var mr = v.rate / 12 / 100, n = Math.round(v.years * 12), b = v.principal;
        for (var m = 1; m <= n; m++) b = b * (1 + mr) + v.monthly;
        if (!isFinite(b)) return "Result is too large. Try a lower rate or shorter period.";
        var contributed = v.principal + v.monthly * n;
        return {
          totalValue: money(b),
          totalContributions: money(contributed),
          totalInterest: money(b - contributed)
        };
      }
    },

    mortgage: {
      title: "Estimate your own monthly payment",
      fields: [
        { id: "homePrice",   label: "Home Price",    prefix: "$", min: "0", step: "any" },
        { id: "downPayment", label: "Down Payment",  prefix: "$", min: "0", step: "any" },
        { id: "loanTerm",    label: "Loan Term",     suffix: "yrs", min: "1", max: "50", step: "1" },
        { id: "rate",        label: "Interest Rate", suffix: "%", min: "0", max: "100", step: "any" }
      ],
      results: [
        { id: "monthlyPayment", label: "Monthly Payment", tone: "blue"  },
        { id: "totalPayment",   label: "Total Payment",   tone: "green" },
        { id: "totalInterest",  label: "Total Interest",  tone: "amber" }
      ],
      compute: function (v) {
        if (v.homePrice <= 0) return "Home price must be greater than zero.";
        if (v.downPayment < 0) return "Down payment cannot be negative.";
        if (v.downPayment >= v.homePrice) return "Down payment must be less than the home price.";
        if (v.loanTerm < 1) return "Loan term must be at least 1 year.";
        if (v.rate < 0) return "Interest rate cannot be negative.";
        var res = amortize(v.homePrice - v.downPayment, v.rate, v.loanTerm);
        if (!isFinite(res.monthly)) return "Result is too large. Try a lower interest rate or shorter term.";
        return {
          monthlyPayment: money(res.monthly),
          totalPayment: money(res.total),
          totalInterest: money(res.interest)
        };
      }
    },

    loan: {
      title: "Work out your own repayment",
      fields: [
        { id: "loanAmount", label: "Loan Amount",    prefix: "$", min: "0", step: "any" },
        { id: "rate",       label: "Interest Rate",  suffix: "%", min: "0", max: "100", step: "any" },
        { id: "loanTerm",   label: "Loan Term",      suffix: "yrs", min: "1", max: "50", step: "1" }
      ],
      results: [
        { id: "monthlyPayment", label: "Monthly Payment", tone: "blue"  },
        { id: "totalInterest",  label: "Total Interest",  tone: "amber" },
        { id: "totalAmount",    label: "Total Repaid",    tone: "green" }
      ],
      compute: function (v) {
        if (v.loanAmount <= 0) return "Loan amount must be greater than zero.";
        if (v.rate < 0) return "Interest rate cannot be negative.";
        if (v.loanTerm < 1) return "Loan term must be at least 1 year.";
        var res = amortize(v.loanAmount, v.rate, v.loanTerm);
        if (!isFinite(res.monthly)) return "Result is too large. Try a lower interest rate or shorter term.";
        return {
          monthlyPayment: money(res.monthly),
          totalInterest: money(res.interest),
          totalAmount: money(res.total)
        };
      }
    },

    retirement: {
      title: "Project your own retirement savings",
      fields: [
        { id: "currentAge",     label: "Current Age",          suffix: "yrs", min: "1", max: "100", step: "1" },
        { id: "retireAge",      label: "Retirement Age",       suffix: "yrs", min: "1", max: "110", step: "1" },
        { id: "currentSavings", label: "Current Savings",      prefix: "$", min: "0", step: "any" },
        { id: "monthly",        label: "Monthly Contribution", prefix: "$", min: "0", step: "any" },
        { id: "rate",           label: "Annual Return Rate",   suffix: "%", min: "0", max: "100", step: "any" }
      ],
      results: [
        { id: "savingsAtRetirement", label: "Savings at Retirement", tone: "blue"  },
        { id: "totalContributions",  label: "Total Contributions",   tone: "green" },
        { id: "totalGrowth",         label: "Investment Growth",     tone: "amber" }
      ],
      compute: function (v) {
        if (v.retireAge <= v.currentAge) return "Retirement age must be greater than your current age.";
        if (v.currentSavings < 0 || v.monthly < 0) return "Amounts cannot be negative.";
        if (v.rate < 0) return "Return rate cannot be negative.";
        var years = v.retireAge - v.currentAge;
        var mr = v.rate / 12 / 100, n = Math.round(years * 12), b = v.currentSavings;
        for (var m = 1; m <= n; m++) b = b * (1 + mr) + v.monthly;
        if (!isFinite(b)) return "Result is too large. Try a lower return rate.";
        var contributed = v.currentSavings + v.monthly * n;
        return {
          savingsAtRetirement: money(b),
          totalContributions: money(contributed),
          totalGrowth: money(b - contributed)
        };
      }
    },

    "savings-goal": {
      title: "Work out your own savings timeline",
      fields: [
        { id: "goal",    label: "Savings Goal",         prefix: "$", min: "0", step: "any" },
        { id: "current", label: "Current Savings",      prefix: "$", min: "0", step: "any" },
        { id: "monthly", label: "Monthly Contribution", prefix: "$", min: "0", step: "any" },
        { id: "rate",    label: "Interest Rate",        suffix: "%", min: "0", max: "100", step: "any" }
      ],
      results: [
        { id: "timeRequired",       label: "Time to Reach Goal",  tone: "blue"  },
        { id: "totalContributions", label: "Total Contributions", tone: "green" },
        { id: "interestEarned",     label: "Interest Earned",     tone: "amber" }
      ],
      compute: function (v) {
        if (v.goal <= 0) return "Savings goal must be greater than zero.";
        if (v.current < 0) return "Current savings cannot be negative.";
        if (v.monthly < 0) return "Monthly contribution cannot be negative.";
        if (v.rate < 0) return "Interest rate cannot be negative.";
        if (v.current >= v.goal) {
          return {
            timeRequired: "0 months",
            totalContributions: money(v.current),
            interestEarned: money(0)
          };
        }
        if (v.monthly === 0 && v.rate === 0) {
          return "With no contributions and 0% interest, your goal cannot be reached.";
        }
        var mr = v.rate / 12 / 100, b = v.current;
        for (var m = 1; m <= 1200; m++) {
          b = b * (1 + mr) + v.monthly;
          if (b >= v.goal) {
            var contributed = v.current + v.monthly * m;
            return {
              timeRequired: formatTime(m),
              totalContributions: money(contributed),
              interestEarned: money(b - contributed)
            };
          }
        }
        return "Goal cannot be reached within 100 years. Try increasing your monthly contribution or interest rate.";
      }
    }
  };

  /** Fixed-rate amortization, matching calcMortgage/calcLoan on the tool pages. */
  function amortize(principal, annualRate, years) {
    var n = years * 12;
    if (annualRate === 0) return { monthly: principal / n, total: principal, interest: 0 };
    var r = annualRate / 12 / 100;
    var factor = Math.pow(1 + r, n);
    var monthly = principal * (r * factor) / (factor - 1);
    var total = monthly * n;
    return { monthly: monthly, total: total, interest: total - principal };
  }

  /** Whole months as "3 years 2 months", matching the savings goal page. */
  function formatTime(months) {
    var y = Math.floor(months / 12), m = months % 12;
    if (y === 0) return m + (m === 1 ? " month" : " months");
    var out = y + (y === 1 ? " year" : " years");
    if (m > 0) out += " " + m + (m === 1 ? " month" : " months");
    return out;
  }

  /** Currency, via the shared helper so embeds format like the rest of the site. */
  function money(v) { return formatCurrency(v); }

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

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    setError("errorMsg", "");

    /* Read every declared field by id, so each calculator's compute()
       receives exactly the inputs it declared. */
    var values = {};
    spec.fields.forEach(function (f) {
      var raw = document.getElementById(f.id).value;
      values[f.id] = f.step === "1" ? parseInt10(raw, 0) : parseNum(raw);
    });

    var out = spec.compute(values);
    if (typeof out === "string") {      // compute() returns a message on invalid input
      setError("errorMsg", out);
      return;
    }

    spec.results.forEach(function (r) { setText(r.id, out[r.id]); });
    showResults("results");
  });

  /* Run once on load so the reader sees a worked answer without
     having to click. Flagged as `preset` so that auto-runs are not
     counted as people actually using the calculator. */
  window.__ftCalcSource = "preset";
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  window.__ftCalcSource = null;
})();
