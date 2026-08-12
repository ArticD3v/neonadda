# Neon Adda — demo site

Static site. No build step, no dependencies, no backend. Seven pages, mobile-first.

---

## ⚠️ Replace before showing the client

Everything fake is **underlined with a dashed amber line** in the browser. That's deliberate — you can spot placeholders at a glance while reviewing, and it takes one line to switch off.

### 1. Business details — `assets/app.js`, top of file

```js
const BIZ = {
  whatsapp:  "919000000000",        // ← country code + number, digits only, no +
  phoneHuman:"+91 90000 00000",
  email:     "hello@neonadda.in",
  instagram: "https://instagram.com/neonadda",
  city:      "Kolkata",
  address:   "Studio address line 1, Kolkata, West Bengal 700000",
  hours:     "Mon–Sat, 10am – 7pm IST"
};
```

Change these seven values and every phone number, email, WhatsApp link, address and city updates across all seven pages. They're injected at runtime.

**The city is a guess.** I inferred Kolkata from "adda" (Bengali). Confirm it — a wrong city in a pitch is embarrassing.

### 2. Products — `assets/app.js`, the `PRODUCTS` array

16 signs with names, prices and occasions. Prices anchor to the real ₹2,250–₹5,350 range from his site. Real names and prices make the demo far more convincing.

### 3. Claims that need confirming

Scattered through the pages, all marked `data-ph`:

- 2-year warranty · 5–8 day delivery · 3–4 day build
- 24-hour lit test · 48-hour damage window · ₹145 per extra character
- Stats on `why.html`: 1,200+ signs, 4.9/5 rating
- **All three reviews on the homepage are invented.** Replace with real ones or delete the section. Fake testimonials are a legal risk and a trust risk.

**On the stats:** his current site claims *10,000+ km of neon across 1,248 projects* — eight kilometres of tube per order. I dropped it. If he wants numbers back, use real ones.

### 4. Turning off placeholder marks

When the real content is in, delete this from the end of `assets/style.css`:

```css
[data-ph]{ border-bottom:1px dashed rgba(255,201,122,.55); }
```

---

## Hosting it

**Netlify Drop** — netlify.com/drop, drag the `neonadda` folder in, get a URL in ~10 seconds. No account needed. Easiest option.

**GitHub Pages** — push the folder, Settings → Pages → deploy from branch.

**Local preview** — `python3 -m http.server 8000` in the folder, then open `localhost:8000`.

Open `index.html` directly from disk and most things work, but the customizer's `?p=` preselect needs a real server. Use one of the above.

---

## Pages

| File | Purpose |
|---|---|
| `index.html` | Homepage — animated hero, bestsellers, occasions, how-it-works, reviews, FAQ teaser |
| `shop.html` | Filterable catalogue, 7 occasion filters |
| `customizer.html` | Live preview, 8 colours, 3 sizes, live pricing, WhatsApp handoff |
| `story.html` | About → Our Story |
| `why.html` | About → Why Neon Adda (materials, warranty, process) |
| `faq.html` | About → FAQ, 12 questions |
| `contact.html` | WhatsApp, phone, email, address, enquiry form |

`build.py` regenerates the six inner pages from `index.html`'s header and footer. Edit the chrome in `index.html`, rerun `python3 build.py`, and every page updates. **If you hand-edit an inner page, rerunning the script overwrites it.**

---

## What changed, and why

Each of these maps to a problem in the current site — useful when he asks "why does this cost money?"

**Size selection actually works.** The current site's Small and Medium can't be selected — the tap registers, the swatch shows a hover outline, nothing commits, Add to Cart never enables. Customers on that product literally cannot buy. Here every option selects with an unmistakable filled state.

**Colours are colours, not words.** He sells "Blue & Pink" and "Green & Yellow" as text labels on a product whose entire appeal is colour, and the photo never changes. Now: eight swatches, live preview.

**Sizes have dimensions.** "Large" meant nothing. Now 40×20, 60×30, 90×45 cm with a use-case for each and a visual size bar.

**The hero says something.** His first screen is a photograph with zero words — no headline, no price, no button. Someone arriving from Instagram learns nothing. The new hero types real product phrases into a neon sign, so the customisation promise lands in two seconds.

**Product images fixed at the source.** Every sign is CSS-rendered — correct text, real glow, nothing cropped. His current hero crops "Happy Birthday" to "happy / urthd", "Merry Christmas" to "Aerry Christma", and the hero product is still wrapped in bubble wrap sitting on artificial grass.

**Two products per screen, not one.** Cards were so widely spaced you saw one product per scroll. Now 2-up on mobile, 4-up on desktop.

**Cards have names.** His bestseller cards show an image and a price range with no product name — customers can't tell what anything is, and neither can Google.

**No permanent fake SALE.** Every product carried a SALE badge against a list price nobody pays. That teaches customers the pricing is fiction. Replaced with a real "Bestseller"/"New" distinction.

