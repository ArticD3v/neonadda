#!/usr/bin/env python3
"""Generate the remaining Neon Adda pages using the header/footer from index.html."""
import re, pathlib

ROOT = pathlib.Path(__file__).parent
idx = (ROOT / "index.html").read_text(encoding="utf-8")

# pull the shared chrome straight out of index.html so it can never drift
HEAD_OPEN = idx.split('<title>')[0]
CHROME_TOP = idx.split('</head>')[1].split('<main id="main">')[0]
CHROME_BOT = '</main>' + idx.split('</main>')[1]


def page(slug, title, desc, body):
    html = (
        HEAD_OPEN
        + f"<title>{title}</title>\n"
        + f'<meta name="description" content="{desc}">\n'
        + idx.split('<meta name="description"')[1].split('>', 1)[1].split('</head>')[0]
        + "</head>"
        + CHROME_TOP
        + '<main id="main">\n'
        + body
        + "\n"
        + CHROME_BOT
    )
    (ROOT / slug).write_text(html, encoding="utf-8")
    print("wrote", slug, len(html), "bytes")


# ---------- page header block used by inner pages ----------
def hero(eyebrow, h1, lede):
    return f"""
  <section class="section section--tight">
    <div class="shell">
      <span class="eyebrow">{eyebrow}</span>
      <h1>{h1}</h1>
      <p class="lead" style="max-width:60ch;color:var(--muted)">{lede}</p>
    </div>
  </section>
"""

CTA_BAND = """
  <section class="section">
    <div class="shell">
      <div class="band reveal">
        <h2>Ready to see yours glow?</h2>
        <p>Design it on screen now, or send us a photo of your wall and we'll suggest a size.</p>
        <div class="band__cta">
          <a class="btn btn--primary" href="customizer.html">Design your sign</a>
          <a class="btn btn--wa" data-wa="Hi Neon Adda, I'd like to ask about a custom sign." href="#">Ask on WhatsApp</a>
        </div>
      </div>
    </div>
  </section>
"""

# =====================================================================
# SHOP
# =====================================================================
page("shop.html",
     "Shop custom neon signs — Neon Adda",
     "Browse ready-made LED neon designs for birthdays, weddings, homes and businesses. Every design is customisable in your words, colour and size.",
     hero("Shop", "Every sign, ready to customise",
          "These are our most-ordered designs. Pick one and change the words, colour or size — or start from a blank slate in the customizer.")
     + """
  <section class="section section--tight" style="padding-top:0">
    <div class="shell">
      <div id="shopFilters" class="opts" style="margin-bottom:1.2rem"></div>
      <p id="shopCount" style="color:var(--muted-2);font-size:.85rem;margin-bottom:1.4rem"></p>
      <div class="grid" id="shopGrid"></div>
    </div>
  </section>
""" + CTA_BAND)

