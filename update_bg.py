import re

with open('sections/premium-homepage.liquid', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '<section style="background: var(--void); padding: 40px 5% 60px; display: flex; justify-content: center;">',
    '<section style="background: #000; padding: 40px 5% 60px; display: flex; justify-content: center;">'
)

content = content.replace(
    '<div class="marquee-strip">',
    '<div class="marquee-strip" style="background: #fff; color: #000; border-top: 1px solid #eee; border-bottom: 1px solid #eee;">'
)

content = content.replace(
    '<section class="customizer" id="customizer">',
    '<section class="customizer" id="customizer" style="background: #fff; color: #000;">'
)
content = content.replace(
    '<h2>Type it. Light it. <span class="accent">See it glow.</span></h2>',
    '<h2 style="color: #000;">Type it. Light it. <span class="accent">See it glow.</span></h2>'
)
content = content.replace(
    '<h3>Build your sign</h3>',
    '<h3 style="color: #000;">Build your sign</h3>'
)
content = content.replace(
    '<p>Write your text, pick a font and colour',
    '<p style="color: #555;">Write your text, pick a font and colour'
)
content = content.replace(
    '<p class="sub">This is a working demo',
    '<p class="sub" style="color: #555;">This is a working demo'
)

content = content.replace(
    '<section id="categories">',
    '<section id="categories" style="background: #000; color: #fff; padding-top: 80px; padding-bottom: 80px;">'
)

content = content.replace(
    '<section id="testimonials">',
    '<section id="testimonials" style="background: #000; color: #fff; padding-top: 80px; padding-bottom: 80px;">'
)

content = content.replace(
    '<section id="cta">',
    '<section id="cta" style="background: #fff; color: #000; padding-top: 80px; padding-bottom: 80px;">'
)
content = content.replace(
    '<h2>Let\'s light up your wall.</h2>',
    '<h2 style="color: #000;">Let\'s light up your wall.</h2>'
)
content = content.replace(
    '<p>Every project begins with a story.',
    '<p style="color: #555;">Every project begins with a story.'
)

with open('sections/premium-homepage.liquid', 'w', encoding='utf-8') as f:
    f.write(content)
