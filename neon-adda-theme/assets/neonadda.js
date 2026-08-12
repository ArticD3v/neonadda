/* ============================================================
   NEON ADDA — behaviour (Shopify port)
   Hero typing, customizer, accordion, scroll reveal.
   No catalogue data: products come from Shopify.
   ============================================================ */

const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

/* -----------------------------------------------------------
   Hero — the sign retypes itself through the phrases the
   merchant configures in the section.
   ----------------------------------------------------------- */
function initHero() {
  const sign = document.getElementById("heroSign");
  if (!sign) return;

  let words = [];
  try { words = JSON.parse(sign.dataset.phrases || "[]"); } catch (e) { words = []; }
  if (!words.length) {
    words = [{ t: "Say it in light", c: "#FFC97A" }];
  }

  const caret = document.getElementById("heroCaret");
  const spill = document.getElementById("heroSpill");

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    sign.textContent = words[0].t;
    sign.style.setProperty("--c", words[0].c);
    return;
  }

  let i = 0;
  const type = () => {
    const w = words[i];
    sign.style.setProperty("--c", w.c);
    if (spill) spill.style.setProperty("--spill", w.c + "3d");
    let j = 0;
    const write = () => {
      sign.textContent = w.t.slice(0, j);
      if (j++ <= w.t.length) setTimeout(write, 78);
      else setTimeout(erase, 2100);
    };
    const erase = () => {
      sign.textContent = w.t.slice(0, j);
      if (j-- > 0) setTimeout(erase, 34);
      else { i = (i + 1) % words.length; setTimeout(type, 320); }
    };
    write();
  };
  type();
}

/* -----------------------------------------------------------
   Cart — mirror Horizon's product-form.js dispatch so the
   drawer and header count react to customizer adds.
   ----------------------------------------------------------- */
async function addCustomSignToCart(variantId, properties) {
  const routes = window.Shopify && window.Shopify.routes ? window.Shopify.routes : {};
  const addUrl = routes.cart_add_url || "/cart/add.js";

  const sectionIds = Array.from(document.querySelectorAll("cart-items-component"))
    .map((el) => el.dataset.sectionId)
    .filter(Boolean);

  // Deferred promise the standard event system resolves with results.
  let resolvePromise, rejectPromise;
  const eventPromise = new Promise((res, rej) => { resolvePromise = res; rejectPromise = rej; });

  const event = new CustomEvent("shopify:cart:lines-update");
  event.action = "add";
  event.context = "product";
  event.lines = [{ merchandiseId: "gid://shopify/ProductVariant/" + variantId, quantity: 1 }];
  event.promise = eventPromise;
  document.dispatchEvent(event);

  const body = {
    id: variantId,
    quantity: 1,
    properties,
    sections: sectionIds.join(","),
  };

  const response = await fetch(addUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/html" },
    body: JSON.stringify(body),
  });
  const data = await response.json();

  if (data.status) {
    rejectPromise(new Error(data.description || data.message || "Add to cart failed"));
    throw new Error(data.description || data.message || "Add to cart failed");
  }

  // Build the cart summary the standard event consumers expect.
  const ajaxCart = await (await fetch(routes.cart_url || "/cart.js")).json();
  resolvePromise({
    cart: {
      id: ajaxCart.token,
      totalQuantity: ajaxCart.item_count,
      cost: {
        totalAmount: {
          amount: String(ajaxCart.total_price / 100),
          currencyCode: ajaxCart.currency,
        },
      },
      lines: [],
    },
    detail: {
      sections: data.sections || {},
      items: ajaxCart.items,
      source: "neon-customizer",
    },
  });

  return data;
}

/* -----------------------------------------------------------
   Customizer — live preview, real selection, live price,
   add to cart with line-item properties, WhatsApp handoff.
   ----------------------------------------------------------- */