# =====================================================================
# CUSTOMIZER
# =====================================================================
page("customizer.html",
     "Neon Customizer — design your own sign | Neon Adda",
     "Type your words, choose from eight tube colours and three sizes, and see your custom LED neon sign glow before you order. Live pricing, free proof.",
     """
  <section class="section section--tight">
    <div class="shell">
      <span class="eyebrow">Neon Customizer</span>
      <h1 id="czHeading">Design your sign</h1>
      <p class="lead" style="max-width:58ch;color:var(--muted);margin-bottom:2.2rem">
        Type anything up to 24 characters. The preview and the price update as you go — what you see is what we build.
      </p>

      <div class="cz">
        <!-- preview -->
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

        <!-- controls -->
        <div class="cz__controls">
          <div class="cz__field">
            <label class="cz__label" for="czText">
              <span>Your text</span><b id="czCount">10/24</b>
            </label>
            <input class="input" id="czText" type="text" maxlength="24" value="Your Words"
                   placeholder="e.g. Happy Birthday" autocomplete="off">
          </div>

          <div class="cz__field">
            <span class="cz__label"><span>Font</span></span>
            <div class="opts" id="czFonts">
              <button class="opt" type="button" data-font="script" aria-pressed="true"
                      style="font-family:var(--script);font-size:1.1rem">Script</button>
              <button class="opt" type="button" data-font="tube" aria-pressed="false"
                      style="font-family:var(--tube);font-size:.85rem">BLOCK</button>
            </div>
          </div>

          <div class="cz__field">
            <span class="cz__label"><span>Tube colour</span><b id="czColourName">Warm White</b></span>
            <div class="swatches" id="czColours"></div>
          </div>

          <div class="cz__field">
            <span class="cz__label"><span>Size</span><b id="czSizeName">Medium · 60 × 30 cm</b></span>
            <div class="sizes" id="czSizes"></div>
          </div>

          <div class="total">
            <div class="total__row">
              <span>Your price, all inclusive</span>
              <span class="total__val" id="czTotal">₹3,350</span>
            </div>
            <div style="display:grid;gap:.6rem">
              <button class="btn btn--primary btn--block" id="czAdd" type="button">Add to cart</button>
              <a class="btn btn--wa btn--block" data-wa-order href="#">Send this design on WhatsApp</a>
            </div>
            <p class="total__note">Free design proof before payment · Free shipping · <span data-ph>2-year warranty</span></p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--tight">
    <div class="shell">
      <div class="head"><span class="eyebrow">Good to know</span><h2>How pricing works</h2></div>
      <div class="notes">
        <div class="note"><h3>Base price</h3><p>Covers the acrylic backing, LED tube, adaptor and mounting kit.</p></div>
        <div class="note"><h3>Size</h3><p>Larger boards need more tube and a heavier backing, so they cost more.</p></div>
        <div class="note"><h3>Characters</h3><p>The first ten characters are included. After that it's <span data-ph>₹145</span> each.</p></div>
        <div class="note"><h3>Nothing hidden</h3><p>Shipping and GST are already in the number above.</p></div>
      </div>
    </div>
  </section>
""")

# =====================================================================
# OUR STORY
# =====================================================================
page("story.html",
     "Our Story — Neon Adda",
     "How Neon Adda started: a small Indian workshop hand-bending LED neon signs for birthdays, weddings, cafés and homes.",
     hero("About us", "Our story",
          "Neon Adda began the way most good small businesses do — someone wanted something that didn't exist yet, so they made it themselves.")
     + """
  <section class="section" style="padding-top:0">
    <div class="shell">
      <div class="prose">
        <p class="lead" data-ph>In 2024 we made a single sign for a friend's engagement party. It took three attempts, a burnt adaptor and a very late night. The photographs from that evening got shared enough times that strangers started asking where the sign came from.</p>

        <p data-ph>That's how Neon Adda started — not with a business plan, but with a workshop table, a length of LED tube and a habit of saying yes to slightly difficult requests.</p>

        <h2>What we actually do</h2>
        <p>Every sign is made to order. There is no warehouse of finished stock. When you place an order, someone cuts a sheet of acrylic to the shape of your words, bends LED tube along the outline by hand, wires it, tests it lit for <span data-ph>24 hours</span>, and boxes it with the screws and template you'll need to hang it.</p>
        <p>That's slower than printing something. It's also why a sign lasts years instead of months.</p>

        <h2>Why we send a proof first</h2>
        <p>A neon sign is a permanent thing on your wall, and you're buying it from a photograph on a phone. That's a lot of trust to ask for. So before we make anything, we send you a mockup of your exact words in your exact colour — often on a photo of your own wall. Change it as many times as you like. Nothing goes into production until you say yes.</p>
        <p>We'd rather redraw a design four times than ship something you're quietly disappointed by.</p>

        <h2>Who we make for</h2>
        <ul>
          <li><strong>Families</strong> marking birthdays, baby showers and anniversaries</li>
          <li><strong>Couples and wedding planners</strong> who need a backdrop that photographs well</li>
          <li><strong>Cafés, salons, gyms and studios</strong> that want a wall people stop to photograph</li>
          <li><strong>Anyone</strong> who has wanted their own words up in light</li>
        </ul>

        <h2>Where we are</h2>
        <p>The workshop is in <span data-biz-city data-ph>Kolkata</span>. We ship anywhere in India, and most orders leave within <span data-ph>three to four days</span> of you approving the proof.</p>
      </div>
    </div>
  </section>
""" + CTA_BAND)

