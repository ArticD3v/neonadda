/* ===========================================================
   NEON ADDA — behaviour
   Single source of truth for products, pricing and UI wiring.
   =========================================================== */

/* -----------------------------------------------------------
   BUSINESS DETAILS  —  ⚠️ REPLACE THESE BEFORE SHOWING CLIENT
   Every value below is a placeholder. See PLACEHOLDERS.md
   ----------------------------------------------------------- */
const BIZ = {
  whatsapp:  "919000000000",                 // country code + number, digits only
  phoneHuman:"+91 90000 00000",
  email:     "hello@neonadda.in",
  instagram: "https://instagram.com/neonadda",
  city:      "Kolkata",
  address:   "Studio address line 1, Kolkata, West Bengal 700000",
  hours:     "Mon–Sat, 10am – 7pm IST"
};

const waLink = (msg) =>
  `https://wa.me/${BIZ.whatsapp}?text=${encodeURIComponent(msg)}`;

/* ---------- colour options (real tube colours) ---------- */
const COLOURS = [
  { id:"warm",   name:"Warm White", hex:"#FFC97A", css:"var(--amber)" },
  { id:"white",  name:"Cool White", hex:"#EAF6FF", css:"#EAF6FF" },
  { id:"pink",   name:"Hot Pink",   hex:"#FF3D9A", css:"var(--pink)" },
  { id:"cyan",   name:"Ice Blue",   hex:"#21D4FD", css:"var(--cyan)" },
  { id:"mint",   name:"Green",      hex:"#4ADE80", css:"var(--mint)" },
  { id:"purple", name:"Purple",     hex:"#A78BFA", css:"#A78BFA" },
  { id:"red",    name:"Red",        hex:"#FF5A5A", css:"#FF5A5A" },
  { id:"gold",   name:"Lemon",      hex:"#FFE45C", css:"#FFE45C" }
];

/* ---------- sizes — dimensions stated, which the old site never did ----------
 * gw/gh draw a to-scale outline of the board, so "Large" is something you
 * see rather than a word you have to trust. All three are 2:1. */
const SIZES = [
  { id:"s", name:"Small",  dim:"40 × 20 cm", note:"Desk, shelf, bedside",       add:0,    gw:18, gh:9  },
  { id:"m", name:"Medium", dim:"60 × 30 cm", note:"Above a bed or sofa",        add:1100, gw:27, gh:13 },
  { id:"l", name:"Large",  dim:"90 × 45 cm", note:"Feature wall, events, cafés",add:3100, gw:40, gh:20 }
];

/* ---------- catalogue ---------- *
 * ⚠️ Names and prices are placeholders drawn from the live site
 * where visible (₹2,250 – ₹5,350). Replace with the real catalogue.  */
