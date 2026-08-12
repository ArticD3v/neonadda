# Neon Adda Shopify Theme — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an importable Shopify theme (`neon-adda-theme/`) that reproduces the Neon Adda HTML site's look and behaviour on top of the Horizon theme's native commerce engine.

**Architecture:** Copy the Horizon v4.1.4 export into `neon-adda-theme/`, then layer a custom design system (`assets/neonadda.css`), behaviour (`assets/neonadda.js`), 11 new editable sections, page/JSON templates, and theme settings on top. Product grids, cart, checkout, search and facets stay native Horizon; the customizer is a custom section wired to a real "Custom Neon Sign" product via Shopify's AJAX cart + standard events.

**Tech Stack:** Shopify Theme (Liquid + JSON templates), CSS, vanilla JS (no build step), Python 3 for local validation/packaging scripts.

## Global Constraints

Copied verbatim from the approved spec (`docs/superpowers/specs/2026-08-13-neon-adda-shopify-conversion-design.md`). Every task inherits these:

- Currency INR; all prices displayed as ₹ with `en-IN` formatting (`₹2,250`).
- Palette: background `#0B0A12`, foreground text `#F4F1FB`, pink `#FF3D9A`, cyan `#21D4FD`, amber `#FFC97A`, mint `#4ADE80`, muted `#ABA5C2`, muted-2 `#837D9C`, surfaces `#161424`/`#1F1B31`/`#292339`.
- Fonts (Google Fonts, loaded via `<link>`): Bricolage Grotesque (display/headings), Instrument Sans (body), Yellowtail (script), Monoton (tube/block).
- Customizer defaults: 8 colours (Warm White `#FFC97A`, Cool White `#EAF6FF`, Hot Pink `#FF3D9A`, Ice Blue `#21D4FD`, Green `#4ADE80`, Purple `#A78BFA`, Red `#FF5A5A`, Lemon `#FFE45C`); 3 sizes (Small 40×20 cm, Medium 60×30 cm, Large 90×45 cm); base prices Small ₹2,250 / Medium ₹3,350 / Large ₹5,350; character allowance 10; per-char price ₹145; max 24 chars. Size/colour do not affect price; spaces don't count toward chars.
- Single source of truth for base price = the product's variant prices (customizer reads `/products/<handle>.js`); theme settings hold only allowance, per-char price, max chars, colours, sizes (display metadata).
- Product "Custom Neon Sign", handle `custom-neon-sign`, 24 variants, option names **"Colour"** (8 values) and **"Size"** (3 values).
- Customizer add-to-cart attaches line-item properties: `Custom text`, `Font`, `Colour`, `Size`, `Characters`, `Character surcharge`. Surcharge is carried as a property (not baked into checkout price).
- WhatsApp number setting (`na_whatsapp`, digits only) drives every WhatsApp link.
- All placeholder content stays and is admin-editable; `highlight_placeholders` setting (default `true`) renders the dashed-amber `[data-ph]` underline.
- No blog work. All files UTF-8. Vanilla JS only — no external deps; must pass `node --check`.
- Workspace has NO git repo — Task 1 runs `git init`. Commit after every task with the message shown.

---

### Task 1: Scaffold the theme + local validation harness

**Files:**
- Create: `neon-adda-theme/` (recursive copy of `theme_export__neon-adda-2-myshopify-com-horizon__13AUG2026-0103am/`)
- Create: `scripts/validate_theme.py`
- Create: `.gitignore` (workspace root)

**Interfaces:**
- Consumes: nothing.
- Produces: `scripts/validate_theme.py` — the standard verification for every later task (`python3 scripts/validate_theme.py`). Validates: (1) every `.json` under `neon-adda-theme/` parses; (2) required files exist; (3) every new section file contains `{% schema %}...{% endschema %}` and its inner JSON parses; (4) class parity — every static `class="..."` token in the new section files and `snippets/na-wa-float.liquid` (excluding `{{ }}`/`{% %}` dynamic tokens) exists in `neon-adda-theme/assets/neonadda.css` or the allowlist; (5) `node --check` on `neon-adda-theme/assets/neonadda.js`; (6) Liquid tag balance per file.

- [ ] **Step 1: Copy the Horizon export**

Run:
```bash
cp -r "theme_export__neon-adda-2-myshopify-com-horizon__13AUG2026-0103am" neon-adda-theme
```

- [ ] **Step 2: Init git + .gitignore**

Run:
```bash
git init
```

Create `.gitignore` at the workspace root:

```gitignore
__pycache__/
*.pyc
neon-adda-theme.zip
```

- [ ] **Step 3: Write the validation script**

Create `scripts/validate_theme.py` with exactly this content:

```python
#!/usr/bin/env python3
"""Local structural validation for the Neon Adda Shopify theme.

Checks that don't require a live Shopify store. Run from the workspace root:
    python3 scripts/validate_theme.py
Exit code 0 = all checks pass.
"""
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
THEME = ROOT / "neon-adda-theme"

# The sections/snippets written by this plan. Class parity is checked
# against these only, so Horizon's own classes don't flood the report.
OUR_FILES = [
    "sections/neon-hero.liquid",
    "sections/trust-bar.liquid",
    "sections/occasions.liquid",
    "sections/how-it-works.liquid",
    "sections/stats.liquid",
    "sections/reviews.liquid",
    "sections/faq.liquid",
    "sections/cta-band.liquid",
    "sections/neon-page-hero.liquid",
    "sections/contact-info.liquid",
    "sections/neon-customizer.liquid",
    "snippets/na-wa-float.liquid",
]

REQUIRED = [
    "layout/theme.liquid",
    "config/settings_schema.json",
    "config/settings_data.json",
    "templates/index.json",
    "assets/neonadda.css",
    "assets/neonadda.js",
]

# Classes added by JS or belonging to the Horizon/system layer that our
# section markup may legitimately use without being defined in neonadda.css.
ALLOWLIST = {
    "shopify-section", "section", "section-background", "section--page-width",
    "spacing-style", "color-custom", "page-width", "page-width-narrow",
    "page-width-normal", "page-width-wide", "page-width-content",
    "reveal", "is-in", "is-off", "neon", "neon--sm", "neon--boot",
    "data-ph", "na-highlight-ph",
}

errors = []


def err(msg):
    errors.append(msg)
    print(f"  FAIL: {msg}")


def ok(msg):
    print(f"  ok: {msg}")


def check_json(path):
    try:
        json.loads(path.read_text(encoding="utf-8"))
        ok(f"JSON {path.relative_to(THEME)}")
        return True
    except json.JSONDecodeError as e:
        err(f"JSON {path.relative_to(THEME)}: {e}")
        return False


def check_liquid_balance(path):
    text = path.read_text(encoding="utf-8")
    opens = text.count("{%")
    closes = text.count("%}")
    if opens != closes:
        err(f"Liquid tag balance {path.relative_to(THEME)}: {opens} opens vs {closes} closes")
    else:
        ok(f"Liquid balance {path.relative_to(THEME)} ({opens} tags)")


def check_schema(path):
    text = path.read_text(encoding="utf-8")
    m = re.search(r"{%\s*schema\s*%}(.*?){%\s*endschema\s*%}", text, re.S)
    if not m:
        err(f"No schema block in {path.relative_to(THEME)}")
        return
    try:
        json.loads(m.group(1))
        ok(f"Schema JSON {path.relative_to(THEME)}")
    except json.JSONDecodeError as e:
        err(f"Schema JSON {path.relative_to(THEME)}: {e}")


def extract_classes(text):
    classes = set()
    for m in re.finditer(r'class="([^"]+)"', text):
        for token in m.group(1).split():
            if "{{" in token or "{%" in token:
                continue
            classes.add(token)
    return classes


def check_class_parity():
    css_text = (THEME / "assets" / "neonadda.css").read_text(encoding="utf-8")
    missing = {}
    for rel in OUR_FILES:
        path = THEME / rel
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        # Only the markup portion counts; strip the schema block.
        text = re.sub(r"{%\s*schema\s*%}.*?{%\s*endschema\s*%}", "", text, flags=re.S)
        for cls in extract_classes(text):
            if cls in ALLOWLIST:
                continue
            if cls not in css_text:
                missing.setdefault(rel, []).append(cls)
    if missing:
        for rel, classes in missing.items():
            err(f"Classes in {rel} missing from neonadda.css: {sorted(classes)}")
    else:
        ok("Class parity (all section classes defined in neonadda.css)")


def check_node():
    if not (THEME / "assets" / "neonadda.js").exists():
        return
    try:
        subprocess.run(
            ["node", "--check", str(THEME / "assets" / "neonadda.js")],
            check=True, capture_output=True, text=True,
        )
        ok("node --check assets/neonadda.js")
    except FileNotFoundError:
        print("  skip: node not installed (JS parse check skipped)")
    except subprocess.CalledProcessError as e:
        err(f"node --check: {e.stderr.strip()}")


def main():
    if not THEME.exists():
        print("Neon Adda theme directory not found. Run Task 1 first.")
        sys.exit(1)

    print("== Required files ==")
    for rel in REQUIRED:
        path = THEME / rel
        if path.exists():
            ok(f"{rel}")
        else:
            err(f"missing required file {rel}")

    print("== JSON ==")
    for path in sorted((THEME / "templates").glob("*.json")):
        check_json(path)
    for path in sorted((THEME / "config").glob("*.json")):
        check_json(path)
    for path in sorted((THEME / "sections").glob("*.json")):
        check_json(path)
    for path in sorted((THEME / "locales").glob("*.json")):
        check_json(path)

    print("== Section schemas + Liquid balance ==")
    for rel in OUR_FILES:
        path = THEME / rel
        if not path.exists():
            err(f"missing {rel}")
            continue
        check_schema(path)
        check_liquid_balance(path)
    check_liquid_balance(THEME / "layout" / "theme.liquid")

    print("== Class parity ==")
    check_class_parity()

    print("== JS ==")
    check_node()

    if errors:
        print(f"\n{len(errors)} problem(s) found.")
        sys.exit(1)
    print("\nAll checks passed.")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run the validator on the pristine copy**

Run:
```bash
python3 scripts/validate_theme.py
```
Expected: all JSON files parse; "missing" FAILs for `config/settings_data.json` (still 0 bytes — it parses as empty, `json.loads("")` raises, so it may FAIL at this step), `assets/neonadda.css`, `assets/neonadda.js`, and the section files — all of which Tasks 2–9 create. The `settings_data.json` empty-file failure is expected and disappears in Task 2. Confirm no *unexpected* failures (e.g., the export's own JSON must all parse).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Neon Adda theme from Horizon export with validation harness"
```

---

### Task 2: Theme settings — business group, dark palette, fonts

**Files:**
- Modify: `neon-adda-theme/config/settings_schema.json` (append one settings group)
- Create: `neon-adda-theme/config/settings_data.json`
- Create: `neon-adda-theme/snippets/na-fonts.liquid`

**Interfaces:**
- Produces settings ids consumed by later tasks: `na_whatsapp`, `na_phone_human`, `na_email`, `na_instagram`, `na_city`, `na_address`, `na_hours`, `na_warranty`, `na_delivery_days`, `na_build_days`, `na_per_char_price`, `na_char_allowance`, `highlight_placeholders` (all in group "Neon Adda — business").
- Produces `snippets/na-fonts.liquid` — rendered by `layout/theme.liquid` in Task 5.