# =====================================================================
# WHY NEON ADDA
# =====================================================================
page("why.html",
     "Why Neon Adda — materials, warranty and process",
     "What our LED neon signs are made of, how long they last, what the warranty covers, and what happens between your order and delivery.",
     hero("About us", "Why Neon Adda",
          "The honest version: what these signs are made of, what they cost to run, and what we'll do if something goes wrong.")
     + """
  <section class="section section--tight" style="padding-top:0">
    <div class="shell">
      <div class="stats reveal">
        <div class="stat"><b data-ph>1,200+</b><span>Signs made to order</span></div>
        <div class="stat"><b data-ph>4.9/5</b><span>Average customer rating</span></div>
        <div class="stat"><b data-ph>2 yrs</b><span>Warranty on tube &amp; adaptor</span></div>
        <div class="stat"><b data-ph>5–8 days</b><span>Typical delivery, India-wide</span></div>
      </div>
      <p style="color:var(--muted-2);font-size:.8rem;margin-top:1rem">
        Figures current as of <span data-ph>2026</span>.
      </p>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="shell">
      <div class="prose">
        <h2>LED neon, not glass</h2>
        <p>Our signs use LED neon flex — a flexible silicone tube lit from inside — mounted on laser-cut clear acrylic. Compared with traditional glass neon it uses roughly <span data-ph>a tenth</span> of the electricity, stays cool to touch, won't shatter, and survives being couriered across the country. It's safe in a nursery and safe in a busy café.</p>

        <h2>What it costs to run</h2>
        <p>A medium sign draws about <span data-ph>18 watts</span> — less than an old incandescent bulb. Leaving it on for five hours a night works out to a few rupees a month.</p>

        <h2>What the warranty covers</h2>
        <p><span data-ph>Two years</span> on the LED tubing and the adaptor. If the light fails or dims unevenly in normal indoor use, we repair or replace it. Physical damage, water damage and DIY rewiring aren't covered — but message us anyway, because repairs are usually cheap.</p>

        <h2>Made to order, one at a time</h2>
        <ul>
          <li><strong>Hand-bent tube.</strong> Every curve is shaped by a person, not a machine.</li>
          <li><strong>Cut-to-shape backing.</strong> The acrylic follows your text outline, so it disappears against the wall.</li>
          <li><strong>Tested lit.</strong> Each sign runs for <span data-ph>24 hours</span> before it's packed.</li>
          <li><strong>Ready to hang.</strong> Screws, wall plugs, a paper drilling template and the adaptor are all in the box.</li>
        </ul>

        <h2>If it arrives damaged</h2>
        <p>Send us a photo within <span data-ph>48 hours</span> and we'll remake it at no cost. We've shipped enough of these to know courier handling isn't always gentle, so the packing is over-engineered on purpose.</p>
      </div>
    </div>
  </section>
""" + CTA_BAND)

