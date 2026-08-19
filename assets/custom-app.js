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
  const autoSizeIndicator = document.getElementById('autoSizeIndicator');

  // Fallback defaults if config is missing
  const config = window.neonConfig || {
    pricing: { regularChars: 8, mediumChars: 12, basePrice: 1500, addonMedium: 800, addonLarge: 1000 },
    whatsappNumber: '919876543210'
  };

  let state = { color: '#ff2f92', price: config.pricing.basePrice, on: true };
  let currentFontName = 'Great Vibes';
  let currentColorName = 'Signal Pink';
  let currentSizeName = 'Regular';

  // Initialize color from active chip
  const activeColorChip = document.querySelector('.color-chip.active');
  if (activeColorChip) {
    state.color = activeColorChip.dataset.color;
    currentColorName = activeColorChip.dataset.name || 'Signal Pink';
  }

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
  }

  function updateText() {
    if (!textInput || !preview) return;
    const val = textInput.value || 'Good Vibes';
    preview.textContent = val;
    
    // Auto pricing logic
    const charLen = textInput.value.length;
    if (charLen <= config.pricing.regularChars) {
      currentSizeName = 'Regular';
      state.price = config.pricing.basePrice;
      preview.style.fontSize = '42px';
    } else if (charLen <= config.pricing.mediumChars) {
      currentSizeName = 'Medium';
      state.price = config.pricing.basePrice + config.pricing.addonMedium;
      preview.style.fontSize = '64px';
    } else {
      currentSizeName = 'Large';
      state.price = config.pricing.basePrice + config.pricing.addonLarge;
      preview.style.fontSize = '86px';
    }

    if (autoSizeIndicator) autoSizeIndicator.textContent = currentSizeName;
    if (priceVal) priceVal.textContent = state.price.toLocaleString('en-IN');
    if (charCount) charCount.textContent = `${charLen} / 24`;
    
    updateWhatsAppLink();
  }

  function updateWhatsAppLink() {
    if (!whatsappOrderBtn) return;
    const text = textInput ? (textInput.value || 'Good Vibes') : 'Good Vibes';
    let msg = `Hi Neon Adda! I want to order a custom neon sign:\n• Text: "${text}"\n• Font: ${currentFontName}\n• Color: ${currentColorName}\n• Size: ${currentSizeName}\n• Estimated Price: ₹${state.price.toLocaleString('en-IN')}`;
    msg += `\n\nPlease confirm availability and details!`;
    
    whatsappOrderBtn.href = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(msg)}`;
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

  const customizerBg = document.getElementById('customizer-bg');
  if (bgRow && customizerBg) {
    bgRow.addEventListener('click', (e) => {
      const chip = e.target.closest('.bg-chip');
      if (!chip) return;
      [...bgRow.children].forEach(c => {
        c.classList.remove('active');
        c.style.border = '1px solid var(--line)';
      });
      chip.classList.add('active');
      chip.style.border = '2px solid var(--cyan)';
      
      const bg = chip.dataset.bg;
      if (bg === 'brick') {
        customizerBg.style.backgroundImage = '';
        customizerBg.style.opacity = '1';
      } else {
        customizerBg.style.backgroundImage = `url('${bg}')`;
        customizerBg.style.backgroundSize = 'cover';
        customizerBg.style.backgroundPosition = 'center';
        customizerBg.style.opacity = '0.4';
      }
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
      console.log('Default variantId from button:', variantId);
      console.log('Available variants map:', window.customizerVariants);
      console.log('Current Size Name:', currentSizeName);
      
      if (window.customizerVariants && currentSizeName) {
        // Map 'Regular' to 'Small' for Shopify variant matching
        let searchName = currentSizeName.toLowerCase();
        if (searchName === 'regular') searchName = 'small';
        
        console.log('Searching for variant:', searchName);
        const matchingId = window.customizerVariants[searchName];
        if (matchingId) {
          variantId = matchingId;
          console.log('Found matching variantId:', variantId);
        } else {
          console.log('No matching variant found, falling back to default.');
        }
      }

      const text = textInput ? (textInput.value || 'Good Vibes') : 'Good Vibes';
      
      const properties = {
        'Custom Text': text,
        'Font Style': currentFontName,
        'Glow Color': currentColorName,
        'Size': currentSizeName,
        'Customizer Price': `₹${state.price.toLocaleString('en-IN')}`
      };

      console.log('Payload being sent:', { id: variantId, quantity: 1, properties });

      addToCartBtn.textContent = 'Adding...';
      addToCartBtn.disabled = true;

      try {
        const payload = {
          items: [{
            id: variantId ? parseInt(variantId, 10) : undefined,
            quantity: 1,
            properties: properties
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
          const errData = await res.json().catch(() => ({}));
          console.error('Add to cart failed:', errData);
          if (errData.description && errData.description.includes('sold out')) {
            alert(`Sorry, this product is currently out of stock.\nDebug ID: ${variantId}\nError: ${errData.description}`);
          } else {
            alert('An error occurred while adding to cart. ' + (errData.description || 'Please try again.'));
          }
        }
      } catch (err) {
        console.error('Error adding to cart:', err);
        alert('A network error occurred. Please try again.');
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