const PRODUCTS = [
  { id:"happy-birthday", name:"Happy Birthday",  text:"Happy Birthday", colour:"mint",   base:2250, tag:"best", occasion:"birthday", font:"script" },
  { id:"you-and-me",     name:"You & Me",        text:"You & Me",       colour:"warm",   base:2250, tag:"best", occasion:"love",     font:"script" },
  { id:"i-love-you",     name:"I Love You",      text:"I Love You",     colour:"warm",   base:2250, tag:"best", occasion:"love",     font:"script" },
  { id:"mom-to-be",      name:"Mom to Be",       text:"Mom to be",      colour:"warm",   base:2250, tag:"best", occasion:"baby",     font:"script" },
  { id:"merry-christmas",name:"Merry Christmas", text:"Merry Christmas",colour:"white",  base:2450, tag:null,   occasion:"festive",  font:"script" },
  { id:"open",           name:"Open",            text:"OPEN",           colour:"pink",   base:1950, tag:"new",  occasion:"business", font:"tube"   },
  { id:"good-vibes",     name:"Good Vibes Only", text:"Good Vibes",     colour:"cyan",   base:2350, tag:"new",  occasion:"home",     font:"script" },
  { id:"shubh-vivah",    name:"Shubh Vivah",     text:"Shubh Vivah",    colour:"gold",   base:2650, tag:"best", occasion:"wedding",  font:"script" },
  { id:"mr-and-mrs",     name:"Mr & Mrs",        text:"Mr & Mrs",       colour:"warm",   base:2450, tag:null,   occasion:"wedding",  font:"script" },
  { id:"its-a-boy",      name:"It's a Boy",      text:"It's a Boy",     colour:"cyan",   base:2250, tag:null,   occasion:"baby",     font:"script" },
  { id:"happy-diwali",   name:"Happy Diwali",    text:"Happy Diwali",   colour:"gold",   base:2450, tag:"new",  occasion:"festive",  font:"script" },
  { id:"cheers",         name:"Cheers",          text:"Cheers",         colour:"purple", base:2150, tag:null,   occasion:"business", font:"script" },
  { id:"home-sweet",     name:"Home Sweet Home", text:"Home Sweet Home",colour:"warm",   base:2550, tag:null,   occasion:"home",     font:"script" },
  { id:"namaste",        name:"Namaste",         text:"Namaste",        colour:"pink",   base:2250, tag:null,   occasion:"home",     font:"script" },
  { id:"this-is-us",     name:"This Is Us",      text:"This Is Us",     colour:"mint",   base:2350, tag:"new",  occasion:"home",     font:"script" },
  { id:"birthday-girl",  name:"Birthday Girl",   text:"Birthday Girl",  colour:"pink",   base:2250, tag:null,   occasion:"birthday", font:"script" }
];

/* ico is a real phrase people order for that occasion, rendered as a tiny
   lit sign — so the tile previews the product rather than showing a generic icon */
const OCCASIONS = [
  { id:"birthday", label:"Birthday", ico:"Happy"   },
  { id:"wedding",  label:"Wedding",  ico:"Vivah"   },
  { id:"baby",     label:"Baby",     ico:"Oh Baby" },
  { id:"love",     label:"Love",     ico:"Love"    },
  { id:"home",     label:"Home",     ico:"Home"    },
  { id:"business", label:"Business", ico:"Open"    },
  { id:"festive",  label:"Festive",  ico:"Diwali"  }
];

const inr = (n) => "₹" + n.toLocaleString("en-IN");
const colourOf = (id) => COLOURS.find(c => c.id === id) || COLOURS[0];
const fontStack = (f) => f === "tube" ? "var(--tube)" : "var(--script)";
const occLabel = (id) => (OCCASIONS.find(o => o.id === id) || {}).label || "";

/* ===========================================================
   Header: dropdown, drawer, cart badge
   =========================================================== */
