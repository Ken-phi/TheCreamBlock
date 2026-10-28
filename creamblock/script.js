/* THE CREAM BLOCK */
/* ---- PRICING: your selling prices (PHP per bar) ---- */
const FLAVORS = [
  { id: "classic-oreo", name: "Classic Oreo", price: 13, qty: 24 },
  { id: "ube-cheese", name: "Ube Cheese", price: 15, qty: 12 },
  { id: "coffee-mallows", name: "Coffee Mallows", price: 15, qty: 12 },
  { id: "magnum", name: "Magnum", price: 20, qty: 0 },
];
/* Bulk discount by TOTAL bars in the order (all flavors combined).
   These percentages are placeholders: change them to what you want to offer. */
const DISCOUNTS = [
  { min: 24, pct: 5 },
  { min: 60, pct: 8 },
  { min: 120, pct: 12 },
];
const pctFor = (bars) => DISCOUNTS.reduce((p, d) => (bars >= d.min ? d.pct : p), 0);
const php = (n) => "PHP " + n.toLocaleString(undefined, { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

document.querySelectorAll("#year").forEach((e) => (e.textContent = new Date().getFullYear()));

/* ---- Discount table (reseller page) ---- */
document.querySelectorAll(".tiers").forEach((t) => {
  t.innerHTML =
    "<thead><tr><th>Total bars in order</th><th>Discount</th></tr></thead><tbody>" +
    [{ min: 1, pct: 0 }, ...DISCOUNTS]
      .map(
        (d, i, a) =>
          '<tr data-pct="' +
          d.pct +
          '"><td>' +
          (a[i + 1] ? d.min + " to " + (a[i + 1].min - 1) : d.min + " or more") +
          "</td><td>" +
          (d.pct ? d.pct + "% off" : "Regular price") +
          "</td></tr>",
      )
      .join("") +
    "</tbody>";
  document.addEventListener("tier", (e) =>
    t.querySelectorAll("tr[data-pct]").forEach((r) => r.classList.toggle("cur", +r.dataset.pct === e.detail)),
  );
});
document
  .querySelectorAll("[data-price-list]")
  .forEach((el) => (el.textContent = FLAVORS.map((f) => f.name + " " + php(f.price)).join(", ")));

/* ---- Order builder (home + reseller) ---- */
document.querySelectorAll("[data-calc]").forEach((box) => {
  const resell = box.dataset.calc === "reseller";
  box.innerHTML =
    "<h3>" +
    (resell ? "Your reseller math" : "Build your order") +
    "</h3>" +
    FLAVORS.map(
      (f) =>
        '<div class="flav"><div><b>' +
        f.name +
        "</b><small>" +
        php(f.price) +
        " each</small></div>" +
        '<div class="qty"><button type="button" data-step="-6" aria-label="6 fewer ' +
        f.name +
        '">&minus;</button>' +
        '<input type="number" min="0" value="' +
        f.qty +
        '" data-id="' +
        f.id +
        '" inputmode="numeric" aria-label="' +
        f.name +
        ' quantity">' +
        '<button type="button" data-step="6" aria-label="6 more ' +
        f.name +
        '">+</button></div></div>',
    ).join("") +
    '<div class="total" aria-live="polite"></div>' +
    '<div class="row"><span>Bars in order</span><b class="bars"></b></div>' +
    '<div class="row"><span>Regular price</span><b class="sub"></b></div>' +
    '<div class="row"><span>Bulk discount <span class="pct"></span></span><b class="disc"></b></div>' +
    (resell ? '<div class="row"><span>Your profit if all sell at regular price</span><b class="disc2"></b></div>' : "") +
    '<div class="hint"></div><a class="btn" href="#">' +
    (resell ? "Apply to resell" : "Request this order") +
    "</a>";
  const $ = (s) => box.querySelector(s),
    inputs = [...box.querySelectorAll("input")];
  const run = () => {
    let bars = 0,
      sub = 0,
      lines = [];
    inputs.forEach((i) => {
      const q = Math.max(0, Math.min(5000, parseInt(i.value) || 0)),
        f = FLAVORS.find((x) => x.id === i.dataset.id);
      bars += q;
      sub += q * f.price;
      if (q) lines.push(f.name + " x" + q);
    });
    const pct = pctFor(bars),
      disc = Math.round(sub * pct) / 100,
      total = sub - disc;
    $(".total").textContent = php(total);
    $(".bars").textContent = bars;
    $(".sub").textContent = php(sub);
    $(".pct").textContent = pct ? "(" + pct + "%)" : "";
    $(".disc").textContent = pct ? "-" + php(disc) : "none yet";
    if (resell) $(".disc2").textContent = php(disc);
    const next = DISCOUNTS.find((d) => d.min > bars);
    $(".hint").textContent = !bars
      ? "Add some bars to start your order."
      : next
        ? "Add " + (next.min - bars) + " more bars (any flavor) for " + next.pct + "% off."
        : "Top discount unlocked.";
    $("a.btn").href =
      "contact.html?type=" +
      (resell ? "reseller" : "large-order") +
      "&order=" +
      encodeURIComponent(lines.join(", ") + " | " + bars + " bars | Total " + php(total));
    document.dispatchEvent(new CustomEvent("tier", { detail: pct }));
  };
  box.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-step]");
    if (!b) return;
    const i = b.parentElement.querySelector("input");
    i.value = Math.max(0, (parseInt(i.value) || 0) + +b.dataset.step);
    run();
  });
  box.addEventListener("input", run);
  run();
});