function initCustomizer() {
  const cfgEl = document.getElementById("na-customizer-config");
  if (!cfgEl) return;

  let cfg;
  try { cfg = JSON.parse(cfgEl.textContent); } catch (e) { return; }

  const stage = document.getElementById("czSign");
  if (!stage) return;

  const colours = cfg.colours || [];
  const sizes = cfg.sizes || [];
  if (!colours.length || !sizes.length) return;

  const colourOption = cfg.colourOption || "Colour";
  const sizeOption = cfg.sizeOption || "Size";
  const perCharPrice = Number(cfg.perCharPrice) || 145;
  const allowance = Number(cfg.charAllowance) || 10;
  const maxChars = Number(cfg.maxChars) || 24;

  const state = {
    text: cfg.defaultText || "Your Words",
    colour: colours[0].name,
    size: sizes[1] ? sizes[1].name : sizes[0].name,
    font: "script",
    on: true,
  };

  // variantKeyed: "Colour|Size" -> { id, price }
  let variantKeyed = {};
  let productLoaded = false;
  let productError = false;

  const loadProduct = async (handle) => {
    try {
      const res = await fetch("/products/" + handle + ".js");
      if (!res.ok) throw new Error("product fetch failed");
      const product = await res.json();
      const colourIdx = product.options.findIndex((o) => o.name.toLowerCase().includes("colour") || o.name.toLowerCase().includes("color"));
      const sizeIdx = product.options.findIndex((o) => o.name.toLowerCase().includes("size"));
      const keyOf = (variant) => [variant.options[colourIdx], variant.options[sizeIdx]].join("|");
      variantKeyed = {};
      for (const variant of product.variants) {
        const key = keyOf(variant);
        if (!variantKeyed[key]) variantKeyed[key] = { id: variant.id, price: Number(variant.price) };
      }
      productLoaded = true;
    } catch (e) {
      productError = true;
    }
    paint();
  };

  const basePrice = () => {
    const v = variantKeyed[state.colour + "|" + state.size];
    return v ? v.price : null;
  };

  const surcharge = () => {
    const chars = state.text.replace(/\s/g, "").length;
    return Math.max(0, chars - allowance) * perCharPrice;
  };

  const price = () => {
    const base = basePrice();
    if (base === null) return null;
    return base + surcharge();
  };

  const waMessage = (total) => {
    const size = sizes.find((s) => s.name === state.size) || sizes[0];
    const colour = colours.find((c) => c.name === state.colour) || colours[0];
    return (
      "Hi Neon Adda! I designed a sign on your site:\n\n" +
      'Text: "' + state.text + '"\n' +
      "Colour: " + colour.name + "\n" +
      "Size: " + size.name + " (" + size.dim + ")\n" +
      (total !== null ? "Estimated price: " + inr(total) + "\n" : "") +
      "\nCan you confirm and share the proof?"
    );
  };

  const paint = () => {
    const c = colours.find((x) => x.name === state.colour) || colours[0];
    const size = sizes.find((s) => s.name === state.size) || sizes[0];

    stage.textContent = state.text || "Your Words";
    stage.style.fontFamily = state.font === "tube" ? "var(--tube)" : "var(--script)";
    stage.style.setProperty("--c", c.hex);
    stage.classList.toggle("is-off", !state.on);

    const sp = document.getElementById("czSpill");
    if (sp) sp.style.setProperty("--spill", state.on ? c.hex + "3d" : "transparent");

    const total = price();
    const totalEl = document.getElementById("czTotal");
    const addBtn = document.getElementById("czAdd");
    const setup = document.getElementById("czSetup");

    if (productError) {
      if (totalEl) totalEl.textContent = "—";
      if (addBtn) addBtn.disabled = true;
      if (setup) setup.style.display = "block";
    } else if (total === null) {
      if (totalEl) totalEl.textContent = "…";
      if (addBtn) addBtn.disabled = true;
    } else {
      if (totalEl) totalEl.textContent = inr(total);
      if (addBtn) addBtn.disabled = false;
    }

    const colourName = document.getElementById("czColourName");
    const sizeName = document.getElementById("czSizeName");
    const count = document.getElementById("czCount");
    if (colourName) colourName.textContent = c.name;
    if (sizeName) sizeName.textContent = size.name + " · " + size.dim;
    if (count) count.textContent = state.text.length + "/" + maxChars;

    document.querySelectorAll("[data-wa-order]").forEach((a) => {
      a.href =
        "https://wa.me/" + cfg.whatsapp + "?text=" +
        encodeURIComponent(waMessage(total));
    });
  };

  // Preselect from ?p=<product-handle> (used by the product page button).
  const preselect = new URLSearchParams(location.search).get("p");
  if (preselect) {
    fetch("/products/" + preselect + ".js")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((product) => {
        const firstVariant = product.variants[0];
        if (!firstVariant) return;
        const colourIdx = product.options.findIndex((o) => o.name.toLowerCase().includes("colour") || o.name.toLowerCase().includes("color"));
        const sizeIdx = product.options.findIndex((o) => o.name.toLowerCase().includes("size"));
        state.text = (product.title || state.text).slice(0, maxChars);
        if (colourIdx > -1 && colours.some((c) => c.name === firstVariant.options[colourIdx])) {
          state.colour = firstVariant.options[colourIdx];
        }
        if (sizeIdx > -1 && sizes.some((s) => s.name === firstVariant.options[sizeIdx])) {
          state.size = firstVariant.options[sizeIdx];
        }
        const heading = document.getElementById("czHeading");
        if (heading) heading.textContent = "Customise: " + product.title;
        const input = document.getElementById("czText");
        if (input) input.value = state.text;
        paint();
      })
      .catch(() => { /* ignore — fall back to defaults */ });
  }

  // Text
  const input = document.getElementById("czText");
  if (input) {
    input.value = state.text;
    input.maxLength = maxChars;
    input.addEventListener("input", () => {
      state.text = input.value.slice(0, maxChars);
      paint();
    });
  }

  // Colours
  const sw = document.getElementById("czColours");
  if (sw) {
    sw.innerHTML = colours.map((c) =>
      '<button class="swatch" type="button" aria-pressed="' + (c.name === state.colour) + '" data-colour="' + c.name + '" title="' + c.name + '" aria-label="' + c.name + '">' +
      '<i style="background:' + c.hex + ';box-shadow:0 0 12px ' + c.hex + '"></i>' +
      "</button>"
    ).join("");
    sw.addEventListener("click", (e) => {
      const b = e.target.closest("[data-colour]");
      if (!b) return;
      state.colour = b.dataset.colour;
      sw.querySelectorAll(".swatch").forEach((x) =>
        x.setAttribute("aria-pressed", x.dataset.colour === state.colour));
      paint();
    });
  }

  // Sizes
  const sz = document.getElementById("czSizes");
  if (sz) {
    const gaugeW = { Small: 18, Medium: 27, Large: 40 };
    const gaugeH = { Small: 9, Medium: 13, Large: 20 };
    sz.innerHTML = sizes.map((s) =>
      '<button class="size" type="button" aria-pressed="' + (s.name === state.size) + '" data-size="' + s.name + '">' +
      '<span class="size__gauge" aria-hidden="true"><span class="size__bar" style="width:' + (gaugeW[s.name] || 27) + 'px;height:' + (gaugeH[s.name] || 13) + 'px"></span></span>' +
      '<span class="size__txt"><b>' + s.name + " — " + s.dim + "</b><span>" + s.note + "</span></span>" +
      "</button>"
    ).join("");
    sz.addEventListener("click", (e) => {
      const b = e.target.closest("[data-size]");
      if (!b) return;
      state.size = b.dataset.size;
      sz.querySelectorAll(".size").forEach((x) =>
        x.setAttribute("aria-pressed", x.dataset.size === state.size));
      paint();
    });
  }

  // Fonts
  const ft = document.getElementById("czFonts");
  if (ft) {
    ft.addEventListener("click", (e) => {
      const b = e.target.closest("[data-font]");
      if (!b) return;
      state.font = b.dataset.font;
      ft.querySelectorAll(".opt").forEach((x) =>
        x.setAttribute("aria-pressed", x.dataset.font === state.font));
      paint();
    });
  }

  // Power toggle
  const pw = document.getElementById("czPower");
  if (pw) {
    pw.addEventListener("click", () => {
      state.on = !state.on;
      pw.setAttribute("aria-pressed", state.on);
      const label = pw.querySelector("span:last-child");
      if (label) label.textContent = state.on ? "Lit" : "Unlit";
      paint();
    });
  }

  // Add to cart
  const addBtn = document.getElementById("czAdd");
  if (addBtn) {
    addBtn.addEventListener("click", async () => {
      const v = variantKeyed[state.colour + "|" + state.size];
      if (!v) return;
      const chars = state.text.replace(/\s/g, "").length;
      const extra = Math.max(0, chars - allowance);
      const properties = {
        "Custom text": state.text,
        "Font": state.font === "tube" ? "Block" : "Script",
        "Colour": state.colour,
        "Size": state.size,
        "Characters": String(chars),
        "Character surcharge": extra ? "+" + inr(extra * perCharPrice) + " (" + extra + " extra × " + inr(perCharPrice) + ")" : "None",
      };
      addBtn.disabled = true;
      const original = addBtn.textContent;
      addBtn.textContent = "Adding…";
      try {
        await addCustomSignToCart(v.id, properties);
        addBtn.textContent = "Added ✓";
      } catch (e) {
        addBtn.textContent = "Couldn't add — try again";
      }
      setTimeout(() => {
        addBtn.textContent = original;
        addBtn.disabled = false;
      }, 2200);
    });
  }

  paint();
  loadProduct(cfg.productHandle || "custom-neon-sign");
}

/* -----------------------------------------------------------
   Accordion
   ----------------------------------------------------------- */
function initAccordion() {
  document.querySelectorAll(".acc__q").forEach((q) => {
    q.addEventListener("click", () => {
      const item = q.closest(".acc__item");
      const now = item.dataset.open === "true" ? "false" : "true";
      item.dataset.open = now;
      q.setAttribute("aria-expanded", now);
    });
  });
}

/* -----------------------------------------------------------
   Scroll reveal
   ----------------------------------------------------------- */
function initReveal() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initHero();
  initCustomizer();
  initAccordion();
  initReveal();
});
