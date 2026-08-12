# Neon Adda — HTML site → Shopify theme (design spec)

**Date:** 2026-08-13
**Status:** Approved for planning

## 1. Goal

Convert the static HTML/CSS/JS site in `neonadda-website/` into an importable
Shopify theme that reproduces its look, feel and behaviour on top of native
Shopify commerce, so the merchant can run the store entirely from the Shopify
admin (products, collections, menus, content) without touching code.

- Store is brand-new and empty. Currency: INR (₹).
- No blog required (skip blog templates; default blog route can fall back to
  Horizon's existing blog template untouched).
- All placeholder content stays in place and is editable from the admin.

## 2. Approach (approved: Approach A)

Port the design onto the existing Horizon theme export
(`theme_export__neon-adda-2-myshopify-com-horizon__13AUG2026-0103am/`, Horizon
v4.1.4). Keep Horizon's commerce machinery (product, collection, cart, search,
404, cart drawer, checkout integration, facets) and rebuild the visual layer +
content sections to match the HTML site.

Explicitly rejected: (B) hand-built minimal theme from scratch — high risk and
effort for a beginner merchant; (C) restyle stock Horizon via settings only —
cannot reproduce the neon glow, typing hero or customizer.

## 3. Architecture

### 3.1 Deliverables

- A new theme folder (working copy of the Horizon export + modifications) in
  this workspace.
- `neon-adda-theme.zip` — importable via Online Store → Themes → Add theme →
  Upload zip.
- A `README.md` inside the theme with the merchant setup checklist (see §6).

### 3.2 Visual layer

- `assets/neonadda.css` — full port of the site's design system from
  `neonadda-website/assets/style.css`:
  - tokens (ink `#0B0A12`, surfaces, line colours, pink `#FF3D9A`, cyan
    `#21D4FD`, amber `#FFC97A`, mint `#4ADE80`, text/muted colours, gutters,
    radii, fonts);
  - the `.neon` glow effect (layered text-shadows, `--c` driven), `.neon--sm`,
    `.neon--boot` flicker, `.is-off` unlit state;
  - `.board` / `.board--bare` / `.cable` / `.spill` acrylic hardware details;
  - buttons (`.btn`, `.btn--primary`, `.btn--ghost`, `.btn--wa`, `.btn--block`,
    `.btn--sm`), header, ticker, logo mark (outlined NEON + script adda),
    nav + submenu + drawer, trust strip, cards (`card__art` wall + glow +
    floor shadow + tags + dots), customizer (`cz__*`, swatches, sizes, gauges,
    sticky price panel), occasions rack, steps, reviews, FAQ accordion, stats,
    CTA band, prose, contact cards, footer, `wa-float`, `.reveal`;
  - `[data-ph]` dashed-amber placeholder marker, gated behind a theme setting
    (§5.1);
  - body ambient light wash + film grain, `prefers-reduced-motion` handling.
- Google Fonts (Bricolage Grotesque, Instrument Sans, Yellowtail, Monoton)
  loaded via a snippet `@font-face`/link — same families as the HTML site.
- Palette wired into Horizon's theme settings (color palette, buttons, inputs,
  badges) so native components match: bg `#0B0A12`, fg `#F4F1FB`, primary
  action pink, cyan focus, amber prices.

### 3.3 New assets

- `assets/neonadda.css` (above).
- `assets/neonadda.js` — port of `neonadda-website/assets/app.js` behaviour:
  hero typing animation (respecting reduced motion), customizer logic, accordion,
  scroll reveal, WhatsApp/email/tel link wiring from theme settings, occasions
  rack render, mobile drawer. Product catalogue rendering is REMOVED — grids
  come from Shopify collections. Cart badge handled natively by Horizon.
- Loaded from `layout/theme.liquid` (CSS globally; JS globally or per-page —
  implementation detail, keep one file, it is small).

### 3.4 New sections (all with `{% schema %}`, theme-editor editable)

1. `neon-hero` — typing sign on acrylic board + headline/lede/CTAs + spill.
   Settings: headline, lede, CTA labels/links, typing phrases (repeatable,
   with colour per phrase), eyebrow text.
2. `trust-bar` — repeatable items (icon choice, title, subtext); defaults =
   the four items from the HTML site.
3. `occasions` — repeatable tiles: label, script glyph text, glow colour,
   collection link. Defaults = the 7 occasions (Wedding, Birthday, Baby, Love,
   Home, Business, Festive).
4. `how-it-works` — repeatable steps (title, text); default 4 steps.
5. `reviews` — repeatable review blocks (stars, quote, author, context);
   default 3 reviews as on the site.
6. `faq` — repeatable Q&A blocks; default = the 12 FAQ questions/answers from
   `build.py`.
7. `cta-band` — heading, lede, up to 2 buttons (primary/ghost or WA);
   reused for the customizer teaser and closing bands.
8. `neon-customizer` — the full customizer (§4).
9. `stats` — repeatable figure/label blocks (for the Why page); defaults =
   1,200+ signs · 4.9/5 · 2 yrs · 5–8 days.

### 3.5 Theme settings added (`config/settings_schema.json`)

New group **"Neon Adda — business details"**:
- whatsapp (number, digits only), phone_human, email, instagram, city,
  address, hours
- ticker_text
- claim copy: warranty_text, delivery_days, build_days, per_char_price,
  char_allowance, free_shipping_note
- `highlight_placeholders` toggle (bool, default true)

### 3.6 Templates

