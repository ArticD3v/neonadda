document.addEventListener('DOMContentLoaded', () => {
  const preview = document.getElementById('neonPreview');
  const textInput = document.getElementById('textInput');
  const charCount = document.getElementById('charCount');
  const fontRow = document.getElementById('fontRow');
  const colorRow = document.getElementById('colorRow');
  const colorName = document.getElementById('colorName');
  const sizeRow = document.getElementById('sizeRow');
  const bgRow = document.getElementById('bgRow');
  const priceVal = document.getElementById('priceVal');
  const powerToggle = document.getElementById('powerToggle');
  const powerDot = document.getElementById('powerDot');
  const powerLabel = document.getElementById('powerLabel');
  const previewPane = document.querySelector('.preview-pane');
  const addToCartBtn = document.getElementById('addToCartBtn');
  const whatsappOrderBtn = document.getElementById('whatsappOrderBtn');

  let state = { color: '#ff2f92', size: 64, price: 3600, on: true };
  let currentFontName = 'Great Vibes';
  let currentColorName = 'Signal Pink';
  let currentSizeName = 'Medium';
  let currentWallName = 'Dark brick';

  function hexToRgb(hex) {
    const v = hex.replace('#', '');
    const n = parseInt(v.length === 3 ? v.split('').map(c => c + c).join('') : v, 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  }

  function applyGlow() {
    if (!preview) return;
    const rgb = hexToRgb(state.color);
    preview.style.color = state.color;
    preview.style.textShadow = `
      0 0 6px rgba(${rgb},.95),
      0 0 16px rgba(${rgb},.85),
      0 0 36px rgba(${rgb},.55),
      0 0 72px rgba(${rgb},.3)`;
    preview.style.fontSize = state.size + 'px';
  }

  function updateText() {
    if (!textInput || !preview) return;
    const val = textInput.value || 'Good Vibes';
    preview.textContent = val;
    if (charCount) charCount.textContent = `${textInput.value.length} / 24`;
    updateWhatsAppLink();
  }

  function updateWhatsAppLink() {
    if (!whatsappOrderBtn) return;
    const text = textInput ? (textInput.value || 'Good Vibes') : 'Good Vibes';
    const msg = `Hi Neon Adda! I want to order a custom neon sign:\n• Text: "${text}"\n• Font: ${currentFontName}\n• Color: ${currentColorName}\n• Size: ${currentSizeName}\n• Wall: ${currentWallName}\n• Estimated Price: ₹${state.price.toLocaleString('en-IN')}\n\nPlease confirm availability and details!`;
    whatsappOrderBtn.href = `https://wa.me/919876543210?text=${encodeURIComponent(msg)}`;
  }

  if (textInput) {
    textInput.addEventListener('input', updateText);
  }

  const selectedFontName = document.getElementById('selectedFontName');

  if (fontRow) {
    fontRow.addEventListener('click', (e) => {
      const chip = e.target.closest('.font-chip');
      if (!chip) return;
      [...fontRow.children].forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      if (preview) preview.style.fontFamily = chip.dataset.font;
      currentFontName = chip.dataset.name || chip.dataset.font.split(',')[0].replace(/'/g, '');
      if (selectedFontName) selectedFontName.textContent = currentFontName;
      updateWhatsAppLink();
    });
  }

  if (colorRow) {
    colorRow.addEventListener('click', (e) => {
      const chip = e.target.closest('.color-chip');
      if (!chip) return;
      [...colorRow.children].forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.color = chip.dataset.color;
      currentColorName = chip.dataset.name || 'Signal Pink';
      if (colorName) colorName.textContent = currentColorName;
      applyGlow();
      updateWhatsAppLink();
    });
  }

  if (sizeRow) {
    sizeRow.addEventListener('click', (e) => {
      const chip = e.target.closest('.size-chip');
      if (!chip) return;
      [...sizeRow.children].forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.size = parseInt(chip.dataset.size, 10);
      state.price = parseInt(chip.dataset.price, 10);
      const sNameEl = chip.querySelector('.s-name');
      currentSizeName = sNameEl ? sNameEl.textContent.trim() : 'Medium';
      applyGlow();
      if (priceVal) priceVal.textContent = state.price.toLocaleString('en-IN');
      updateWhatsAppLink();
    });
  }

  if (bgRow) {
    bgRow.addEventListener('click', (e) => {
      const chip = e.target.closest('.bg-chip');
      if (!chip) return;
      [...bgRow.children].forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentWallName = chip.textContent.trim();
      if (chip.dataset.bg === 'light') {
        if (previewPane) {
          previewPane.style.setProperty('--brick-1', '#2a2630');
          previewPane.style.setProperty('--brick-2', '#221f28');
          previewPane.style.setProperty('--mortar', '#161319');
        }
      } else {
        if (previewPane) {
          previewPane.style.removeProperty('--brick-1');
          previewPane.style.removeProperty('--brick-2');
          previewPane.style.removeProperty('--mortar');
        }
      }
      updateWhatsAppLink();
    });
  }

  if (powerToggle) {
    powerToggle.addEventListener('click', () => {
      state.on = !state.on;
      if (preview) {
        preview.classList.toggle('neon-off', !state.on);
        preview.classList.toggle('neon-on', state.on);
      }
      if (powerDot) powerDot.classList.toggle('on', state.on);
      if (powerLabel) powerLabel.textContent = state.on ? 'Power on' : 'Power off';
    });
  }

  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      let variantId = addToCartBtn.dataset.variantId;
      // If we have a map of variants, try to find the one matching the selected size name
      if (window.customizerVariants && currentSizeName) {
        const matchingId = window.customizerVariants[currentSizeName.toLowerCase()];
        if (matchingId) {
          variantId = matchingId;
        }
      }

      const text = textInput ? (textInput.value || 'Good Vibes') : 'Good Vibes';

      addToCartBtn.textContent = 'Adding...';
      addToCartBtn.disabled = true;

      try {
        const payload = {
          items: [{
            id: variantId ? parseInt(variantId, 10) : undefined,
            quantity: 1,
            properties: {
              'Custom Text': text,
              'Font Style': currentFontName,
              'Glow Color': currentColorName,
              'Size': currentSizeName,
              'Wall Backing': currentWallName,
              'Customizer Price': `₹${state.price.toLocaleString('en-IN')}`
            }
          }]
        };

        const res = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          window.location.href = '/cart';
        } else {
          console.error('Add to cart failed:', await res.text());
          window.location.href = '/cart';
        }
      } catch (err) {
        console.error('Error adding to cart:', err);
        window.location.href = '/cart';
      } finally {
        addToCartBtn.textContent = 'Add to cart';
        addToCartBtn.disabled = false;
      }
    });
  }

  if (colorName) colorName.textContent = currentColorName;
  applyGlow();
  updateText();
  updateWhatsAppLink();
});
