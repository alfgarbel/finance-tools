/* ============================================================
   Finance Tools — amortization schedule
   ------------------------------------------------------------
   Renders the payment-by-payment breakdown of a fixed-rate loan
   under any calculator that has one: how each payment splits
   between interest and principal, and how the balance falls.

   Activates on any page containing #amortization and a form
   describing a loan — either homePrice/downPayment (mortgages)
   or loanAmount (loans) — so no page needs its own code.
   ============================================================ */

(function () {
  "use strict";

  var mount = document.getElementById("amortization");
  var form = document.getElementById("calcForm");
  if (!mount || !form) return;

  var table = document.getElementById("amortTable");
  var summary = document.getElementById("amortSummary");
  var view = "yearly";
  var schedule = null;

  /** Read a numeric field, or null when the page has no such field. */
  function field(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    var n = parseFloat(el.value);
    return isFinite(n) ? n : null;
  }

  /**
   * Current loan terms, or null when the form cannot describe a loan.
   * @returns {{principal:number, annualRate:number, months:number}|null}
   */
  function terms() {
    var principal = field("loanAmount");
    if (principal === null) {
      var price = field("homePrice");
      var down = field("downPayment");
      if (price === null) return null;
      principal = price - (down || 0);
    }
    var years = field("loanTerm");
    if (years === null) years = field("years");
    var rate = field("rate");
    if (principal === null || years === null || rate === null) return null;
    if (principal <= 0 || years <= 0 || rate < 0) return null;

    var months = Math.round(years * 12);
    if (months < 1 || months > 1200) return null;   // guard absurd inputs
    return { principal: principal, annualRate: rate, months: months };
  }

  /**
   * Build the full payment schedule.
   *
   * Interest each month is charged on the balance still outstanding, so the
   * split shifts from mostly interest to mostly principal over the term. The
   * final payment absorbs the rounding drift so the balance lands exactly on
   * zero rather than a few cents either side.
   *
   * @param {{principal:number, annualRate:number, months:number}} t
   * @returns {{payment:number, rows:Array, totalInterest:number, totalPaid:number}}
   */
  function build(t) {
    var r = t.annualRate / 100 / 12;
    var n = t.months;
    var payment = r === 0 ? t.principal / n
                          : t.principal * r / (1 - Math.pow(1 + r, -n));
    if (!isFinite(payment)) return null;

    var balance = t.principal;
    var rows = [];
    var totalInterest = 0;

    for (var i = 1; i <= n; i++) {
      var interest = balance * r;
      var principalPart = payment - interest;
      var due = payment;

      if (i === n || principalPart >= balance) {
        /* Last instalment: pay off exactly what is left. */
        principalPart = balance;
        due = balance + interest;
      }

      balance -= principalPart;
      if (balance < 0) balance = 0;
      totalInterest += interest;

      rows.push({
        n: i,
        payment: due,
        principal: principalPart,
        interest: interest,
        balance: balance
      });

      if (balance === 0) break;
    }

    return {
      payment: payment,
      rows: rows,
      totalInterest: totalInterest,
      totalPaid: t.principal + totalInterest
    };
  }

  /** Collapse the monthly rows into one row per calendar year. */
  function byYear(rows) {
    var years = [];
    for (var i = 0; i < rows.length; i++) {
      var y = Math.floor(i / 12);
      if (!years[y]) years[y] = { n: y + 1, payment: 0, principal: 0, interest: 0, balance: 0 };
      years[y].payment += rows[i].payment;
      years[y].principal += rows[i].principal;
      years[y].interest += rows[i].interest;
      years[y].balance = rows[i].balance;
    }
    return years;
  }

  var HEADERS = {
    yearly: ["Year", "Principal Paid", "Interest Paid", "Total Paid", "Remaining Balance"],
    monthly: ["Payment", "Amount", "Principal", "Interest", "Remaining Balance"]
  };

  function render() {
    if (!schedule) return;
    var rows = view === "yearly" ? byYear(schedule.rows) : schedule.rows;
    var headers = HEADERS[view];

    var thead = table.tHead || table.createTHead();
    thead.innerHTML = "";
    var hr = thead.insertRow();
    headers.forEach(function (h) {
      var th = document.createElement("th");
      th.textContent = h;
      th.scope = "col";
      hr.appendChild(th);
    });

    /* Built off-document: a 360-row table appended row by row forces a
       reflow per row. */
    var frag = document.createDocumentFragment();
    rows.forEach(function (row) {
      var tr = document.createElement("tr");
      var cells = [
        view === "yearly" ? String(row.n) : String(row.n),
        formatCurrency(view === "yearly" ? row.principal : row.payment),
        formatCurrency(view === "yearly" ? row.interest : row.principal),
        formatCurrency(view === "yearly" ? row.payment : row.interest),
        formatCurrency(row.balance)
      ];
      cells.forEach(function (text) {
        var td = document.createElement("td");
        td.textContent = text;
        tr.appendChild(td);
      });
      frag.appendChild(tr);
    });

    var tbody = table.tBodies[0] || table.createTBody();
    tbody.innerHTML = "";
    tbody.appendChild(frag);

    summary.textContent =
      "Monthly payment " + formatCurrency(schedule.payment) +
      " · Total interest " + formatCurrency(schedule.totalInterest) +
      " · Total paid " + formatCurrency(schedule.totalPaid) +
      " over " + schedule.rows.length + " payments.";
  }

  /** Schedule as CSV, for a spreadsheet. */
  function toCsv() {
    var rows = view === "yearly" ? byYear(schedule.rows) : schedule.rows;
    var out = [HEADERS[view].join(",")];
    rows.forEach(function (row) {
      out.push([
        row.n,
        (view === "yearly" ? row.principal : row.payment).toFixed(2),
        (view === "yearly" ? row.interest : row.principal).toFixed(2),
        (view === "yearly" ? row.payment : row.interest).toFixed(2),
        row.balance.toFixed(2)
      ].join(","));
    });
    return out.join("\n");
  }

  function downloadCsv() {
    if (!schedule) return;
    var blob = new Blob([toCsv()], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "amortization-schedule-" + view + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  /* ---- Controls ---- */
  mount.addEventListener("click", function (e) {
    var tab = e.target.closest ? e.target.closest(".amort-tab") : null;
    if (tab) {
      view = tab.getAttribute("data-view");
      var tabs = mount.querySelectorAll(".amort-tab");
      for (var i = 0; i < tabs.length; i++) {
        var on = tabs[i] === tab;
        tabs[i].classList.toggle("is-active", on);
        tabs[i].setAttribute("aria-pressed", on ? "true" : "false");
      }
      render();
      if (typeof window.gtag === "function") {
        window.gtag("event", "amortization_view", { schedule_view: view });
      }
      return;
    }
    if (e.target.closest && e.target.closest(".amort-csv")) downloadCsv();
  });

  /* ---- Rebuild after each successful calculation ----
     Bubble phase, so the page's own handler has already validated. */
  document.addEventListener("submit", function (e) {
    if (e.target !== form) return;
    if (!document.querySelector(".results.visible")) return;

    var t = terms();
    schedule = t ? build(t) : null;
    if (!schedule || !schedule.rows.length) {
      mount.hidden = true;
      return;
    }
    mount.hidden = false;
    render();
  });
})();