function initHeader(){
  // desktop dropdown — hover + keyboard, closes on Escape / outside click
  document.querySelectorAll(".nav__item--has-menu").forEach(item => {
    const btn = item.querySelector(".nav__link");
    const open = (v) => { item.dataset.open = v; btn.setAttribute("aria-expanded", v); };

    item.addEventListener("mouseenter", () => open("true"));
    item.addEventListener("mouseleave", () => open("false"));
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      open(item.dataset.open === "true" ? "false" : "true");
    });
    item.addEventListener("focusout", (e) => {
      if(!item.contains(e.relatedTarget)) open("false");
    });
    document.addEventListener("keydown", (e) => { if(e.key === "Escape") open("false"); });
  });

  // mobile drawer
  const drawer = document.getElementById("drawer");
  const openBtn = document.getElementById("menuOpen");
  const closeBtn = document.getElementById("menuClose");
  if(drawer && openBtn){
    const set = (v) => {
      drawer.dataset.open = v;
      openBtn.setAttribute("aria-expanded", v);
      document.body.style.overflow = v === "true" ? "hidden" : "";
      if(v === "true") closeBtn?.focus();
    };
    openBtn.addEventListener("click", () => set("true"));
    closeBtn?.addEventListener("click", () => { set("false"); openBtn.focus(); });
    document.addEventListener("keydown", (e) => {
      if(e.key === "Escape" && drawer.dataset.open === "true"){ set("false"); openBtn.focus(); }
    });
    // accordion inside drawer
    drawer.querySelectorAll("[data-acc]").forEach(btn => {
      btn.addEventListener("click", () => {
        const sub = document.getElementById(btn.dataset.acc);
        const now = sub.dataset.open === "true" ? "false" : "true";
        sub.dataset.open = now;
        btn.setAttribute("aria-expanded", now);
      });
    });
  }

  // cart badge — demo only, persists per page load
  const n = Number(sessionStorage.getItem("na_cart") || 0);
  document.querySelectorAll(".cart-count").forEach(el => {
    el.textContent = n;
    el.style.display = n ? "block" : "none";
  });

  // mark current page in nav
  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-page]").forEach(a => {
    if(a.dataset.page === here) a.setAttribute("aria-current","page");
  });

  // wire every WhatsApp link
  document.querySelectorAll("[data-wa]").forEach(a => {
    a.href = waLink(a.dataset.wa || "Hi Neon Adda, I'd like to order a custom neon sign.");
  });
  document.querySelectorAll("[data-mail]").forEach(a => { a.href = "mailto:" + BIZ.email; });
  document.querySelectorAll("[data-tel]").forEach(a => { a.href = "tel:+" + BIZ.whatsapp; });
  document.querySelectorAll("[data-ig]").forEach(a => { a.href = BIZ.instagram; });
  document.querySelectorAll("[data-biz-phone]").forEach(el => { el.textContent = BIZ.phoneHuman; });
  document.querySelectorAll("[data-biz-email]").forEach(el => { el.textContent = BIZ.email; });
  document.querySelectorAll("[data-biz-city]").forEach(el => { el.textContent = BIZ.city; });
  document.querySelectorAll("[data-biz-address]").forEach(el => { el.textContent = BIZ.address; });
  document.querySelectorAll("[data-biz-hours]").forEach(el => { el.textContent = BIZ.hours; });
}

function addToCart(){
  const n = Number(sessionStorage.getItem("na_cart") || 0) + 1;
  sessionStorage.setItem("na_cart", n);
  document.querySelectorAll(".cart-count").forEach(el => {
    el.textContent = n; el.style.display = "block";
  });
}

/* ===========================================================
   Product cards
   =========================================================== */
function cardHTML(p){
  const c = colourOf(p.colour);
  const tag = p.tag === "new"  ? '<span class="card__tag card__tag--new">New</span>'
            : p.tag === "best" ? '<span class="card__tag card__tag--best">Bestseller</span>' : "";
  // the sign's own colour leads, then three alternates — so no two cards
  // carry the same row of dots, and the first dot matches the preview above it
  const alts = COLOURS.filter(x => x.id !== c.id).slice(0, 3);
  const dots = [c].concat(alts)
    .map(x => `<i class="dot" style="background:${x.hex};box-shadow:0 0 5px ${x.hex}99"></i>`).join("");
  return `
  <a class="card" href="customizer.html?p=${p.id}">
    <span class="card__art">
      ${tag}
      <span class="card__sign neon neon--sm" style="--c:${c.hex};font-family:${fontStack(p.font)}">${p.text}</span>
    </span>
    <span class="card__body">
      <span class="card__row">
        <span class="card__name">${p.name}</span>
        <span class="card__price">${inr(p.base)}</span>
      </span>
      <span class="card__meta">
        <span class="dots" aria-hidden="true">${dots}</span>
        <span class="card__occ">${occLabel(p.occasion)}</span>
      </span>
    </span>
  </a>`;
}

function renderGrid(sel, list){
  const el = document.querySelector(sel);
  if(el) el.innerHTML = list.map(cardHTML).join("");
}

/* ===========================================================
   Hero — the sign retypes itself through real product phrases
   =========================================================== */