- [ ] **Step 1: Append the business settings group**

Open `neon-adda-theme/config/settings_schema.json`. The root is a JSON array. Insert this object as the **last element of the array** (immediately before the final `]`):

```json
  ,
  {
    "name": "Neon Adda — business",
    "settings": [
      {
        "type": "header",
        "content": "Business details (used across the whole theme)"
      },
      {
        "type": "text",
        "id": "na_whatsapp",
        "label": "WhatsApp number (digits only, country code + number)",
        "default": "919000000000",
        "info": "Example: 919000000000 for +91 90000 00000"
      },
      {
        "type": "text",
        "id": "na_phone_human",
        "label": "Phone (display format)",
        "default": "+91 90000 00000"
      },
      {
        "type": "text",
        "id": "na_email",
        "label": "Email",
        "default": "hello@neonadda.in"
      },
      {
        "type": "url",
        "id": "na_instagram",
        "label": "Instagram URL",
        "default": "https://instagram.com/neonadda"
      },
      {
        "type": "text",
        "id": "na_city",
        "label": "City",
        "default": "Kolkata"
      },
      {
        "type": "text",
        "id": "na_address",
        "label": "Workshop address",
        "default": "Studio address line 1, Kolkata, West Bengal 700000"
      },
      {
        "type": "text",
        "id": "na_hours",
        "label": "Hours",
        "default": "Mon–Sat, 10am – 7pm IST"
      },
      {
        "type": "header",
        "content": "Claim copy (placeholder text, editable later)"
      },
      {
        "type": "text",
        "id": "na_warranty",
        "label": "Warranty claim",
        "default": "2-year warranty"
      },
      {
        "type": "text",
        "id": "na_delivery_days",
        "label": "Delivery time claim",
        "default": "5–8 days"
      },
      {
        "type": "text",
        "id": "na_build_days",
        "label": "Build time claim",
        "default": "3–4 days"
      },
      {
        "type": "header",
        "content": "Placeholders"
      },
      {
        "type": "checkbox",
        "id": "highlight_placeholders",
        "label": "Highlight placeholder text",
        "default": true,
        "info": "Draws a dashed amber underline under [data-ph] spans so unfinished copy is easy to spot. Turn off when content is real."
      }
    ]
  }
```

- [ ] **Step 2: Write the settings data (dark preset + defaults)**

Create `neon-adda-theme/config/settings_data.json` with exactly this content:

```json
{
  "current": {
    "color_palette": {
      "background": "#0B0A12",
      "foreground": "#F4F1FB"
    },
    "page_background_color": "#0B0A12",
    "page_text_color": "#F4F1FB",
    "palette_primary_button_background": "#FF3D9A",
    "palette_primary_button_text": "#FFFFFF",
    "palette_primary_button_border": "#FF3D9A",
    "palette_secondary_button_background": "#161424",
    "palette_secondary_button_text": "#F4F1FB",
    "palette_secondary_button_border": "#F4F1FB",
    "palette_input_background": "#161424",
    "palette_input_text": "#F4F1FB",
    "palette_input_border": "#837D9C",
    "badge_sale_background_color": "#FF3D9A",
    "badge_sale_text_color": "#FFFFFF",
    "badge_sold_out_background_color": "#161424",
    "badge_sold_out_text_color": "#ABA5C2",
    "highlight_placeholders": true,
    "na_whatsapp": "919000000000",
    "na_phone_human": "+91 90000 00000",
    "na_email": "hello@neonadda.in",
    "na_instagram": "https://instagram.com/neonadda",
    "na_city": "Kolkata",
    "na_address": "Studio address line 1, Kolkata, West Bengal 700000",
    "na_hours": "Mon–Sat, 10am – 7pm IST",
    "na_warranty": "2-year warranty",
    "na_delivery_days": "5–8 days",
    "na_build_days": "3–4 days"
  },
  "presets": [
    {
      "name": "Neon Adda (dark)",
      "settings": {
        "color_palette": {
          "background": "#0B0A12",
          "foreground": "#F4F1FB"
        },
        "page_background_color": "#0B0A12",
        "page_text_color": "#F4F1FB",
        "palette_primary_button_background": "#FF3D9A",
        "palette_primary_button_text": "#FFFFFF",
        "highlight_placeholders": true,
        "na_whatsapp": "919000000000",
        "na_phone_human": "+91 90000 00000",
        "na_email": "hello@neonadda.in",
        "na_city": "Kolkata",
        "na_warranty": "2-year warranty",
        "na_delivery_days": "5–8 days",
        "na_build_days": "3–4 days"
      }
    }
  ]
}
```

- [ ] **Step 3: Write the fonts snippet**

Create `neon-adda-theme/snippets/na-fonts.liquid`:

```liquid
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600;700&family=Yellowtail&family=Monoton&display=swap"
  rel="stylesheet"
>
```

- [ ] **Step 4: Validate + commit**

Run: `python3 scripts/validate_theme.py`
Expected: `config/settings_data.json` now parses; schema JSON parses. The only remaining FAILs are the not-yet-created `assets/neonadda.css`, `assets/neonadda.js`, and the 11 section files (Tasks 3–9).

```bash
git add -A
git commit -m "feat: add Neon Adda business settings, dark palette preset, and Google Fonts snippet"
```

---

### Task 3: Port the design system — `assets/neonadda.css`

**Files:**
- Create: `neon-adda-theme/assets/neonadda.css` (port of `neonadda-website/assets/style.css` + two edits + appended glue block)

**Interfaces:**
- Produces the CSS contract for all later sections: every class used in our section markup must be defined here (validated by class parity). Class names are the HTML site's own: `.neon`, `.neon--sm`, `.neon--boot`, `.is-off`, `.board`, `.board--bare`, `.board__holes`, `.cable`, `.spill`, `.btn`, `.btn--primary`, `.btn--ghost`, `.btn--wa`, `.btn--block`, `.btn--sm`, `.hero`, `.hero__stage`, `.hero__copy`, `.hero__eyebrow`, `.hero__dot`, `.hero__lede`, `.hero__cta`, `.hero__line`, `.hero__sign`, `.hero__caret`, `.hero__hint`, `.trust`, `.trust__grid`, `.trust__item`, `.head`, `.head__row`, `.eyebrow`, `.head__link`, `.occ`, `.occ__ico`, `.band`, `.band__cta`, `.steps`, `.step`, `.review`, `.stars`, `.acc`, `.acc__item`, `.acc__q`, `.acc__ico`, `.acc__a`, `.stat`, `.stats`, `.prose`, `.lead`, `.contact`, `.contact__card`, `.contact__list`, `.cz`, `.cz__preview`, `.cz__stage`, `.cz__sign`, `.cz__field`, `.cz__label`, `.input`, `.opts`, `.opt`, `.swatches`, `.swatch`, `.sizes`, `.size`, `.size__gauge`, `.size__bar`, `.size__txt`, `.size__price`, `.total`, `.total__row`, `.total__val`, `.total__note`, `.fine`, `.toggle`, `.toggle__track`, `.notes`, `.note`, `.wa-float`, `.shell`, `.section`, `.section--tight`, `.reveal`, plus tokens `--ink`, `--ink-2`, `--surface`, `--surface-2`, `--surface-3`, `--line`, `--line-2`, `--pink`, `--pink-soft`, `--cyan`, `--amber`, `--mint`, `--text`, `--muted`, `--muted-2`, `--display`, `--body`, `--script`, `--tube`, `--gut`, `--sect`, `--r-sm`, `--r`, `--r-lg`, `--shell`, `--header-h`.
- Produces the body-level canvas (ambient light wash, film grain, focus ring) and the Horizon font-variable overrides (listed in the glue block below).

- [ ] **Step 1: Copy the source stylesheet**

Run:
```bash
cp neonadda-website/assets/style.css neon-adda-theme/assets/neonadda.css
```

- [ ] **Step 2: Gate the placeholder marker behind the body class**

In `neon-adda-theme/assets/neonadda.css`, replace the final rule:

```css
/* ---------- placeholder marker (visible only in the demo) ---------- */
[data-ph]{ border-bottom:1px dashed rgba(255,201,122,.55); }
```

with:

```css
/* ---------- placeholder marker (toggled by the theme setting) ---------- */
body.na-highlight-ph [data-ph]{ border-bottom:1px dashed rgba(255,201,122,.55); }
```

- [ ] **Step 3: Append the Horizon glue block**

