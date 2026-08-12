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
