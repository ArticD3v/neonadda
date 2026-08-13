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

  let state = { color:'#ff2f92', size:64, price:3600, on:true };

  function hexToRgb(hex){
    const v = hex.replace('#','');
    const n = parseInt(v.length===3 ? v.split('').map(c=>c+c).join('') : v, 16);
    return `${(n>>16)&255},${(n>>8)&255},${n&255}`;
  }

  function applyGlow(){
    if(!preview) return;
    const rgb = hexToRgb(state.color);
    preview.style.color = state.color;
    preview.style.textShadow = `
      0 0 6px rgba(${rgb},.95),
      0 0 16px rgba(${rgb},.85),
      0 0 36px rgba(${rgb},.55),
      0 0 72px rgba(${rgb},.3)`;
    preview.style.fontSize = state.size + 'px';
  }

  function updateText(){
    if(!textInput || !preview) return;
    const val = textInput.value || 'Your Text';
    preview.textContent = val;
    if (charCount) charCount.textContent = `${val.length} / 24`;
  }

  if (textInput) textInput.addEventListener('input', updateText);

  if (fontRow) {
    fontRow.addEventListener('click', (e)=>{
      const chip = e.target.closest('.font-chip');
      if(!chip) return;
      [...fontRow.children].forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      preview.style.fontFamily = chip.dataset.font;
    });
  }

  if (colorRow) {
    colorRow.addEventListener('click', (e)=>{
      const chip = e.target.closest('.color-chip');
      if(!chip) return;
      [...colorRow.children].forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      state.color = chip.dataset.color;
      if (colorName) colorName.textContent = chip.dataset.name;
      applyGlow();
    });
  }

  if (sizeRow) {
    sizeRow.addEventListener('click', (e)=>{
      const chip = e.target.closest('.size-chip');
      if(!chip) return;
      [...sizeRow.children].forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      state.size = parseInt(chip.dataset.size,10);
      state.price = parseInt(chip.dataset.price,10);
      applyGlow();
      if (priceVal) priceVal.textContent = state.price.toLocaleString('en-IN');
    });
  }

  if (bgRow) {
    bgRow.addEventListener('click', (e)=>{
      const chip = e.target.closest('.bg-chip');
      if(!chip) return;
      [...bgRow.children].forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      if(chip.dataset.bg === 'light'){
        previewPane.style.setProperty('--brick-1', '#2a2630');
        previewPane.style.setProperty('--brick-2', '#221f28');
        previewPane.style.setProperty('--mortar', '#161319');
      } else {
        previewPane.style.removeProperty('--brick-1');
        previewPane.style.removeProperty('--brick-2');
        previewPane.style.removeProperty('--mortar');
      }
    });
  }

  if (powerToggle) {
    powerToggle.addEventListener('click', ()=>{
      state.on = !state.on;
      preview.classList.toggle('neon-off', !state.on);
      preview.classList.toggle('neon-on', state.on);
      powerDot.classList.toggle('on', state.on);
      powerLabel.textContent = state.on ? 'Power on' : 'Power off';
    });
  }

  applyGlow();
  updateText();