function initHero(){
  const sign = document.getElementById("heroSign");
  if(!sign) return;

  const words = [
    { t:"Happy Birthday", c:"#FFC97A" },
    { t:"Shubh Vivah",    c:"#FFE45C" },
    { t:"Mom to be",      c:"#FF3D9A" },
    { t:"Good Vibes",     c:"#21D4FD" },
    { t:"your words",     c:"#4ADE80" }
  ];
  const caret = document.getElementById("heroCaret");
  const spill = document.getElementById("heroSpill");

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduce){
    sign.textContent = words[0].t;
    sign.style.setProperty("--c", words[0].c);
    return;
  }

  let i = 0;
  const type = () => {
    const w = words[i];
    sign.style.setProperty("--c", w.c);
    if(spill) spill.style.setProperty("--spill", w.c + "3d");
    let j = 0;
    const write = () => {
      sign.textContent = w.t.slice(0, j);
      if(j++ <= w.t.length) setTimeout(write, 78);
      else setTimeout(erase, 2100);
    };
    const erase = () => {
      sign.textContent = w.t.slice(0, j);
      if(j-- > 0) setTimeout(erase, 34);
      else { i = (i + 1) % words.length; setTimeout(type, 320); }
    };
    write();
  };
  type();
}

/* ===========================================================
   Customizer — live preview, real selection, live price
   =========================================================== */
function initCustomizer(){
  const stage = document.getElementById("czSign");
  if(!stage) return;

  const state = {
    text:  "Your Words",
    colour:"warm",
    size:  "m",
    font:  "script",
    on:    true
  };

  // preselect from a product card link
  const pid = new URLSearchParams(location.search).get("p");
  const preset = PRODUCTS.find(p => p.id === pid);
  if(preset){
    state.text = preset.text;
    state.colour = preset.colour;
    state.font = preset.font;
    document.getElementById("czText").value = preset.text;
    const h = document.getElementById("czHeading");
    if(h) h.textContent = "Customise: " + preset.name;
  }

  const base = preset ? preset.base : 2250;

  const price = () => {
    const size = SIZES.find(s => s.id === state.size);
    const chars = Math.max(0, state.text.replace(/\s/g,"").length - 10);
    return base + size.add + chars * 145;   // per-character beyond 10
  };

  const paint = () => {
    const c = colourOf(state.colour);
    stage.textContent = state.text || "Your Words";
    stage.style.fontFamily = fontStack(state.font);
    stage.style.setProperty("--c", c.hex);
    stage.classList.toggle("is-off", !state.on);

    const sp = document.getElementById("czSpill");
    if(sp) sp.style.setProperty("--spill", state.on ? c.hex + "3d" : "transparent");

    document.getElementById("czTotal").textContent = inr(price());
    document.getElementById("czColourName").textContent = c.name;
    const size = SIZES.find(s => s.id === state.size);
    document.getElementById("czSizeName").textContent = size.name + " · " + size.dim;
    document.getElementById("czCount").textContent = state.text.length + "/24";

    // keep the WhatsApp order message in sync with the design
    const msg = `Hi Neon Adda! I designed a sign on your site:\n\n`
      + `Text: "${state.text}"\nColour: ${c.name}\nSize: ${size.name} (${size.dim})\n`
      + `Estimated price: ${inr(price())}\n\nCan you confirm and share the proof?`;
    document.querySelectorAll("[data-wa-order]").forEach(a => { a.href = waLink(msg); });
  };

  // text
  const input = document.getElementById("czText");
  input.addEventListener("input", () => {
    state.text = input.value.slice(0,24);
    paint();
  });

  // colours
  const sw = document.getElementById("czColours");
  sw.innerHTML = COLOURS.map(c => `
    <button class="swatch" type="button" role="button" aria-pressed="${c.id===state.colour}"
            data-colour="${c.id}" title="${c.name}" aria-label="${c.name}">
      <i style="background:${c.hex};box-shadow:0 0 12px ${c.hex}"></i>
    </button>`).join("");
  sw.addEventListener("click", (e) => {
    const b = e.target.closest("[data-colour]");
    if(!b) return;
    state.colour = b.dataset.colour;
    sw.querySelectorAll(".swatch").forEach(x =>
      x.setAttribute("aria-pressed", x.dataset.colour === state.colour));
    paint();
  });

  // sizes — every option genuinely selects, unlike the current site
  const sz = document.getElementById("czSizes");
  sz.innerHTML = SIZES.map(s => `
    <button class="size" type="button" aria-pressed="${s.id===state.size}" data-size="${s.id}">
      <span class="size__gauge" aria-hidden="true">
        <span class="size__bar" style="width:${s.gw}px;height:${s.gh}px"></span>
      </span>
      <span class="size__txt"><b>${s.name} — ${s.dim}</b><span>${s.note}</span></span>
      <span class="size__price">${s.add ? "+" + inr(s.add) : "Base"}</span>
    </button>`).join("");
  sz.addEventListener("click", (e) => {
    const b = e.target.closest("[data-size]");
    if(!b) return;
    state.size = b.dataset.size;
    sz.querySelectorAll(".size").forEach(x =>
      x.setAttribute("aria-pressed", x.dataset.size === state.size));
    paint();
  });

  // font
  const ft = document.getElementById("czFonts");
  if(ft){
    ft.addEventListener("click", (e) => {
      const b = e.target.closest("[data-font]");
      if(!b) return;
      state.font = b.dataset.font;
      ft.querySelectorAll(".opt").forEach(x =>
        x.setAttribute("aria-pressed", x.dataset.font === state.font));
      paint();
    });
  }

  // power toggle — shows what the sign looks like unlit
  const pw = document.getElementById("czPower");
  if(pw){
    pw.addEventListener("click", () => {
      state.on = !state.on;
      pw.setAttribute("aria-pressed", state.on);
      pw.querySelector("span:last-child").textContent = state.on ? "Lit" : "Unlit";
      paint();
    });
  }

  document.getElementById("czAdd")?.addEventListener("click", addToCart);

  paint();
}