/* ---- Flavor filter ---- */
const fb = document.querySelectorAll(".filters button");
fb.forEach((b) =>
  b.addEventListener("click", () => {
    fb.forEach((x) => x.classList.toggle("on", x === b));
    document
      .querySelectorAll(".grid .card")
      .forEach((c) => c.classList.toggle("hidden", b.dataset.f !== "all" && c.dataset.cat !== b.dataset.f));
  }),
);

/* ---- Inch test ---- */
const r = document.getElementById("inchRange");
if (r) {
  const c = document.getElementById("testCream"),
    o = document.getElementById("inchOut"),
    v = document.getElementById("verdict");
  const up = () => {
    const n = +r.value;
    c.style.height = n * 140 + "px";
    o.textContent = n.toFixed(2) + " in";
    v.className = "verdict " + (n < 1 ? "bad" : "ok");
    v.textContent = n < 1 ? "Thinner than 1 inch? Give it back." : n >= 1.5 ? "Monster block." : "Keep it. That's a Cream Block.";
  };
  r.addEventListener("input", up);
  up();
}

/* ---- Forms ---- */
const t = new URLSearchParams(location.search).get("type") || new URLSearchParams(location.search).get("flavor");
document.querySelectorAll("form[data-form]").forEach((f) => {
  const sel = f.querySelector("select[name=topic]");
  if (sel && t) sel.value = t;
  const ord = new URLSearchParams(location.search).get("order"),
    ta = f.querySelector("textarea");
  if (ord && ta) ta.value = "I would like to order: " + ord;
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const m = f.querySelector(".msg"),
      d = new FormData(f);
    const bad = [...f.querySelectorAll("[required]")].some((x) => !String(d.get(x.name) || "").trim());
    m.className = "msg show " + (bad ? "err" : "ok");
    m.textContent = bad ? "Fill in every field marked required, then send again." : "Sent, " + d.get("name") + "! We'll reply soon.";
    /* To receive real messages, connect this form to Formspree or your backend. */
    if (!bad) {
      f.reset();
      confetti();
    }
  });
});
function confetti() {
  const col = ["#4b14c4", "#b48cf0", "#c98f56", "#ffd36b"];
  for (let i = 0; i < 40; i++) {
    const p = document.createElement("i");
    p.className = "confetti";
    p.style.background = col[i % 4];
    p.style.setProperty("--dx", (Math.random() - 0.5) * 600 + "px");
    p.style.setProperty("--dy", (Math.random() - 0.8) * 500 + "px");
    p.style.setProperty("--r", Math.random() * 720 + "deg");
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1300);
  }
}