**Cart in the header.** There wasn't one. On a store.

**Search in the header.** There wasn't one either.

**WhatsApp everywhere.** For a ₹5,000+ custom product in India this is the primary sales channel. Floating button plus in-page CTAs. The customizer builds a message containing the exact spec — text, colour, size, price — so he receives a complete order, not "hi price?".

**Contrast fixed.** His breadcrumb is near-invisible dark-slate on dark-navy; prices are grey on black. Body text here is `#ABA5C2` on `#0B0A12` — comfortably past WCAG AA.

**One accent system.** His page runs pink, cyan, coral, orange, blue, green, and more, often inches apart, so nothing signals "tap me". Here: pink = actions, cyan = section labels, amber = product glow.

**Not flat black.** Deep indigo `#0B0A12` with lighter product tiles, so glowing signs separate from the page instead of dissolving into it.

**Honest numbers.** The count-up animation showed "6320+ Km" in one screenshot and "10000+ Km" seconds later — visitors see it mid-run and it reads as unstable.

**Real accessibility.** Skip link, keyboard focus rings, ARIA on menus and toggles, `prefers-reduced-motion` respected throughout.

---

## The visual language, if he asks

Worth being able to explain, because "it looks nicer" is not something he can evaluate and not something he'll pay for twice.

The whole page is built on one idea: **a dark room at night, lit by the product**. That single rule decides everything else, and it's why the design doesn't read as a generic dark template.

Nothing on the page glows except the signs. The announcement bar, the buttons and the section headings are all deliberately quiet — an earlier version had a pink-to-cyan gradient strip across the top, and it competed with the products for attention. It's now a plain dark strip with one hairline of brand colour. The only saturated colour in the interface is pink, and it means "this is the action".

Product tiles are walls, not boxes. Each card is a panel with a pool of light behind the sign, a faint texture so it isn't a flat CSS gradient, and a shadow gradient at the floor line — so the sign reads as an object in a room rather than clip-art on a swatch. That markup is structured so a real photograph drops straight into `.card__art` when he reshoots.

Sections don't all look the same. A run of identically-bordered boxes is the single clearest sign that nobody made real decisions. So: occasions are a scroll-snapping rack, how-it-works is a wired vertical run with a cable between numbered steps, reviews are hairline-ruled quotes, and stats are figures sitting on rules. Each one is shaped by what it actually is.

Fine grain over the entire page. Pure CSS gradients are flat in a way real light never is; a faint noise layer is most of the difference between "rendered" and "photographed".

---

## Mobile specifics

The brief was mobile-first, and these are the decisions that only matter on a phone:

**The price follows you.** On the customizer the price panel pins to the bottom of the screen while you scroll the controls, so the number is always visible while you're changing things. The floating WhatsApp button hides on that page so it can't sit on top of Add to Cart.

**Nothing jumps.** The hero retypes phrases of different lengths. If a longer one wrapped to a second line, everything below would shift mid-animation — so that line can't wrap, and it's sized to clear a 320px screen with room to spare.

**Edge-to-edge where it should be.** The trust strip and the occasions rack bleed to the screen edges rather than sitting inside the page margin, which is what makes the rack read as scrollable.

**Gutters scale.** 18px on phones, 24px on tablets, 32px on desktop, from one variable.

**Sizes are drawn to scale.** The three size options each show a small outline of the actual board, proportional to the real dimensions — so "Large" is something you see rather than a word you have to trust.

---

## Known limits

- **No backend.** Cart badge counts in `sessionStorage` and resets on tab close. Contact form hands off to WhatsApp. Fine for a demo, needs real commerce for production.
- **No payment.** Add to Cart increments the badge only.
- **Fonts load from Google Fonts** — needs a connection on first load.
- **The sign previews are CSS, not photos.** Deliberate, so nothing is cropped or wrapped in plastic. The markup is structured so real photos drop into `.card__art` once he reshoots.
- **Not opened in a real browser.** There's no browser in the environment this was built in, so it was verified by code inspection instead: HTML tag balance on all 7 pages, 0 broken links, JS parses, no duplicate CSS selectors that would silently override a component, no class in the markup missing from the CSS, and a data check over the catalogue (unique ids, valid colour and occasion references, no empty filters, size gauges to scale, pricing monotonic in size). **Open it on an actual phone before you show him** — that's the one gap.

---

## Pitch advice

Lead with the broken size selector, not the visuals. He can argue about taste; he can't argue that customers are unable to buy. Open the live site on your phone, tap Medium a few times, let him watch nothing happen. Then open the new customizer and tap the same control.

Before the meeting, run his homepage through **pagespeed.web.dev** on mobile and screenshot the score. A red number next to this build turns a design opinion into a business case.

The highest-value thing he can pay for beyond the site is **reshooting the products** — clean interiors, no bubble wrap, no fake grass, colour variants in their actual colour. His signs are the product; right now the photography makes ₹5,350 look like ₹800.