Append this block to the end of `neon-adda-theme/assets/neonadda.css` (loads after Horizon's base.css, so these win the cascade):

```css
/* ============================================================
   Neon Adda → Horizon glue
   Loaded after Horizon's base.css via theme.liquid. Points
   Horizon's font variables at the Google families, forces the
   dark canvas, and rescues a few system bits the port leaves
   unstyled. Keep this block last.
   ============================================================ */
:root{
  --font-body--family: "Instrument Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-subheading--family: "Instrument Sans", system-ui, sans-serif;
  --font-heading--family: "Bricolage Grotesque", "Trebuchet MS", system-ui, sans-serif;
  --font-accent--family: "Monoton", "Bricolage Grotesque", sans-serif;
  --font-paragraph--family: var(--font-body--family);
}

/* Horizon's base styles assume a light canvas; the ported site owns
   the canvas and Horizon's body colour must not fight it. */
body{
  background: var(--ink);
  color: var(--text);
  overflow-x: clip;
}

/* Horizon wraps content in <div class="page-wrapper">; keep the port's
   stacking so the fixed ambient/grain layers sit behind content. */
.page-wrapper{ position: relative; z-index: 1; }

/* Rich text inside Shopify page content (story/why) uses the prose look. */
.page-content .rte,
.rte{ font-family: var(--body); }

/* The port's .neon glow needs color-scheme dark to render white cores. */
:root{ color-scheme: dark; }

/* Make sure headings in Horizon sections use the display family. */
h1,h2,h3,h4,.h1,.h2,.h3,.h4{ font-family: var(--display); }

/* Cyan focus ring, matching the port. */
:focus-visible{
  outline: 2px solid var(--cyan);
  outline-offset: 3px;
  border-radius: 4px;
}
```

- [ ] **Step 4: Validate + commit**

Run: `python3 scripts/validate_theme.py`
Expected: class parity passes for all *existing* OUR_FILES entries? No — the section files don't exist yet, so the parity check skips missing files. CSS is now present. Confirm no new FAILs beyond the still-missing sections/JS.

```bash
git add -A
git commit -m "feat: port Neon Adda design system to assets/neonadda.css with Horizon glue"
```

---

### Task 4: Behaviour — `assets/neonadda.js`

**Files:**
- Create: `neon-adda-theme/assets/neonadda.js`

**Interfaces:**
- Consumes (rendered by the section files in Tasks 6–9):
  - Hero: element `#heroSign` with attribute `data-phrases` = JSON array `[{"t":"phrase","c":"#hex"}]`; elements `#heroCaret`, `#heroSpill`.
  - Customizer: `<script type="application/json" id="na-customizer-config">` with JSON:
    ```json
    {
      "productHandle": "custom-neon-sign",
      "whatsapp": "919000000000",
      "maxChars": 24,
      "charAllowance": 10,
      "perCharPrice": 145,
      "defaultText": "Your Words",
      "colourOption": "Colour",
      "sizeOption": "Size",
      "colours": [{"name": "Warm White", "hex": "#FFC97A"}],
      "sizes": [{"name": "Small", "dim": "40 × 20 cm", "note": "Desk, shelf, bedside"}]
    }
    ```
    Elements: `#czSign`, `#czSpill`, `#czText`, `#czFonts`, `#czColours`, `#czSizes`, `#czPower`, `#czTotal`, `#czColourName`, `#czSizeName`, `#czCount`, `#czAdd`, `#czSetup`, `[data-wa-order]`.
  - Accordion: `.acc__q` buttons inside `.acc__item`.
  - Reveal: `.reveal` elements.
- Produces: `addCustomSignToCart(variantId, properties)` — a globally-available async function that POSTs to `window.Shopify.routes.cart_add_url` (fallback `/cart/add.js`) with `{ id, quantity, properties, sections }`, then dispatches the Horizon standard event `shopify:cart:lines-update` (payload shape mirrors `assets/product-form.js` lines 439–490: `action:'add'`, `context:'product'`, `lines`, and a `promise` resolving `{ cart, detail: { sections } }`). Later tasks (and the QA checklist) rely on the cart drawer auto-opening and the header count updating.

- [ ] **Step 1: Write `neon-adda-theme/assets/neonadda.js`**

Create the file with exactly this content:

```js
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
```

- [ ] **Step 2: Validate + commit**

Run: `python3 scripts/validate_theme.py`
Expected: `node --check assets/neonadda.js` passes; no new FAILs.

```bash
git add -A
git commit -m "feat: port Neon Adda behaviour with data-driven customizer and native cart integration"
```

---

### Task 5: Layout integration — `layout/theme.liquid` + WhatsApp float snippet

**Files:**
- Modify: `neon-adda-theme/layout/theme.liquid` (4 edits)
- Create: `neon-adda-theme/snippets/na-wa-float.liquid`

**Interfaces:**
- Produces: the `<body>` class `na-highlight-ph` (consumed by the gated `[data-ph]` rule); global loads of `neonadda.css` and `neonadda.js`; the floating WhatsApp button (classes `.wa-float`, `.wa-float__icon`, `.wa-float__label`) used everywhere.

- [ ] **Step 1: Load fonts + css + js in theme.liquid**

In `neon-adda-theme/layout/theme.liquid`, inside `<head>`, directly after the line:

```liquid
    {%- render 'theme-styles-variables' -%}
```

insert:

```liquid
    {%- render 'na-fonts' -%}
    {{ 'neonadda.css' | asset_url | stylesheet_tag }}
    {{ 'neonadda.js' | asset_url | script_tag }}
```

- [ ] **Step 2: Add the placeholder-highlight body class**

Replace the `<body>` opening tag:

```liquid
  <body class="page-width-{{ settings.page_width }} card-hover-effect-{{ settings.card_hover_effect }}">
```

with:

```liquid
  <body class="page-width-{{ settings.page_width }} card-hover-effect-{{ settings.card_hover_effect }}{% if settings.highlight_placeholders %} na-highlight-ph{% endif %}">
```

- [ ] **Step 3: Render the WhatsApp float button**

In `neon-adda-theme/layout/theme.liquid`, immediately before the closing `</body>`:

```liquid
    {% render 'na-wa-float' %}
```

- [ ] **Step 4: Create the WhatsApp float snippet**

Create `neon-adda-theme/snippets/na-wa-float.liquid`:

```liquid
{%- if settings.na_whatsapp != blank -%}
  <a
    class="wa-float"
    href="https://wa.me/{{ settings.na_whatsapp }}?text={{ 'Hi Neon Adda, I would like to order a custom neon sign.' | url_encode }}"
    target="_blank"
    rel="noopener"
    aria-label="Chat on WhatsApp"
  >
    <svg class="wa-float__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1a12 12 0 01-5.6-4.9c-.4-.7-.8-1.5-.8-2.3 0-.9.4-1.3.7-1.6.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4-.1.5l-.4.5c-.1.2-.3.3-.1.6a8 8 0 003.7 3.2c.3.1.5.1.6-.1l.8-1c.2-.2.3-.2.6-.1l1.8.9c.3.1.5.2.5.3z"/></svg>
    <span class="wa-float__label">WhatsApp</span>
  </a>
{%- endif -%}
```

- [ ] **Step 5: Validate + commit**

Run: `python3 scripts/validate_theme.py`
Expected: no new FAILs (`.wa-float` and `.wa-float__label`/`__icon` are covered by `.wa-float` in the ported CSS; class parity checks tokens as whole strings, so `wa-float__label` WILL be flagged as missing from neonadda.css unless defined — add this one rule to the end of `neonadda.css` in this task):

Append to `neon-adda-theme/assets/neonadda.css`:

```css
.wa-float__icon{ width:20px; height:20px; }
.wa-float__label{ line-height:1; }
```

```bash
git add -A
git commit -m "feat: integrate Neon Adda assets into theme layout with WhatsApp float button"
```

---

### Task 6: Sections — `neon-hero`, `trust-bar`, `neon-page-hero`

**Files:**
- Create: `neon-adda-theme/sections/neon-hero.liquid`
- Create: `neon-adda-theme/sections/trust-bar.liquid`
- Create: `neon-adda-theme/sections/neon-page-hero.liquid`

**Interfaces:**
- Consumes: CSS classes from Task 3; `data-phrases` contract from Task 4.
- Produces: section types `neon-hero`, `trust-bar`, `neon-page-hero` referenced by templates in Task 11.

- [ ] **Step 1: Create `neon-hero.liquid`**

```liquid
{%- capture phrases -%}
  [{%- for block in section.blocks -%}{"t":{{ block.settings.text | json }},"c":{{ block.settings.colour | json }}}{% unless forloop.last %},{% endunless %}{%- endfor -%}]
{%- endcapture -%}

<section class="hero">
  <div class="shell">
    <div class="hero__stage">
      <div class="board">
        <span class="board__holes"></span>
        <span class="hero__line">
          <span class="hero__sign neon neon--boot" id="heroSign" style="--c:#FFC97A" data-phrases="{{ phrases | escape }}"></span>
          <span class="hero__caret" id="heroCaret" style="--c:#FFC97A" aria-hidden="true"></span>
        </span>
        <span class="cable" aria-hidden="true"></span>
      </div>
      <div class="spill" id="heroSpill" aria-hidden="true"></div>
      <p class="hero__hint">{{ section.settings.hint }}</p>
    </div>

    <div class="hero__copy">
      {% if section.settings.eyebrow != blank %}
        <span class="hero__eyebrow"><i class="hero__dot"></i> {{ section.settings.eyebrow }}</span>
      {% endif %}
      <h1>{{ section.settings.heading }}</h1>
      {% if section.settings.lede != blank %}
        <p class="hero__lede">{{ section.settings.lede }}</p>
      {% endif %}
      <div class="hero__cta">
        {% if section.settings.cta_primary_label != blank %}
          <a class="btn btn--primary" href="{{ section.settings.cta_primary_link | default: '/' }}">{{ section.settings.cta_primary_label }}</a>
        {% endif %}
        {% if section.settings.cta_secondary_label != blank %}
          <a class="btn btn--ghost" href="{{ section.settings.cta_secondary_link | default: '/' }}">{{ section.settings.cta_secondary_label }}</a>
        {% endif %}
      </div>
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Neon hero",
  "tag": "section",
  "class": "shopify-section",
  "settings": [
    {
      "type": "text",
      "id": "eyebrow",
      "label": "Eyebrow",
      "default": "Handmade in Kolkata · Shipped India-wide"
    },
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Say it in light."
    },
    {
      "type": "textarea",
      "id": "lede",
      "label": "Lede",
      "default": "Custom LED neon signs for birthdays, weddings, homes and storefronts. Design yours in under a minute, see it glow on screen, and we'll send a free proof before anything is made."
    },
    {
      "type": "text",
      "id": "hint",
      "label": "Hint under the sign",
      "default": "Every sign is cut to your words. Preview it before you pay."
    },
    {
      "type": "text",
      "id": "cta_primary_label",
      "label": "Primary button label",
      "default": "Design your sign"
    },
    {
      "type": "url",
      "id": "cta_primary_link",
      "label": "Primary button link"
    },
    {
      "type": "text",
      "id": "cta_secondary_label",
      "label": "Secondary button label",
      "default": "Browse ready designs"
    },
    {
      "type": "url",
      "id": "cta_secondary_link",
      "label": "Secondary button link"
    }
  ],
  "blocks": [
    {
      "type": "phrase",
      "name": "Typing phrase",
      "limit": 8,
      "settings": [
        {
          "type": "text",
          "id": "text",
          "label": "Phrase",
          "default": "Happy Birthday"
        },
        {
          "type": "color",
          "id": "colour",
          "label": "Glow colour",
          "default": "#FFC97A"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Neon hero",
      "blocks": [
        { "type": "phrase", "settings": { "text": "Happy Birthday", "colour": "#FFC97A" } },
        { "type": "phrase", "settings": { "text": "Shubh Vivah", "colour": "#FFE45C" } },
        { "type": "phrase", "settings": { "text": "Mom to be", "colour": "#FF3D9A" } },
        { "type": "phrase", "settings": { "text": "Good Vibes", "colour": "#21D4FD" } },
        { "type": "phrase", "settings": { "text": "your words", "colour": "#4ADE80" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Create `trust-bar.liquid`**

```liquid
{%- if section.blocks.size > 0 -%}
<section class="trust">
  <div class="shell trust__grid">
    {%- for block in section.blocks -%}
      <div class="trust__item" {{ block.shopify_attributes }}>
        {%- case block.settings.icon -%}
          {%- when 'check' -%}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
          {%- when 'shield' -%}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z"/></svg>
          {%- when 'truck' -%}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z"/><circle cx="7" cy="17" r="1.6"/><circle cx="17" cy="17" r="1.6"/></svg>
          {%- when 'chat' -%}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          {%- when 'sparkle' -%}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/></svg>
        {%- endcase -%}
        <div>
          <b>{{ block.settings.title }}</b>
          <span>{{ block.settings.subtext }}</span>
        </div>
      </div>
    {%- endfor -%}
  </div>
</section>
{%- endif -%}

{% schema %}
{
  "name": "Trust bar",
  "tag": "section",
  "class": "shopify-section",
  "max_blocks": 4,
  "blocks": [
    {
      "type": "item",
      "name": "Trust item",
      "settings": [
        {
          "type": "select",
          "id": "icon",
          "label": "Icon",
          "options": [
            { "value": "check", "label": "Check" },
            { "value": "shield", "label": "Shield" },
            { "value": "truck", "label": "Truck" },
            { "value": "chat", "label": "Chat" },
            { "value": "sparkle", "label": "Sparkle" }
          ],
          "default": "check"
        },
        {
          "type": "text",
          "id": "title",
          "label": "Title",
          "default": "Free design proof"
        },
        {
          "type": "text",
          "id": "subtext",
          "label": "Subtext",
          "default": "See a mockup before you pay a rupee"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Trust bar",
      "blocks": [
        { "type": "item", "settings": { "icon": "check", "title": "Free design proof", "subtext": "See a mockup before you pay a rupee" } },
        { "type": "item", "settings": { "icon": "shield", "title": "2-year warranty", "subtext": "On LED tubing and adaptor" } },
        { "type": "item", "settings": { "icon": "truck", "title": "Free shipping", "subtext": "5–8 days across India" } },
        { "type": "item", "settings": { "icon": "chat", "title": "Talk to a human", "subtext": "WhatsApp us any time before ordering" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 3: Create `neon-page-hero.liquid`**

```liquid
<section class="section section--tight">
  <div class="shell">
    {% if section.settings.eyebrow != blank %}
      <span class="eyebrow">{{ section.settings.eyebrow }}</span>
    {% endif %}
    <h1>{{ section.settings.heading }}</h1>
    {% if section.settings.lede != blank %}
      <p class="lead" style="max-width:60ch;color:var(--muted)">{{ section.settings.lede }}</p>
    {% endif %}
  </div>
</section>

{% schema %}
{
  "name": "Neon page hero",
  "tag": "section",
  "class": "shopify-section",
  "settings": [
    {
      "type": "text",
      "id": "eyebrow",
      "label": "Eyebrow",
      "default": "About us"
    },
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Our story"
    },
    {
      "type": "textarea",
      "id": "lede",
      "label": "Lede",
      "default": "How Neon Adda started."
    }
  ],
  "presets": [
    {
      "name": "Neon page hero"
    }
  ]
}
{% endschema %}
```

- [ ] **Step 4: Validate + commit**

Run: `python3 scripts/validate_theme.py`
Expected: schema JSON parses; Liquid balance ok; class parity passes (all classes are from the ported CSS: `.hero`, `.hero__stage`, `.board`, `.board__holes`, `.hero__line`, `.hero__sign`, `.neon`, `.neon--boot`, `.hero__caret`, `.cable`, `.spill`, `.hero__hint`, `.shell`, `.hero__copy`, `.hero__eyebrow`, `.hero__dot`, `.hero__lede`, `.hero__cta`, `.btn`, `.btn--primary`, `.btn--ghost`, `.trust`, `.trust__grid`, `.trust__item`, `.section`, `.section--tight`, `.eyebrow`, `.lead`).

```bash
git add -A
git commit -m "feat: add neon-hero, trust-bar, and neon-page-hero sections"
```

---

### Task 7: Sections — `occasions`, `how-it-works`, `stats`, `cta-band`

**Files:**
- Create: `neon-adda-theme/sections/occasions.liquid`
- Create: `neon-adda-theme/sections/how-it-works.liquid`
- Create: `neon-adda-theme/sections/stats.liquid`
- Create: `neon-adda-theme/sections/cta-band.liquid`

**Interfaces:**
- Produces section types `occasions`, `how-it-works`, `stats`, `cta-band` (used by templates in Task 11).

- [ ] **Step 1: Create `occasions.liquid`**

```liquid
{%- if section.settings.heading != blank or section.settings.eyebrow != blank -%}
  <div class="head reveal">
    {% if section.settings.eyebrow != blank %}<span class="eyebrow">{{ section.settings.eyebrow }}</span>{% endif %}
    <h2>{{ section.settings.heading }}</h2>
  </div>
{%- endif -%}

{%- if section.blocks.size > 0 -%}
  <div class="occ reveal">
    {%- for block in section.blocks -%}
      <a href="{{ block.settings.link | default: '/collections/all' }}" {{ block.shopify_attributes }}>
        <span class="occ__ico neon neon--sm" style="--c:{{ block.settings.colour | default: '#FFC97A' }}">{{ block.settings.glyph }}</span>
        <b>{{ block.settings.label }}</b>
      </a>
    {%- endfor -%}
  </div>
{%- endif -%}

{% schema %}
{
  "name": "Occasions",
  "tag": "section",
  "class": "shopify-section",
  "settings": [
    {
      "type": "text",
      "id": "eyebrow",
      "label": "Eyebrow",
      "default": "Shop by moment"
    },
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "What's the occasion?"
    }
  ],
  "blocks": [
    {
      "type": "tile",
      "name": "Occasion tile",
      "settings": [
        {
          "type": "text",
          "id": "label",
          "label": "Label",
          "default": "Wedding"
        },
        {
          "type": "text",
          "id": "glyph",
          "label": "Glyph text (script)",
          "default": "Vivah",
          "info": "A short word rendered as a tiny lit sign"
        },
        {
          "type": "color",
          "id": "colour",
          "label": "Glow colour",
          "default": "#FFC97A"
        },
        {
          "type": "url",
          "id": "link",
          "label": "Collection link"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Occasions",
      "blocks": [
        { "type": "tile", "settings": { "label": "Birthday", "glyph": "Happy", "colour": "#FFC97A" } },
        { "type": "tile", "settings": { "label": "Wedding", "glyph": "Vivah", "colour": "#FFE45C" } },
        { "type": "tile", "settings": { "label": "Baby", "glyph": "Oh Baby", "colour": "#21D4FD" } },
        { "type": "tile", "settings": { "label": "Love", "glyph": "Love", "colour": "#FF3D9A" } },
        { "type": "tile", "settings": { "label": "Home", "glyph": "Home", "colour": "#4ADE80" } },
        { "type": "tile", "settings": { "label": "Business", "glyph": "Open", "colour": "#A78BFA" } },
        { "type": "tile", "settings": { "label": "Festive", "glyph": "Diwali", "colour": "#FF5A5A" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Create `how-it-works.liquid`**

```liquid
<div class="head reveal">
  {% if section.settings.eyebrow != blank %}<span class="eyebrow">{{ section.settings.eyebrow }}</span>{% endif %}
  <h2>{{ section.settings.heading }}</h2>
</div>

{%- if section.blocks.size > 0 -%}
  <div class="steps reveal">
    {%- for block in section.blocks -%}
      <div class="step" {{ block.shopify_attributes }}>
        <h3>{{ block.settings.title }}</h3>
        <p>{{ block.settings.text }}</p>
      </div>
    {%- endfor -%}
  </div>
{%- endif -%}

{% schema %}
{
  "name": "How it works",
  "tag": "section",
  "class": "shopify-section",
  "max_blocks": 4,
  "settings": [
    {
      "type": "text",
      "id": "eyebrow",
      "label": "Eyebrow",
      "default": "How it works"
    },
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "From idea to wall in about a week"
    }
  ],
  "blocks": [
    {
      "type": "step",
      "name": "Step",
      "settings": [
        {
          "type": "text",
          "id": "title",
          "label": "Title",
          "default": "Design it"
        },
        {
          "type": "textarea",
          "id": "text",
          "label": "Text",
          "default": "Type your text in the customizer, or send us a sketch on WhatsApp."
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "How it works",
      "blocks": [
        { "type": "step", "settings": { "title": "Design it", "text": "Type your text in the customizer, or send us a sketch on WhatsApp." } },
        { "type": "step", "settings": { "title": "Approve the proof", "text": "We send a mockup on your wall colour, free. Changes are unlimited." } },
        { "type": "step", "settings": { "title": "We build it", "text": "3–4 days of hand-bending LED tube onto cut acrylic backing." } },
        { "type": "step", "settings": { "title": "It arrives ready", "text": "Boxed with adaptor, screws and template. Hang it in ten minutes." } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 3: Create `stats.liquid`**

```liquid
{%- if section.blocks.size > 0 -%}
  <div class="stats reveal">
    {%- for block in section.blocks -%}
      <div class="stat" {{ block.shopify_attributes }}>
        <b>{{ block.settings.figure }}</b>
        <span>{{ block.settings.label }}</span>
      </div>
    {%- endfor -%}
  </div>
{%- endif -%}

{% schema %}
{
  "name": "Stats",
  "tag": "section",
  "class": "shopify-section",
  "max_blocks": 6,
  "blocks": [
    {
      "type": "stat",
      "name": "Stat",
      "settings": [
        {
          "type": "text",
          "id": "figure",
          "label": "Figure",
          "default": "1,200+"
        },
        {
          "type": "text",
          "id": "label",
          "label": "Label",
          "default": "Signs made to order"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Stats",
      "blocks": [
        { "type": "stat", "settings": { "figure": "1,200+", "label": "Signs made to order" } },
        { "type": "stat", "settings": { "figure": "4.9/5", "label": "Average customer rating" } },
        { "type": "stat", "settings": { "figure": "2 yrs", "label": "Warranty on tube & adaptor" } },
        { "type": "stat", "settings": { "figure": "5–8 days", "label": "Typical delivery, India-wide" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 4: Create `cta-band.liquid`**

```liquid
{%- if section.settings.heading != blank -%}
  <div class="band reveal">
    {% if section.settings.eyebrow != blank %}<span class="eyebrow">{{ section.settings.eyebrow }}</span>{% endif %}
    <h2>{{ section.settings.heading }}</h2>
    {% if section.settings.lede != blank %}<p>{{ section.settings.lede }}</p>{% endif %}
    <div class="band__cta">
      {% if section.settings.btn_primary_label != blank %}
        <a class="btn btn--primary" href="{{ section.settings.btn_primary_link | default: '/' }}">{{ section.settings.btn_primary_label }}</a>
      {% endif %}
      {% if section.settings.btn_secondary_label != blank %}
        {% if section.settings.btn_secondary_style == 'wa' %}
          <a class="btn btn--wa" href="https://wa.me/{{ settings.na_whatsapp }}?text={{ section.settings.btn_secondary_wa_text | default: 'Hi Neon Adda!' | url_encode }}" target="_blank" rel="noopener">{{ section.settings.btn_secondary_label }}</a>
        {% else %}
          <a class="btn btn--ghost" href="{{ section.settings.btn_secondary_link | default: '/' }}">{{ section.settings.btn_secondary_label }}</a>
        {% endif %}
      {% endif %}
    </div>
  </div>
{%- endif -%}

{% schema %}
{
  "name": "CTA band",
  "tag": "section",
  "class": "shopify-section",
  "settings": [
    {
      "type": "text",
      "id": "eyebrow",
      "label": "Eyebrow",
      "default": ""
    },
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Ready to see yours glow?"
    },
    {
      "type": "textarea",
      "id": "lede",
      "label": "Lede",
      "default": "Design it on screen now, or send us a photo of your wall and we'll suggest a size."
    },
    {
      "type": "text",
      "id": "btn_primary_label",
      "label": "Primary button label",
      "default": "Design your sign"
    },
    {
      "type": "url",
      "id": "btn_primary_link",
      "label": "Primary button link"
    },
    {
      "type": "text",
      "id": "btn_secondary_label",
      "label": "Secondary button label",
      "default": "Get in touch"
    },
    {
      "type": "select",
      "id": "btn_secondary_style",
      "label": "Secondary button style",
      "options": [
        { "value": "ghost", "label": "Ghost" },
        { "value": "wa", "label": "WhatsApp" }
      ],
      "default": "ghost"
    },
    {
      "type": "url",
      "id": "btn_secondary_link",
      "label": "Secondary button link",
      "info": "Used when the style is Ghost"
    },
    {
      "type": "text",
      "id": "btn_secondary_wa_text",
      "label": "WhatsApp pre-filled message",
      "default": "Hi Neon Adda, I would like to ask about a custom neon sign.",
      "info": "Used when the style is WhatsApp"
    }
  ],
  "presets": [
    {
      "name": "CTA band"
    }
  ]
}
{% endschema %}
```

- [ ] **Step 5: Validate + commit**

Run: `python3 scripts/validate_theme.py`
Expected: all checks pass for the four new files (`.occ`, `.occ__ico`, `.step`, `.steps`, `.stat`, `.stats`, `.band`, `.band__cta`, `.head`, `.eyebrow`, `.reveal` are all in the ported CSS).

```bash
git add -A
git commit -m "feat: add occasions, how-it-works, stats, and cta-band sections"
```

---

### Task 8: Sections — `reviews`, `faq`, `contact-info`

**Files:**
- Create: `neon-adda-theme/sections/reviews.liquid`
- Create: `neon-adda-theme/sections/faq.liquid`
- Create: `neon-adda-theme/sections/contact-info.liquid`

**Interfaces:**
- Produces section types `reviews`, `faq`, `contact-info`. `contact-info` consumes the business settings from Task 2 (`na_whatsapp`, `na_phone_human`, `na_email`, `na_instagram`, `na_address`, `na_hours`).

- [ ] **Step 1: Create `reviews.liquid`**

```liquid
<div class="head reveal">
  {% if section.settings.eyebrow != blank %}<span class="eyebrow">{{ section.settings.eyebrow }}</span>{% endif %}
  <h2>{{ section.settings.heading }}</h2>
</div>

{%- if section.blocks.size > 0 -%}
  <div class="reviews reveal">
    {%- for block in section.blocks -%}
      <div class="review" {{ block.shopify_attributes }}>
        <span class="stars" aria-label="{{ block.settings.stars }} out of 5 stars">{% for i in (1..block.settings.stars) %}★{% endfor %}</span>
        <p data-ph>{{ block.settings.quote }}</p>
        <footer><b data-ph>{{ block.settings.author }}</b><span data-ph>{{ block.settings.context }}</span></footer>
      </div>
    {%- endfor -%}
  </div>
{%- endif -%}

{% schema %}
{
  "name": "Reviews",
  "tag": "section",
  "class": "shopify-section",
  "settings": [
    {
      "type": "text",
      "id": "eyebrow",
      "label": "Eyebrow",
      "default": "Reviews"
    },
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "What customers say"
    }
  ],
  "blocks": [
    {
      "type": "review",
      "name": "Review",
      "settings": [
        {
          "type": "range",
          "id": "stars",
          "label": "Stars",
          "min": 1,
          "max": 5,
          "step": 1,
          "default": 5
        },
        {
          "type": "textarea",
          "id": "quote",
          "label": "Quote"
        },
        {
          "type": "text",
          "id": "author",
          "label": "Author"
        },
        {
          "type": "text",
          "id": "context",
          "label": "Context",
          "info": "e.g. Wedding · Kolkata"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Reviews",
      "blocks": [
        { "type": "review", "settings": { "stars": 5, "quote": "Ordered a 'Shubh Vivah' sign for my sister's wedding. The proof came the same evening and they changed the font twice without any fuss.", "author": "Ananya R.", "context": "Wedding · Kolkata" } },
        { "type": "review", "settings": { "stars": 5, "quote": "We put our café logo in neon above the counter. Two months in, still bright, and it's genuinely brought people in off the street to photograph it.", "author": "Rohit M.", "context": "Café owner · Pune" } },
        { "type": "review", "settings": { "stars": 5, "quote": "Was nervous ordering something this size online. They sent a photo of it lit up in the workshop before packing. Arrived perfectly, mounting kit included.", "author": "Sneha K.", "context": "Home decor · Bengaluru" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Create `faq.liquid`**

```liquid
{%- if section.settings.heading != blank -%}
  <div class="head reveal">
    {% if section.settings.eyebrow != blank %}<span class="eyebrow">{{ section.settings.eyebrow }}</span>{% endif %}
    <h2>{{ section.settings.heading }}</h2>
  </div>
{%- endif -%}

{%- if section.blocks.size > 0 -%}
  <div class="acc reveal">
    {%- for block in section.blocks -%}
      <div class="acc__item" data-open="false" {{ block.shopify_attributes }}>
        <button class="acc__q" type="button" aria-expanded="false">
          {{ block.settings.question }}
          <svg class="acc__ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <div class="acc__a">{{ block.settings.answer }}</div>
      </div>
    {%- endfor -%}
  </div>
{%- endif -%}

{% schema %}
{
  "name": "FAQ",
  "tag": "section",
  "class": "shopify-section",
  "settings": [
    {
      "type": "text",
      "id": "eyebrow",
      "label": "Eyebrow",
      "default": "Before you order"
    },
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Common questions"
    }
  ],
  "blocks": [
    {
      "type": "qa",
      "name": "Question",
      "settings": [
        {
          "type": "text",
          "id": "question",
          "label": "Question"
        },
        {
          "type": "richtext",
          "id": "answer",
          "label": "Answer"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "FAQ",
      "blocks": [
        { "type": "qa", "settings": { "question": "How much does a custom neon sign cost?", "answer": "<p>Signs start at ₹2,250. Price depends on size and how many characters you use — the customizer shows your exact total as you type.</p>" } },
        { "type": "qa", "settings": { "question": "Is this real neon gas?", "answer": "<p>No, and that's deliberate. These are LED neon flex signs — the same look lit, but far less power, no heat, no shatter risk.</p>" } },
        { "type": "qa", "settings": { "question": "Can I see it before I pay?", "answer": "<p>Yes. We send a free design proof — your words, your colour — and nothing is made until you approve it.</p>" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 3: Create `contact-info.liquid`**

```liquid
<div class="contact">
  <div>
    <div class="contact__card" style="margin-bottom:1rem">
      <h3 style="margin-bottom:.4rem">Fastest: WhatsApp</h3>
      <p style="color:var(--muted);font-size:.94rem;margin-bottom:1.1rem">
        Send a photo of your wall and the words you want. We'll reply with a mockup and a price.
      </p>
      <a class="btn btn--wa btn--block" href="https://wa.me/{{ settings.na_whatsapp }}?text={{ 'Hi Neon Adda, I would like to ask about a custom neon sign.' | url_encode }}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1a12 12 0 01-5.6-4.9c-.4-.7-.8-1.5-.8-2.3 0-.9.4-1.3.7-1.6.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4-.1.5l-.4.5c-.1.2-.3.3-.1.6a8 8 0 003.7 3.2c.3.1.5.1.6-.1l.8-1c.2-.2.3-.2.6-.1l1.8.9c.3.1.5.2.5.3z"/></svg>
        Message on WhatsApp
      </a>
    </div>

    <div class="contact__card">
      <ul class="contact__list">
        <li>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.2a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"/></svg>
          <div><b>Phone</b><a href="tel:+{{ settings.na_whatsapp }}"><span data-ph>{{ settings.na_phone_human }}</span></a></div>
        </li>
        <li>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/></svg>
          <div><b>Email</b><a href="mailto:{{ settings.na_email }}"><span data-ph>{{ settings.na_email }}</span></a></div>
        </li>
        <li>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <div><b>Workshop</b><span data-ph>{{ settings.na_address }}</span></div>
        </li>
        <li>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          <div><b>Hours</b><span data-ph>{{ settings.na_hours }}</span></div>
        </li>
        <li>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
          <div><b>Instagram</b><a href="{{ settings.na_instagram }}">@neonadda</a></div>
        </li>
      </ul>
    </div>
  </div>
</div>

{% schema %}
{
  "name": "Contact info",
  "tag": "section",
  "class": "shopify-section",
  "settings": [
    {
      "type": "paragraph",
      "content": "Business details come from the 'Neon Adda — business' theme settings."
    }
  ],
  "presets": [
    {
      "name": "Contact info"
    }
  ]
}
{% endschema %}
```

- [ ] **Step 4: Validate + commit**

Run: `python3 scripts/validate_theme.py`
Expected: all pass (`.review`, `.stars`, `.acc`, `.acc__item`, `.acc__q`, `.acc__ico`, `.acc__a`, `.contact`, `.contact__card`, `.contact__list`, `.btn--wa`, `.btn--block`, `.head`, `.eyebrow`, `.reveal` are in the ported CSS).

```bash
git add -A
git commit -m "feat: add reviews, faq, and contact-info sections"
```

---

### Task 9: The customizer section — `neon-customizer.liquid`

**Files:**
- Create: `neon-adda-theme/sections/neon-customizer.liquid`

**Interfaces:**
- Consumes: the `#na-customizer-config` JSON contract and element ids from Task 4; classes `.cz*`, `.swatch`, `.size*`, `.total*`, `.toggle*`, `.input`, `.opt`, `.btn*` from Task 3.
- Produces section type `neon-customizer` (used by `templates/page.neon-customizer.json` in Task 11). Renders the config JSON the JS parses, with `product` picker, `colours` and `sizes` as repeatable blocks, `max_chars`, `char_allowance`, `per_char_price`.

- [ ] **Step 1: Create `neon-customizer.liquid`**

```liquid
{%- liquid
  assign colour_blocks = section.blocks | where: 'type', 'colour'
  assign size_blocks = section.blocks | where: 'type', 'size'
-%}
{%- capture config_json -%}
{
  "productHandle": {{ section.settings.product | default: '' | split: '/' | last | json }},
  "whatsapp": {{ settings.na_whatsapp | json }},
  "maxChars": {{ section.settings.max_chars | json }},
  "charAllowance": {{ section.settings.char_allowance | json }},
  "perCharPrice": {{ section.settings.per_char_price | json }},
  "defaultText": {{ section.settings.default_text | json }},
  "colourOption": "Colour",
  "sizeOption": "Size",
  "colours": [
    {%- for block in colour_blocks -%}
      {"name": {{ block.settings.name | json }}, "hex": {{ block.settings.hex | json }}}{% unless forloop.last %},{% endunless %}
    {%- endfor -%}
  ],
  "sizes": [
    {%- for block in size_blocks -%}
      {"name": {{ block.settings.name | json }}, "dim": {{ block.settings.dim | json }}, "note": {{ block.settings.note | json }}}{% unless forloop.last %},{% endunless %}
    {%- endfor -%}
  ]
}
{%- endcapture -%}

<section class="section section--tight">
  <div class="shell">
    <span class="eyebrow">Neon Customizer</span>
    <h1 id="czHeading">{{ section.settings.heading }}</h1>
    <p class="lead" style="max-width:58ch;color:var(--muted);margin-bottom:2.2rem">
      Type anything up to {{ section.settings.max_chars }} characters. The preview and the price update as you go — what you see is what we build.
    </p>

    <div class="cz">
      <div class="cz__preview">
        <div class="cz__stage">
          <div class="board board--bare">
            <span class="cz__sign neon" id="czSign" style="--c:#FFC97A">Your Words</span>
          </div>
        </div>
        <div class="spill" id="czSpill" aria-hidden="true"></div>
        <div style="display:flex;justify-content:center;margin-top:.4rem">
          <button class="toggle" id="czPower" type="button" aria-pressed="true">
            <span class="toggle__track" aria-hidden="true"></span>
            <span>Lit</span>
          </button>
        </div>
      </div>

      <div class="cz__controls">
        <div class="cz__field">
          <label class="cz__label" for="czText">
            <span>Your text</span><b id="czCount">0/{{ section.settings.max_chars }}</b>
          </label>
          <input class="input" id="czText" type="text" maxlength="{{ section.settings.max_chars }}"
                 value="{{ section.settings.default_text | escape }}" placeholder="e.g. Happy Birthday" autocomplete="off">
        </div>

        <div class="cz__field">
          <span class="cz__label"><span>Font</span></span>
          <div class="opts" id="czFonts">
            <button class="opt" type="button" data-font="script" aria-pressed="true" style="font-family:var(--script);font-size:1.1rem">Script</button>
            <button class="opt" type="button" data-font="tube" aria-pressed="false" style="font-family:var(--tube);font-size:.85rem">BLOCK</button>
          </div>
        </div>

        <div class="cz__field">
          <span class="cz__label"><span>Tube colour</span><b id="czColourName"></b></span>
          <div class="swatches" id="czColours"></div>
        </div>

        <div class="cz__field">
          <span class="cz__label"><span>Size</span><b id="czSizeName"></b></span>
          <div class="sizes" id="czSizes"></div>
        </div>

        <div class="total">
          <div class="total__row">
            <span>Your price, all inclusive</span>
            <span class="total__val" id="czTotal">…</span>
          </div>
          <div style="display:grid;gap:.6rem">
            <button class="btn btn--primary btn--block" id="czAdd" type="button">Add to cart</button>
            <a class="btn btn--wa btn--block" data-wa-order href="#">Send this design on WhatsApp</a>
          </div>
          <p class="total__note">
            Free design proof before payment · Free shipping · <span data-ph>{{ settings.na_warranty }}</span>
          </p>
          <p id="czSetup" style="display:none;margin-top:.9rem;padding:.8rem 1rem;border-radius:10px;background:rgba(255,90,90,.1);border:1px solid rgba(255,90,90,.4);font-size:.85rem;color:var(--text)">
            The custom sign product isn't set up yet. In the theme editor, choose the "Custom Neon Sign" product in this section, or create it in Products with Colour and Size options.
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

<script type="application/json" id="na-customizer-config">{{ config_json }}</script>

{% schema %}
{
  "name": "Neon customizer",
  "tag": "section",
  "class": "shopify-section",
  "settings": [
    {
      "type": "product",
      "id": "product",
      "label": "Custom Neon Sign product",
      "info": "Must have 'Colour' and 'Size' options with the variant prices set in Products → Edit variants."
    },
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Design your sign"
    },
    {
      "type": "text",
      "id": "default_text",
      "label": "Default text",
      "default": "Your Words"
    },
    {
      "type": "range",
      "id": "max_chars",
      "label": "Max characters",
      "min": 8,
      "max": 40,
      "step": 1,
      "unit": "chars",
      "default": 24
    },
    {
      "type": "range",
      "id": "char_allowance",
      "label": "Characters included in base price",
      "min": 1,
      "max": 20,
      "step": 1,
      "unit": "chars",
      "default": 10
    },
    {
      "type": "number",
      "id": "per_char_price",
      "label": "Price per extra character (₹)",
      "default": 145,
      "info": "Charged per character beyond the allowance. Shown live and attached to the order as a property; final total is confirmed at proof stage."
    }
  ],
  "blocks": [
    {
      "type": "colour",
      "name": "Tube colour",
      "settings": [
        {
          "type": "text",
          "id": "name",
          "label": "Name",
          "default": "Warm White"
        },
        {
          "type": "color",
          "id": "hex",
          "label": "Colour",
          "default": "#FFC97A"
        }
      ]
    },
    {
      "type": "size",
      "name": "Size",
      "settings": [
        {
          "type": "text",
          "id": "name",
          "label": "Name",
          "default": "Medium"
        },
        {
          "type": "text",
          "id": "dim",
          "label": "Dimensions",
          "default": "60 × 30 cm"
        },
        {
          "type": "text",
          "id": "note",
          "label": "Use-case note",
          "default": "Above a bed or sofa"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Neon customizer",
      "blocks": [
        { "type": "colour", "settings": { "name": "Warm White", "hex": "#FFC97A" } },
        { "type": "colour", "settings": { "name": "Cool White", "hex": "#EAF6FF" } },
        { "type": "colour", "settings": { "name": "Hot Pink", "hex": "#FF3D9A" } },
        { "type": "colour", "settings": { "name": "Ice Blue", "hex": "#21D4FD" } },
        { "type": "colour", "settings": { "name": "Green", "hex": "#4ADE80" } },
        { "type": "colour", "settings": { "name": "Purple", "hex": "#A78BFA" } },
        { "type": "colour", "settings": { "name": "Red", "hex": "#FF5A5A" } },
        { "type": "colour", "settings": { "name": "Lemon", "hex": "#FFE45C" } },
        { "type": "size", "settings": { "name": "Small", "dim": "40 × 20 cm", "note": "Desk, shelf, bedside" } },
        { "type": "size", "settings": { "name": "Medium", "dim": "60 × 30 cm", "note": "Above a bed or sofa" } },
        { "type": "size", "settings": { "name": "Large", "dim": "90 × 45 cm", "note": "Feature wall, events, cafés" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Validate + commit**

Run: `python3 scripts/validate_theme.py`
Expected: all pass — `.cz`, `.cz__preview`, `.cz__stage`, `.board`, `.board--bare`, `.cz__sign`, `.spill`, `.toggle`, `.toggle__track`, `.cz__controls`, `.cz__field`, `.cz__label`, `.input`, `.opts`, `.opt`, `.swatches`, `.sizes`, `.total`, `.total__row`, `.total__val`, `.btn`, `.btn--primary`, `.btn--block`, `.btn--wa`, `.total__note`, `.section`, `.section--tight`, `.shell`, `.eyebrow`, `.lead` all exist in neonadda.css.

```bash
git add -A
git commit -m "feat: add neon-customizer section with live pricing and cart integration"
```

---

### Task 10: Restyle Horizon's native components (header, footer, cards, facets, cart)

**Files:**
- Modify: `neon-adda-theme/assets/neonadda.css` (append override block)

**Interfaces:**
- Consumes: Horizon class names verified in the export — `.announcement-bar`, `.announcement-bar__slide`, `.header`, `.header__row`, `.header__navigation-bar-row`, `.header-actions__action`, `.header-actions__cart-icon`, `.footer-content`, `.product-card`, `.product-card__content`, `.card-gallery`, `.product-grid`, `.price`, `.button`, `.facets*`, `.cart-drawer__content`, `.cart-drawer__items`, `.cart-drawer__inner`, `.cart-drawer__summary`, `.cart-items`, `.cart-items__table`, `.cart-items__title`, `.cart-items__price`, `.cart-items__property`, `.product-information`, `.variant-picker`, `.product-form-buttons`.
- Produces: the dark neon look on all native pages without touching Horizon's Liquid.

- [ ] **Step 1: Append the native-component override block**

Append to the end of `neon-adda-theme/assets/neonadda.css`:

```css
/* ============================================================
   Horizon native-component restyle
   Header, announcement (ticker), footer, product cards, price,
   buttons, inputs, facets, cart drawer — restyled to the Neon
   Adda look without editing Horizon's markup.
   ============================================================ */

/* --- canvas + text --- */
body{
  color-scheme: dark;
}

/* --- announcement bar = the ticker --- */
.announcement-bar{
  background: var(--ink-2);
  color: var(--muted);
  font-size: .755rem;
  letter-spacing: .015em;
}
.announcement-bar__slide .announcement-bar__message,
.announcement-bar a{
  color: var(--muted);
}

/* --- header --- */
.header{
  background: rgba(11, 10, 18, .82);
  -webkit-backdrop-filter: blur(14px) saturate(1.3);
  backdrop-filter: blur(14px) saturate(1.3);
  border-bottom: 1px solid var(--line);
}
.header__row{
  min-height: var(--header-h, 62px);
}
.header__navigation-bar-row{
  border-top: 1px solid var(--line);
}
.header a,
.header button,
.header-actions__action{
  color: var(--text);
}
.header-actions__action:hover,
.header a:hover{
  color: var(--pink-soft);
}
.header-actions__cart-icon .cart-bubble{
  background: var(--pink);
  color: #fff;
}
.header__logo img{
  height: auto;
  max-height: 44px;
}

/* --- footer --- */
.footer,
.footer-content{
  border-top: 1px solid var(--line);
  background: var(--ink-2);
}
.footer-content h2,
.footer-content h3,
.footer-content .menu__heading__default,
.footer-content .h4{
  font-family: var(--body);
  font-size: .78rem;
  font-weight: 700;
  letter-spacing: .13em;
  text-transform: uppercase;
  color: var(--muted-2);
}
.footer-content a,
.footer-content p,
.footer-content li{
  color: var(--muted);
  font-size: .93rem;
}
.footer-content a:hover{
  color: var(--text);
}

/* --- product cards: a sign on a wall --- */
.product-grid{
  gap: 1.1rem;
}
.product-card{
  border-radius: 14px;
  overflow: hidden;
}
.product-card__content{
  background: transparent;
}
.product-card__image,
.product-card .card-gallery{
  border-radius: 14px;
  overflow: hidden;
}
.product-card :is(h4, .h4, .product-card__title){
  font-family: var(--display);
  font-weight: 600;
  letter-spacing: -.012em;
  color: var(--text);
}
.product-card .price{
  color: var(--amber);
  font-weight: 600;
}
.product-card .price s{
  color: var(--muted-2);
}

/* --- price on product pages --- */
.price{
  color: var(--text);
}
.price .price__sale,
.price--on-sale .price__sale{
  color: var(--amber);
}

/* --- buttons --- */
.button,
.button--secondary{
  border-radius: 999px;
  font-weight: 600;
}
.shopify-payment-button__button--unbranded{
  border-radius: 999px;
}
.product-form-buttons .button{
  border-radius: 999px;
}

/* --- inputs --- */
.input,
input[type="text"],
input[type="email"],
input[type="tel"],
input[type="number"],
select,
textarea{
  background: rgba(0, 0, 0, .28);
  color: var(--text);
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .13);
}

/* --- facets / collection filters --- */
.facets__label{
  color: var(--muted-2);
}
.facets__summary{
  color: var(--text);
}
.facets__pill-label,
.facets__inputs-list .facets__input-label{
  color: var(--muted);
}
.facets__pill-input:checked + .facets__pill-label,
.facets__input:checked + .facets__input-label{
  color: var(--text);
  border-color: var(--pink);
}
.facets__clear-all-link{
  color: var(--pink);
}

/* --- cart drawer --- */
.cart-drawer__content,
.cart-drawer__inner{
  background: var(--ink-2);
  color: var(--text);
}
.cart-drawer__summary{
  background: var(--ink-2);
  border-top: 1px solid var(--line);
}
.cart-items__title a{
  color: var(--text);
}
.cart-items__price{
  color: var(--amber);
}
.cart-items__property{
  color: var(--muted);
}
.cart-items__variant{
  color: var(--muted-2);
}

/* --- product page --- */
.product-information{
  background: transparent;
}
.product-information h1,
.product-information .h1{
  font-family: var(--display);
}
.variant-picker__option-name{
  color: var(--muted-2);
}

/* --- search + empty states --- */
.search-result__title,
.empty-page-title{
  font-family: var(--display);
}

/* --- 404 --- */
.main-404 h1{
  font-family: var(--display);
  color: var(--pink);
  text-shadow: 0 0 30px rgba(255, 61, 154, .45);
}
```

- [ ] **Step 2: Validate + commit**

Run: `python3 scripts/validate_theme.py`
Expected: class parity unaffected (this block only adds selectors). No FAILs from this task's changes.

```bash
git add -A
git commit -m "feat: restyle Horizon header, footer, product cards, facets, and cart to the Neon Adda look"
```

---

### Task 11: Templates — homepage + page templates + ticker text

**Files:**
- Replace: `neon-adda-theme/templates/index.json`
- Create: `neon-adda-theme/templates/page.neon-customizer.json`, `page.story.json`, `page.why.json`, `page.faq.json`, `page.contact.json`
- Modify: `neon-adda-theme/sections/header-group.json` (ticker text)

**Interfaces:**
- Consumes: section types from Tasks 6–9 and Horizon's `product-list`, `main-page`, `section` (contact-form block).
- Produces: the page routes — `/` (index), `/pages/neon-customizer`, `/pages/our-story`, `/pages/why-neon-adda`, `/pages/faq`, `/pages/contact` — that the merchant assigns in admin.

- [ ] **Step 1: Replace `templates/index.json`**

Replace the whole file with:

```json
{
  "sections": {
    "na_hero": {
      "type": "neon-hero",
      "settings": {
        "cta_primary_link": "/pages/neon-customizer",
        "cta_secondary_link": "/collections/all"
      },
      "blocks": {
        "phrase_1": { "type": "phrase", "settings": { "text": "Happy Birthday", "colour": "#FFC97A" } },
        "phrase_2": { "type": "phrase", "settings": { "text": "Shubh Vivah", "colour": "#FFE45C" } },
        "phrase_3": { "type": "phrase", "settings": { "text": "Mom to be", "colour": "#FF3D9A" } },
        "phrase_4": { "type": "phrase", "settings": { "text": "Good Vibes", "colour": "#21D4FD" } },
        "phrase_5": { "type": "phrase", "settings": { "text": "your words", "colour": "#4ADE80" } }
      },
      "block_order": ["phrase_1", "phrase_2", "phrase_3", "phrase_4", "phrase_5"]
    },
    "na_trust": {
      "type": "trust-bar",
      "blocks": {
        "trust_1": { "type": "item", "settings": { "icon": "check", "title": "Free design proof", "subtext": "See a mockup before you pay a rupee" } },
        "trust_2": { "type": "item", "settings": { "icon": "shield", "title": "2-year warranty", "subtext": "On LED tubing and adaptor" } },
        "trust_3": { "type": "item", "settings": { "icon": "truck", "title": "Free shipping", "subtext": "5–8 days across India" } },
        "trust_4": { "type": "item", "settings": { "icon": "chat", "title": "Talk to a human", "subtext": "WhatsApp us any time before ordering" } }
      },
      "block_order": ["trust_1", "trust_2", "trust_3", "trust_4"]
    },
    "na_bestsellers": {
      "type": "product-list",
      "blocks": {
        "static-header": {
          "type": "_product-list-content",
          "static": true,
          "blocks": {
            "title": { "type": "_product-list-text", "settings": { "text": "<h3>Bestsellers</h3>" } },
            "view-all": { "type": "_product-list-button", "settings": { "label": "All signs →", "style_class": "link" } }
          },
          "block_order": ["title", "view-all"]
        },
        "static-product-card": { "type": "_product-card", "static": true }
      },
      "block_order": ["static-header", "static-product-card"],
      "settings": {
        "collection": "bestsellers",
        "layout_type": "grid",
        "carousel_on_mobile": false,
        "max_products": 4,
        "columns": 4,
        "mobile_columns": "2",
        "columns_gap": 8,
        "rows_gap": 24,
        "section_width": "page-width",
        "padding-block-start": 48,
        "padding-block-end": 48
      }
    },
    "na_occasions": {
      "type": "occasions",
      "blocks": {
        "occ_1": { "type": "tile", "settings": { "label": "Birthday", "glyph": "Happy", "colour": "#FFC97A" } },
        "occ_2": { "type": "tile", "settings": { "label": "Wedding", "glyph": "Vivah", "colour": "#FFE45C" } },
        "occ_3": { "type": "tile", "settings": { "label": "Baby", "glyph": "Oh Baby", "colour": "#21D4FD" } },
        "occ_4": { "type": "tile", "settings": { "label": "Love", "glyph": "Love", "colour": "#FF3D9A" } },
        "occ_5": { "type": "tile", "settings": { "label": "Home", "glyph": "Home", "colour": "#4ADE80" } },
        "occ_6": { "type": "tile", "settings": { "label": "Business", "glyph": "Open", "colour": "#A78BFA" } },
        "occ_7": { "type": "tile", "settings": { "label": "Festive", "glyph": "Diwali", "colour": "#FF5A5A" } }
      },
      "block_order": ["occ_1", "occ_2", "occ_3", "occ_4", "occ_5", "occ_6", "occ_7"]
    },
    "na_band_customizer": {
      "type": "cta-band",
      "settings": {
        "eyebrow": "Neon Customizer",
        "heading": "Your words, your colour, your size.",
        "lede": "Type anything, pick from eight tube colours and three sizes, and watch the price update as you go. No guessing, no email back-and-forth.",
        "btn_primary_label": "Open the customizer",
        "btn_primary_link": "/pages/neon-customizer",
        "btn_secondary_label": "Ask on WhatsApp",
        "btn_secondary_style": "wa"
      }
    },
    "na_new_arrivals": {
      "type": "product-list",
      "blocks": {
        "static-header": {
          "type": "_product-list-content",
          "static": true,
          "blocks": {
            "title": { "type": "_product-list-text", "settings": { "text": "<h3>New arrivals</h3>" } },
            "view-all": { "type": "_product-list-button", "settings": { "label": "All signs →", "style_class": "link" } }
          },
          "block_order": ["title", "view-all"]
        },
        "static-product-card": { "type": "_product-card", "static": true }
      },
      "block_order": ["static-header", "static-product-card"],
      "settings": {
        "collection": "new-arrivals",
        "layout_type": "grid",
        "carousel_on_mobile": false,
        "max_products": 4,
        "columns": 4,
        "mobile_columns": "2",
        "columns_gap": 8,
        "rows_gap": 24,
        "section_width": "page-width",
        "padding-block-start": 48,
        "padding-block-end": 48
      }
    },
    "na_steps": {
      "type": "how-it-works",
      "blocks": {
        "step_1": { "type": "step", "settings": { "title": "Design it", "text": "Type your text in the customizer, or send us a sketch on WhatsApp." } },
        "step_2": { "type": "step", "settings": { "title": "Approve the proof", "text": "We send a mockup on your wall colour, free. Changes are unlimited." } },
        "step_3": { "type": "step", "settings": { "title": "We build it", "text": "3–4 days of hand-bending LED tube onto cut acrylic backing." } },
        "step_4": { "type": "step", "settings": { "title": "It arrives ready", "text": "Boxed with adaptor, screws and template. Hang it in ten minutes." } }
      },
      "block_order": ["step_1", "step_2", "step_3", "step_4"]
    },
    "na_reviews": {
      "type": "reviews",
      "blocks": {
        "review_1": { "type": "review", "settings": { "stars": 5, "quote": "Ordered a 'Shubh Vivah' sign for my sister's wedding. The proof came the same evening and they changed the font twice without any fuss. Everyone asked where we got it.", "author": "Ananya R.", "context": "Wedding · Kolkata" } },
        "review_2": { "type": "review", "settings": { "stars": 5, "quote": "We put our café logo in neon above the counter. Two months in, still bright, and it's genuinely brought people in off the street to photograph it.", "author": "Rohit M.", "context": "Café owner · Pune" } },
        "review_3": { "type": "review", "settings": { "stars": 5, "quote": "Was nervous ordering something this size online. They sent a photo of it lit up in the workshop before packing. Arrived perfectly, mounting kit included.", "author": "Sneha K.", "context": "Home decor · Bengaluru" } }
      },
      "block_order": ["review_1", "review_2", "review_3"]
    },
    "na_faq": {
      "type": "faq",
      "blocks": {
        "qa_1": { "type": "qa", "settings": { "question": "How much does a custom sign cost?", "answer": "<p>Signs start at ₹2,250 and rise with size and character count. The customizer shows your exact price as you type.</p>" } },
        "qa_2": { "type": "qa", "settings": { "question": "What size should I get?", "answer": "<p>Small (40 × 20 cm) suits a desk or shelf. Medium (60 × 30 cm) is the most popular. Large (90 × 45 cm) is for feature walls, events and shopfronts.</p>" } },
        "qa_3": { "type": "qa", "settings": { "question": "Is it real neon gas?", "answer": "<p>No — these are LED neon flex, and that's a good thing. A tenth of the power, no heat, won't shatter.</p>" } }
      },
      "block_order": ["qa_1", "qa_2", "qa_3"]
    },
    "na_band_closing": {
      "type": "cta-band",
      "settings": {
        "heading": "Ready to see yours glow?",
        "lede": "Design it on screen now, or send us a photo of your wall and we'll suggest a size.",
        "btn_primary_label": "Design your sign",
        "btn_primary_link": "/pages/neon-customizer",
        "btn_secondary_label": "Get in touch",
        "btn_secondary_style": "ghost",
        "btn_secondary_link": "/pages/contact"
      }
    }
  },
  "order": [
    "na_hero",
    "na_trust",
    "na_bestsellers",
    "na_occasions",
    "na_band_customizer",
    "na_new_arrivals",
    "na_steps",
    "na_reviews",
    "na_faq",
    "na_band_closing"
  ]
}
```

- [ ] **Step 2: Create the five page templates**

Create `neon-adda-theme/templates/page.neon-customizer.json`:

```json
{
  "sections": {
    "main": { "type": "neon-customizer" }
  },
  "order": ["main"]
}
```

Create `neon-adda-theme/templates/page.story.json`:

```json
{
  "sections": {
    "hero": { "type": "neon-page-hero", "settings": { "eyebrow": "About us", "heading": "Our story", "lede": "Neon Adda began the way most good small businesses do — someone wanted something that didn't exist yet, so they made it themselves." } },
    "content": { "type": "main-page", "blocks": { "heading": { "type": "text", "settings": { "text": "<h1>{{ closest.page.title }}</h1>" } }, "page-content": { "type": "page-content" } }, "block_order": ["heading", "page-content"] },
    "closing": { "type": "cta-band" }
  },
  "order": ["hero", "content", "closing"]
}
```

Create `neon-adda-theme/templates/page.why.json`:

```json
{
  "sections": {
    "hero": { "type": "neon-page-hero", "settings": { "eyebrow": "About us", "heading": "Why Neon Adda", "lede": "The honest version: what these signs are made of, what they cost to run, and what we'll do if something goes wrong." } },
    "stats": { "type": "stats", "blocks": { "stat_1": { "type": "stat", "settings": { "figure": "1,200+", "label": "Signs made to order" } }, "stat_2": { "type": "stat", "settings": { "figure": "4.9/5", "label": "Average customer rating" } }, "stat_3": { "type": "stat", "settings": { "figure": "2 yrs", "label": "Warranty on tube & adaptor" } }, "stat_4": { "type": "stat", "settings": { "figure": "5–8 days", "label": "Typical delivery, India-wide" } } }, "block_order": ["stat_1", "stat_2", "stat_3", "stat_4"] },
    "content": { "type": "main-page", "blocks": { "heading": { "type": "text", "settings": { "text": "<h1>{{ closest.page.title }}</h1>" } }, "page-content": { "type": "page-content" } }, "block_order": ["heading", "page-content"] },
    "closing": { "type": "cta-band" }
  },
  "order": ["hero", "stats", "content", "closing"]
}
```

Create `neon-adda-theme/templates/page.faq.json`:

```json
{
  "sections": {
    "hero": { "type": "neon-page-hero", "settings": { "eyebrow": "About us", "heading": "Questions, answered", "lede": "If yours isn't here, message us on WhatsApp — we usually reply within a couple of hours during working days." } },
    "faq": { "type": "faq", "settings": { "eyebrow": "", "heading": "" } },
    "closing": { "type": "cta-band" }
  },
  "order": ["hero", "faq", "closing"]
}
```

Create `neon-adda-theme/templates/page.contact.json` (replaces the existing file):

```json
{
  "sections": {
    "hero": { "type": "neon-page-hero", "settings": { "eyebrow": "Contact", "heading": "Talk to us", "lede": "Most orders start with a message. Send your idea, your wall photo, or just a question — there's no obligation and the design proof is free." } },
    "info": { "type": "contact-info" },
    "form": {
      "type": "section",
      "blocks": {
        "contact_form": {
          "type": "contact-form",
          "settings": { "width": "custom", "custom_width": 60, "width_mobile": "custom", "custom_width_mobile": 100 }
        }
      },
      "block_order": ["contact_form"],
      "settings": { "content_direction": "column", "gap": 32, "padding-block-start": 32, "padding-block-end": 84 }
    },
    "closing": { "type": "cta-band" }
  },
  "order": ["hero", "info", "form", "closing"]
}
```

- [ ] **Step 3: Set the ticker text in the header group**

In `neon-adda-theme/sections/header-group.json`, change the announcement block's text setting:

```json
            "text": "Welcome to our store",
```

to:

```json
            "text": "Free design proof before you pay · Free shipping across India",
```

- [ ] **Step 4: Validate + commit**

Run: `python3 scripts/validate_theme.py`
Expected: all template JSON parses; `header-group.json` parses; no new FAILs.

```bash
git add -A
git commit -m "feat: assemble homepage, page templates, and ticker text"
```

---

### Task 12: "Customise this sign" on the product page

**Files:**
- Modify: `neon-adda-theme/templates/product.json` (add one section)

**Interfaces:**
- Consumes: `custom-liquid` section (verified: setting id `custom_liquid`, type `liquid` — Liquid in the setting is rendered with template context, so `{{ product.handle }}` resolves on product templates) and the customizer's `?p=` preselect (Task 4).
- Produces: a "Customise this sign" button on every product page that pre-fills the customizer with that product's title/colour/size.

- [ ] **Step 1: Add the custom-liquid section to `product.json`**

Open `neon-adda-theme/templates/product.json`. In the `"sections"` object add this entry:

```json
    "na_customize_link": {
      "type": "custom-liquid",
      "settings": {
        "custom_liquid": "<a class=\"btn btn--ghost\" style=\"margin-bottom:1.25rem\" href=\"/pages/neon-customizer?p={{ product.handle }}\">Customise this sign →</a>",
        "section_width": "page-width",
        "padding-block-start": 0,
        "padding-block-end": 0
      }
    },
```

Then add `"na_customize_link"` as the **first** item of the `"order"` array:

```json
  "order": [
    "na_customize_link",
    ...
  ]
```

- [ ] **Step 2: Validate + commit**

Run: `python3 scripts/validate_theme.py`
Expected: `product.json` parses; no new FAILs.

```bash
git add -A
git commit -m "feat: add Customise this sign link to product pages"
```

---

### Task 13: README, packaging, final validation

**Files:**
- Create: `neon-adda-theme/README.md`
- Create: `scripts/package_theme.py`
- Create: `neon-adda-theme.zip` (generated)

**Interfaces:**
- Produces the final deliverable: `neon-adda-theme.zip`, uploadable at Online Store → Themes → Add theme → Upload zip.

- [ ] **Step 1: Write the merchant README**

Create `neon-adda-theme/README.md`:

````markdown
# Neon Adda — Shopify theme

Upload `neon-adda-theme.zip` via **Online Store → Themes → Add theme → Upload zip**,
then **Customize** to preview and **Publish**.

## Setup checklist

1. **Upload the theme** and preview it.
2. **Create the Custom Neon Sign product** — Products → Add product → title
   "Custom Neon Sign", handle `custom-neon-sign`, status **Active**, two options:
   - Option 1: **Colour** → Warm White, Cool White, Hot Pink, Ice Blue, Green,
     Purple, Red, Lemon
   - Option 2: **Size** → Small, Medium, Large
   Then **Edit variants** and set prices (recommended):
   Small ₹2,250 · Medium ₹3,350 · Large ₹5,350 (all 8 colours of a size share
   that price). Keep it out of every collection and menu so it only appears via
   the customizer page.
3. **Upload your products** — photos, names, prices, and colour/size variants as
   needed. Anything added appears on the shop page automatically.
4. **Create collections**: `Bestsellers` and `New arrivals` (homepage grids read
   these handles), plus occasion collections — Wedding, Birthday, Baby, Love,
   Home, Business, Festive. Assign products to them.
5. **Create pages** in Online Store → Pages with these templates:
   - Our Story → `page.story.json` template
   - Why Neon Adda → `page.why.json`
   - FAQ → `page.faq.json`
   - Contact → `page.contact.json`
   - Neon Customizer → `page.neon-customizer.json`
6. **Menus** — Online Store → Navigation: header menu (Home, About with
   submenu Our Story / Why Neon Adda / FAQ, Shop, Neon Customizer, Contact) and
   footer menus.
7. **Business details** — theme editor → "Neon Adda — business" settings:
   WhatsApp number, phone, email, Instagram, city, address, hours, claim copy.
8. **Swap placeholder copy** — reviews, FAQ answers, stats, and claims are in
   the section settings. When real, turn off **Highlight placeholder text**.

## Customizer behaviour (what to expect)

- Price = the selected variant's price (set in Products → Edit variants) plus
  ₹145 per character beyond 10 (both editable in the theme editor).
- Add to cart attaches the spec as order properties: Custom text, Font, Colour,
  Size, Characters, Character surcharge — visible on the order in Admin → Orders.
- The character surcharge is carried as a property and confirmed at proof stage;
  the checkout charge is the variant (base) price.
- WhatsApp button sends the full spec and estimated price to the number in the
  business settings.

## Post-import QA checklist

- Homepage: hero types through phrases; trust bar; bestsellers/new arrivals
  grids show products from the collections; occasions rack links to collection
  pages; accordions open; closing band.
- Product page: "Customise this sign" pre-fills the customizer.
- Customizer: type text → price updates; colours/sizes select; power toggle;
  Add to cart opens the cart drawer and updates the count; the order shows the
  line-item properties; WhatsApp link opens the right number.
- Shop/collection page: filters work; grid restyled.
- Cart, search, 404: dark neon look; checkout unaffected.
- Mobile: sticky price bar on the customizer; WhatsApp float hidden on the
  customizer page; drawer menu opens.
````

- [ ] **Step 2: Write the packaging script**

Create `scripts/package_theme.py`:

```python
#!/usr/bin/env python3
"""Zip neon-adda-theme/ into neon-adda-theme.zip for Shopify upload.

Run: python3 scripts/package_theme.py
"""
import pathlib
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
THEME = ROOT / "neon-adda-theme"
OUT = ROOT / "neon-adda-theme.zip"

EXCLUDE_DIRS = {".git", "__pycache__"}
EXCLUDE_SUFFIXES = {".pyc"}


def main():
    if not THEME.exists():
        raise SystemExit("neon-adda-theme/ not found — run the plan tasks first.")

    count = 0
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(THEME.rglob("*")):
            if path.is_dir():
                continue
            if any(part in EXCLUDE_DIRS for part in path.relative_to(THEME).parts):
                continue
            if path.suffix in EXCLUDE_SUFFIXES:
                continue
            zf.write(path, path.relative_to(THEME))
            count += 1

    print(f"Packaged {count} files -> {OUT.name} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Run the full validation + package**

Run:
```bash
python3 scripts/validate_theme.py
python3 scripts/package_theme.py
```
Expected: "All checks passed." then "Packaged N files -> neon-adda-theme.zip (... bytes)". Verify the zip contains `layout/theme.liquid` and `templates/index.json`:

```bash
python3 -c "import zipfile; z=zipfile.ZipFile('neon-adda-theme.zip'); print([n for n in z.namelist() if n in ('layout/theme.liquid','templates/index.json','config/settings_data.json')])"
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add theme README, packaging script, and build the importable zip"
```

---

## Self-Review (run by the plan author)

**Spec coverage check against `docs/superpowers/specs/2026-08-13-neon-adda-shopify-conversion-design.md`:**

- §3.2 visual layer → Task 3 (port + glue). ✓
- §3.3 assets → Tasks 3, 4. ✓
- §3.4 sections 1–9 → Tasks 6 (hero, trust, page-hero), 7 (occasions, how-it-works, stats, cta-band), 8 (reviews, faq, contact-info), 9 (customizer). Note: `stats` and `contact-info` were added beyond the spec's numbered list to serve the Why and Contact pages. ✓
- §3.5 theme settings → Task 2. ✓
- §3.6 templates → Tasks 11 (index + pages + header ticker), 12 (product), plus Horizon's existing collection/cart/search/404 restyled in Task 10. ✓
- §4.1 product model + single source of truth → Tasks 2 (no base-price settings), 9 (product picker), 4 (reads `/products/<handle>.js`). ✓
- §4.2 UI/pricing/add-to-cart/properties/WhatsApp/preselect → Task 4 + 9 + 12. ✓
- §4.3 error handling → Task 4 (`#czSetup`, disabled button, reduced motion) + Task 9 markup. ✓
- §5.1 editable content → all sections carry schemas; business claims are settings. ✓
- §5.2 placeholder highlight → Task 2 setting + Task 5 body class + Task 3 gated CSS. ✓
- §6 merchant checklist → Task 13 README. ✓
- §7 testing/delivery → Tasks 1 (validator), 13 (package + QA checklist). ✓
- §8 out of scope (blog, apps, migrations) — no tasks touch these. ✓

**Placeholder scan:** no TBD/TODO; every step has concrete content or an exact copy+edit instruction. The only references to Horizon internals ("mirror product-form.js") are backed by the file path and line range in Task 4's Interfaces.

**Type/name consistency:** settings ids (`na_*`, `highlight_placeholders`) are identical across Task 2, 5, 8, 9, 13; section type names match between Tasks 6–9 and Task 11; element ids (`heroSign`, `czSign`, `czAdd`, `na-customizer-config`) match between Tasks 4 and 9; class names in section markup are exactly the ported CSS classes from Task 3's contract.