# =====================================================================
# FAQ
# =====================================================================
faqs = [
    ("How much does a custom neon sign cost?",
     'Signs start at <span data-ph>₹2,250</span>. Price depends on size and how many characters you use — the customizer shows your exact total as you type, including shipping and GST.'),
    ("What size should I choose?",
     'Small (40 × 20 cm) suits a desk, shelf or bedside. Medium (60 × 30 cm) is our most popular and sits well above a bed or sofa. Large (90 × 45 cm) is for feature walls, events and shopfronts. Not sure? Send a photo of your wall on WhatsApp and we\'ll mark up the scale.'),
    ("Is this real neon gas?",
     'No, and that\'s deliberate. These are LED neon flex signs. They look the same lit, but they use far less power, stay cool, won\'t shatter, and are safe around children and pets.'),
    ("How long does delivery take?",
     'Usually <span data-ph>5–8 days</span> total: <span data-ph>3–4 days</span> to build after you approve the proof, then <span data-ph>2–4 days</span> in transit. Need it faster for an event? Tell us the date and we\'ll say honestly whether we can make it.'),
    ("Can I see it before I pay?",
     'Yes. We send a free design proof — your words, your colour, often mocked up on a photo of your own wall. Ask for as many changes as you need. Nothing is made until you approve it.'),
    ("Can you make a logo or handwriting?",
     'Yes. Send the artwork or a clear photo of the handwriting on WhatsApp. Logos are quoted individually because the tube path is more complex, but the proof is still free.'),
    ("How do I hang it?",
     'Every sign ships with screws, wall plugs and a paper drilling template. Line up the template, drill, screw in, plug it in. Most people do it in ten minutes. The acrylic backing has pre-drilled holes at the corners.'),
    ("Can I use it outdoors?",
     'The standard build is indoor-only. We can make an outdoor-rated version with a sealed adaptor and weatherproofing — message us for a quote, and mention whether it\'ll be exposed to direct rain.'),
    ("What if it stops working?",
     '<span data-ph>Two-year warranty</span> on the tube and adaptor. Message us with a short video of the fault and we\'ll repair or replace it. Out-of-warranty repairs are usually inexpensive.'),
    ("Do you take returns?",
     'Custom signs are made to your words, so they can\'t be resold — we can\'t accept returns on change of mind. If a sign arrives damaged or doesn\'t match the approved proof, we remake it free. Send a photo within <span data-ph>48 hours</span>.'),
    ("Do you offer bulk or corporate orders?",
     'Yes — cafés, retail chains, event companies and wedding planners. <span data-ph>Five or more</span> signs gets bulk pricing. Email us with quantities and we\'ll send a quote.'),
    ("Which payment methods do you accept?",
     'UPI, all major cards, net banking and wallets. <span data-ph>Cash on delivery isn\'t available on custom orders</span>, since each one is made specifically for you.'),
]

acc = "\n".join(f"""
        <div class="acc__item" data-open="false">
          <button class="acc__q" aria-expanded="false">
            {q}
            <svg class="acc__ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          </button>
          <div class="acc__a"><p>{a}</p></div>
        </div>""" for q, a in faqs)

page("faq.html",
     "FAQ — sizes, delivery, warranty | Neon Adda",
     "Answers on pricing, sizing, delivery times, warranty, hanging, outdoor use and returns for custom LED neon signs from Neon Adda.",
     hero("About us", "Questions, answered",
          "If yours isn't here, message us on WhatsApp — we usually reply within a couple of hours during working days.")
     + f"""
  <section class="section" style="padding-top:0">
    <div class="shell" style="max-width:820px">
      <div class="acc">{acc}
      </div>
    </div>
  </section>
""" + CTA_BAND)