- `templates/index.json` — section order: ticker (marquee/announcement) →
  `neon-hero` → `trust-bar` → Bestsellers (Horizon `product-list` bound to a
  "Bestsellers" collection) → `occasions` → `cta-band` (customizer teaser) →
  New arrivals (Horizon `product-list` bound to "New arrivals" collection) →
  `how-it-works` → `reviews` → `faq` (3-item teaser) → `cta-band` (closing).
- `templates/page.story.json`, `page.why.json`, `page.faq.json`,
  `page.contact.json`, `page.neon-customizer.json` — custom page templates.
  Default handles documented in README so admin page creation is near-automatic.
- Product, collection, cart, search, 404: Horizon's existing templates,
  restyled via neonadda.css + theme settings.
- Header/footer groups: Horizon's native header/footer, configured via
  Navigation menus (header: Home, About ▾ [Our Story, Why Neon Adda, FAQ],
  Shop, Neon Customizer, Contact; footer: the 4 columns), restyled to match
  the HTML header/footer (logo, icons, drawer, ticker, wa-float button).

## 4. The Customizer

### 4.1 Product model

- One product: **"Custom Neon Sign"** (`custom-neon-sign`), 24 variants
  (3 sizes × 8 colours). Variant price = size base:
  Small ₹2,250 / Medium ₹3,350 / Large ₹5,350 (defaults from the site).
- **Single source of truth for pricing:** the customizer reads variant prices
  from the product's JSON (`/products/custom-neon-sign.js`) and uses the
  matching variant's actual price as the base. Size prices are set in ONE
  place: Admin → Products → Custom Neon Sign → Edit variants. The theme-editor
  section does NOT hold base prices (avoids divergence between the price shown
  in the customizer and the price charged at checkout).
- Section settings hold: product reference, 8 colours (name + hex), 3 sizes
  (name + dimensions + note — display metadata only), char allowance (10),
  per-char price (₹145), max chars (24).

### 4.2 UI & pricing (ported from the HTML site)

- Live preview: glowing sign on acrylic board, colour swatches, font toggle
  (script/tube), size selectors with proportional gauges, power toggle
  (lit/unlit), live price, character counter, sticky price panel on mobile.
- Live price = matching variant price (from product JSON) + (non-space chars
  − allowance) × per-char price.
- Add to cart via Shopify cart API with **line item properties**: custom text,
  font, colour, size, character surcharge. Cart drawer/count native.
- **Character surcharge at checkout (approved decision):** Shopify cannot
  change price at add-to-cart, so the paid price is the size base (covers the
  allowance). The surcharge beyond the allowance is shown live in the UI,
  attached to the order as a property, and confirmed with the customer at
  proof stage (matches the "free design proof before you pay" model).
- WhatsApp handoff: "Send this design on WhatsApp" builds the same message
  format as the HTML site (text, colour, size, estimated price) using the
  WhatsApp number from theme settings.
- Product pages get a **"Customise this sign"** button linking to the
  customizer with text + colour pre-filled (query param), preserving the
  site's "every card leads to customisation" behaviour.

### 4.3 Error handling

- Custom Neon Sign product missing/not selected → clear setup notice instead
  of a broken cart button.
- No matching variant → disable add-to-cart with a message.
- Reduced motion → static hero, no typing.
- Section settings invalid (e.g., empty colour list) → render defaults.

## 5. Content & placeholders

### 5.1 Editable from admin

- Business details, claim copy: theme settings.
- Reviews, FAQ, steps, trust items, occasions, stats, hero phrases: section
  settings (theme editor).
- Story/Why prose: Shopify page content (rich text).
- Products, photos, prices, collections, menus: standard admin.

### 5.2 Placeholder highlight

`highlight_placeholders` setting (default on) applies the dashed amber
underline `[data-ph]` style; flipping it off removes the marks once content is
real. Mirrors the HTML site's mechanism.

## 6. Merchant setup checklist (also shipped as theme README)

1. Upload theme zip → preview → publish.
2. Create "Custom Neon Sign" product + 24 variants, set base prices.
3. Upload real products (photos, names, prices, variants).
4. Create collections: Bestsellers, New arrivals, + 7 occasions; assign
   products.
5. Create Pages (Our Story, Why Neon Adda, FAQ, Contact, Neon Customizer) and
   assign templates.
6. Configure Navigation menus (header + footer).
7. Fill Business details settings.
8. Replace placeholder copy (reviews, FAQ, stats, claims) in the theme editor;
   flip off the placeholder highlight when done.

## 7. Testing & delivery

- Local verification before packaging:
  - All `.json` templates and `settings_schema.json` parse;
  - Liquid syntax valid (structure check; no Shopify CLI available unless
    installed — use it if present);
  - Every class used in the new templates exists in `neonadda.css`;
  - `neonadda.js` parses (node --check) and references only ids present in
    the customizer/hero markup;
  - Theme passes Shopify's structural requirements for upload (valid
    `layout/theme.liquid`, template set, `{% schema %}` on all sections).
- Post-import QA checklist in README: import, create customizer product, add
  a test product, verify homepage sections, shop filters, product page,
  customizer (text/colour/size/price/add-to-cart/WhatsApp), cart, search, 404,
  desktop + mobile.
- Known limitation: final visual QA requires a live Shopify store; the theme
  cannot be rendered locally.

## 8. Out of scope

- Blog templates (Horizon's remain as fallback; not configured).
- Migrating real product data (store is empty).
- Shopify apps (reviews, customizers) — everything is theme-native.
- Local payment/WhatsApp automation beyond the handoff links.
