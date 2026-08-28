function initNeonCustomizer() {
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
  const addToCartBtn = document.getElementById('addToCartBtn');
  const whatsappOrderBtn = document.getElementById('whatsappOrderBtn');
  const autoSizeIndicator = document.getElementById('autoSizeIndicator');

  if (!preview || !textInput) return;

  const config = window.neonConfig || {
    pricing: { regularChars: 8, mediumChars: 12, basePrice: 1500, addonMedium: 800, addonLarge: 1000 },
    whatsappNumber: '917095844495'
  };

  let state = { color: '#FFFFFF', price: config.pricing.basePrice, on: true };
  let currentFontName = 'Neon Flow';
  let currentColorName = 'White';
  let currentSizeName = 'Regular';

  const activeColorChip = document.querySelector('.color-chip.active');
  if (activeColorChip) {
    state.color = activeColorChip.dataset.color;
    currentColorName = activeColorChip.dataset.name || 'White';
  }

  function hexToRgb(hex) {
    if(!hex) return '255,255,255';
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
    const tInput = document.getElementById('textInput');
    const pView = document.getElementById('neonPreview');
    if (!tInput || !pView) return;
    
    const val = tInput.value || 'Your Sign Here';
    pView.textContent = val;
    
    const liveConfig = window.neonConfig || config;
    const charLen = tInput.value.length;
    
    if (charLen <= liveConfig.pricing.regularChars) {
      currentSizeName = 'Regular';
      state.price = liveConfig.pricing.basePrice;
      pView.style.fontSize = window.innerWidth <= 768 ? '32px' : '42px';
    } else if (charLen <= liveConfig.pricing.mediumChars) {
      currentSizeName = 'Medium';
      state.price = liveConfig.pricing.basePrice + liveConfig.pricing.addonMedium;
      pView.style.fontSize = window.innerWidth <= 768 ? '42px' : '64px';
    } else {
      currentSizeName = 'Large';
      state.price = liveConfig.pricing.basePrice + liveConfig.pricing.addonLarge;
      pView.style.fontSize = window.innerWidth <= 768 ? '52px' : '86px';
    }

    const asInd = document.getElementById('autoSizeIndicator');
    const pVal = document.getElementById('priceVal');
    const cCount = document.getElementById('charCount');
    if (asInd) asInd.textContent = currentSizeName;
    if (pVal) pVal.textContent = state.price.toLocaleString('en-IN');
    if (cCount) cCount.textContent = `${charLen} / 24`;
    
    const textError = document.getElementById('textError');
    if (tInput.value.trim().length > 0) {
      if (textError) textError.style.display = 'none';
      tInput.style.borderColor = 'var(--line)';
    }

    updateWhatsAppLink(liveConfig);
  }

  function updateWhatsAppLink(liveConfig) {
    const wBtn = document.getElementById('whatsappOrderBtn');
    const tInput = document.getElementById('textInput');
    if (!wBtn) return;
    const text = tInput ? (tInput.value || 'Your Sign Here') : 'Your Sign Here';
    
    let msg = "Hi Neon Adda! I want to order a custom neon sign:\n";
    msg += "• Text: \"" + text + "\"\n";
    msg += "• Font: " + currentFontName + "\n";
    msg += "• Color: " + currentColorName + "\n";
    msg += "• Size: " + currentSizeName + "\n";
    msg += "• Estimated Price: INR " + state.price.toLocaleString('en-IN') + "\n\n";
    msg += "Please confirm availability and details!";
    
    wBtn.dataset.href = `https://wa.me/${liveConfig.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  }

  function validateInput() {
    const tInput = document.getElementById('textInput');
    if (!tInput) return false;
    if (!tInput.value || tInput.value.trim() === "") {
      const textError = document.getElementById('textError');
      if (textError) textError.style.display = 'block';
      tInput.style.borderColor = '#ff5555';
      tInput.focus();
      return false;
    }
    return true;
  }

  const wBtn = document.getElementById('whatsappOrderBtn');
  if (wBtn) {
    const newBtn = wBtn.cloneNode(true);
    wBtn.replaceWith(newBtn);
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (validateInput()) {
        window.open(newBtn.dataset.href, '_blank');
      }
    });
  }

  const tInput = document.getElementById('textInput');
  if (tInput) {
    const newTextInput = tInput.cloneNode(true);
    tInput.replaceWith(newTextInput);
    newTextInput.addEventListener('input', updateText);
  }

  const fRow = document.getElementById('fontRow');
  if (fRow) {
    const newFRow = fRow.cloneNode(true);
    fRow.replaceWith(newFRow);
    newFRow.addEventListener('click', (e) => {
      const chip = e.target.closest('.font-chip');
      if (!chip) return;
      [...newFRow.children].forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const pView = document.getElementById('neonPreview');
      if (pView) pView.style.fontFamily = chip.dataset.font;
      currentFontName = chip.dataset.name || chip.dataset.font.split(',')[0].replace(/'/g, '');
      const sFontName = document.getElementById('selectedFontName');
      if (sFontName) sFontName.textContent = currentFontName;
      updateWhatsAppLink(window.neonConfig || config);
    });
  }

  const cRow = document.getElementById('colorRow');
  if (cRow) {
    const newCRow = cRow.cloneNode(true);
    cRow.replaceWith(newCRow);
    newCRow.addEventListener('click', (e) => {
      const chip = e.target.closest('.color-chip');
      if (!chip) return;
      [...newCRow.children].forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.color = chip.dataset.color;
      currentColorName = chip.dataset.name || 'White';
      const cName = document.getElementById('colorName');
      if (cName) cName.textContent = currentColorName;
      applyGlow();
      updateWhatsAppLink(window.neonConfig || config);
    });
  }

  const customizerBg = document.getElementById('customizer-bg');
  const bRow = document.getElementById('bgRow');
  if (bRow && customizerBg) {
    const newBRow = bRow.cloneNode(true);
    bRow.replaceWith(newBRow);
    newBRow.addEventListener('click', (e) => {
      const chip = e.target.closest('.bg-chip');
      if (!chip) return;
      [...newBRow.children].forEach(c => {
        c.classList.remove('active');
        c.style.border = '1px solid var(--line)';
      });
      chip.classList.add('active');
      chip.style.border = '2px solid var(--cyan)';
      
      const bg = chip.dataset.bg;
      customizerBg.style.backgroundImage = `url('${bg}')`;
    });
  }

  const pToggle = document.getElementById('powerToggle');
  if (pToggle) {
    const newPower = pToggle.cloneNode(true);
    pToggle.replaceWith(newPower);
    newPower.addEventListener('click', () => {
      state.on = !state.on;
      const pView = document.getElementById('neonPreview');
      if (pView) {
        pView.classList.toggle('neon-off', !state.on);
        pView.classList.toggle('neon-on', state.on);
      }
      const pDot = document.getElementById('powerDot');
      if (pDot) pDot.classList.toggle('on', state.on);
      const pLabel = document.getElementById('powerLabel');
      if (pLabel) pLabel.textContent = state.on ? 'Power on' : 'Power off';
    });
  }

  const aCartBtn = document.getElementById('addToCartBtn');
  if (aCartBtn) {
    const newCartBtn = aCartBtn.cloneNode(true);
    aCartBtn.replaceWith(newCartBtn);
    newCartBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      if (!validateInput()) return;
      
      let variantId = newCartBtn.dataset.variantId;
      if (window.customizerVariants && currentSizeName) {
        let searchName = currentSizeName.toLowerCase();
        if (searchName === 'regular') searchName = 'small';
        
        const matchingId = window.customizerVariants[searchName];
        if (matchingId) {
          variantId = matchingId;
        }
      }

      const tInput = document.getElementById('textInput');
      const text = tInput ? (tInput.value || 'Your Sign Here') : 'Your Sign Here';
      
      const properties = {
        'Custom Text': text,
        'Font Style': currentFontName,
        'Glow Color': currentColorName,
        'Size': currentSizeName,
        'Customizer Price': `INR ${state.price.toLocaleString('en-IN')}`
      };

      newCartBtn.textContent = 'Adding...';
      newCartBtn.disabled = true;

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
          alert('An error occurred while adding to cart. ' + (errData.description || 'Please try again.'));
        }
      } catch (err) {
        alert('A network error occurred. Please try again.');
      } finally {
        newCartBtn.textContent = 'Add to cart';
        newCartBtn.disabled = false;
      }
    });
  }

  const cName = document.getElementById('colorName');
  if (cName) cName.textContent = currentColorName;
  applyGlow();
  updateText();
}

document.addEventListener('DOMContentLoaded', initNeonCustomizer);
document.addEventListener('shopify:section:load', initNeonCustomizer);

window.addEventListener('resize', () => {
  const tInput = document.getElementById('textInput');
  if(tInput) tInput.dispatchEvent(new Event('input'));
});