# =====================================================================
# CONTACT
# =====================================================================
page("contact.html",
     "Contact Neon Adda — WhatsApp, email and studio",
     "Talk to Neon Adda about a custom LED neon sign. WhatsApp, email or visit the workshop. Free design proof before you pay.",
     hero("Contact", "Talk to us",
          "Most orders start with a message. Send your idea, your wall photo, or just a question — there's no obligation and the design proof is free.")
     + """
  <section class="section" style="padding-top:0">
    <div class="shell">
      <div class="contact">

        <div>
          <div class="contact__card" style="margin-bottom:1rem">
            <h3 style="margin-bottom:.4rem">Fastest: WhatsApp</h3>
            <p style="color:var(--muted);font-size:.94rem;margin-bottom:1.1rem">
              Send a photo of your wall and the words you want. We'll reply with a mockup and a price.
            </p>
            <a class="btn btn--wa btn--block" data-wa="Hi Neon Adda, I'd like to ask about a custom neon sign." href="#">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1a12 12 0 01-5.6-4.9c-.4-.7-.8-1.5-.8-2.3 0-.9.4-1.3.7-1.6.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4-.1.5l-.4.5c-.1.2-.3.3-.1.6a8 8 0 003.7 3.2c.3.1.5.1.6-.1l.8-1c.2-.2.3-.2.6-.1l1.8.9c.3.1.5.2.5.3z"/></svg>
              Message on WhatsApp
            </a>
          </div>

          <div class="contact__card">
            <ul class="contact__list">
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.2a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"/></svg>
                <div><b>Phone</b><a data-tel href="#"><span data-biz-phone data-ph>+91 90000 00000</span></a></div>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/></svg>
                <div><b>Email</b><a data-mail href="#"><span data-biz-email data-ph>hello@neonadda.in</span></a></div>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <div><b>Workshop</b><span data-biz-address data-ph>Studio address line 1, Kolkata, West Bengal 700000</span></div>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                <div><b>Hours</b><span data-biz-hours data-ph>Mon–Sat, 10am – 7pm IST</span></div>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                <div><b>Instagram</b><a data-ig href="#">@neonadda</a></div>
              </li>
            </ul>
          </div>
        </div>

        <div class="contact__card">
          <h3 style="margin-bottom:1.2rem">Or send an enquiry</h3>
          <form id="enquiry" novalidate>
            <div class="cz__field">
              <label class="cz__label" for="fName"><span>Your name</span></label>
              <input class="input" id="fName" name="name" type="text" autocomplete="name" required>
            </div>
            <div class="cz__field">
              <label class="cz__label" for="fPhone"><span>WhatsApp number</span></label>
              <input class="input" id="fPhone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+91" required>
            </div>
            <div class="cz__field">
              <label class="cz__label" for="fOcc"><span>What's it for?</span></label>
              <select class="input" id="fOcc" name="occasion">
                <option>Birthday</option><option>Wedding</option><option>Baby shower</option>
                <option>Home decor</option><option>Business or café</option><option>Something else</option>
              </select>
            </div>
            <div class="cz__field">
              <label class="cz__label" for="fMsg"><span>Your idea</span></label>
              <textarea class="input" id="fMsg" name="message" rows="4" placeholder="The words you want, roughly what size, and when you need it."></textarea>
            </div>
            <button class="btn btn--primary btn--block" type="submit">Send enquiry</button>
            <p class="fine">
              We reply within <span data-ph>one working day</span>. Your details are never shared.
            </p>
          </form>
          <p id="formNote" role="status" style="display:none;margin-top:1rem;padding:.9rem 1rem;border-radius:10px;background:rgba(74,222,128,.12);border:1px solid rgba(74,222,128,.4);font-size:.9rem"></p>
        </div>

      </div>
    </div>
  </section>

  <script>
  // Demo only — no backend. Hands off to WhatsApp so the enquiry still reaches someone.
  document.getElementById('enquiry')?.addEventListener('submit', function(e){
    e.preventDefault();
    // NB: form.name is the form's own attribute, so fields must come from .elements
    var f = e.target.elements, note = document.getElementById('formNote');
    if(!f['name'].value.trim() || !f['phone'].value.trim()){
      note.style.display='block';
      note.style.background='rgba(255,90,90,.12)';
      note.style.borderColor='rgba(255,90,90,.45)';
      note.textContent='Add your name and WhatsApp number so we can reply.';
      return;
    }
    note.style.display='block';
    note.textContent='Thanks — opening WhatsApp so this reaches us straight away.';
    var msg = 'New enquiry from the website\\n\\nName: '+f['name'].value+'\\nPhone: '+f['phone'].value+
              '\\nOccasion: '+f['occasion'].value+'\\nIdea: '+(f['message'].value||'—');
    setTimeout(function(){ window.open('https://wa.me/'+BIZ.whatsapp+'?text='+encodeURIComponent(msg),'_blank'); }, 600);
    e.target.reset();
  });
  </script>
""")

print("\nAll pages generated.")