/* ===========================================================
   Shop filters
   =========================================================== */
function initShop(){
  const grid = document.getElementById("shopGrid");
  if(!grid) return;

  const bar = document.getElementById("shopFilters");
  const count = document.getElementById("shopCount");
  let active = new URLSearchParams(location.search).get("occasion") || "all";

  const chips = [{id:"all",label:"All signs"}]
    .concat(OCCASIONS.map(o => ({id:o.id,label:o.label})));

  bar.innerHTML = chips.map(c => `
    <button class="opt" type="button" data-filter="${c.id}"
            aria-pressed="${c.id===active}">${c.label}</button>`).join("");

  const draw = () => {
    const list = active === "all" ? PRODUCTS : PRODUCTS.filter(p => p.occasion === active);
    grid.innerHTML = list.map(cardHTML).join("");
    count.textContent = `${list.length} sign${list.length===1?"":"s"}`;
    bar.querySelectorAll(".opt").forEach(b =>
      b.setAttribute("aria-pressed", b.dataset.filter === active));
  };

  bar.addEventListener("click", (e) => {
    const b = e.target.closest("[data-filter]");
    if(!b) return;
    active = b.dataset.filter;
    draw();
  });

  draw();
}

/* ===========================================================
   Accordion + scroll reveal + occasions
   =========================================================== */
function initAccordion(){
  document.querySelectorAll(".acc__q").forEach(q => {
    q.addEventListener("click", () => {
      const item = q.closest(".acc__item");
      const now = item.dataset.open === "true" ? "false" : "true";
      item.dataset.open = now;
      q.setAttribute("aria-expanded", now);
    });
  });
}

function initOccasions(){
  const el = document.getElementById("occGrid");
  if(!el) return;
  el.innerHTML = OCCASIONS.map((o,i) => `
    <a href="shop.html?occasion=${o.id}">
      <span class="occ__ico neon" style="--c:${COLOURS[i % COLOURS.length].hex}">${o.ico}</span>
      <b>${o.label}</b>
    </a>`).join("");
}

function initReveal(){
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if(en.isIntersecting){ en.target.classList.add("is-in"); io.unobserve(en.target); }
    });
  }, { threshold:.12, rootMargin:"0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initHero();
  initOccasions();
  initCustomizer();
  initShop();
  initAccordion();
  initReveal();

  if(document.getElementById("bestGrid")){
    renderGrid("#bestGrid", PRODUCTS.filter(p => p.tag === "best").slice(0,4));
  }
  if(document.getElementById("newGrid")){
    renderGrid("#newGrid", PRODUCTS.filter(p => p.tag === "new").slice(0,4));
  }
});
