// ===================================================================
// 🎮 PRESET MANAGER MODULE v1.2.0 - ROUNDS LOGIC MIGLIORATA
// ===================================================================

const PresetManagerModule = (() => {
  // Preset di default con supporto rounds migliorato
  const DEFAULT_PRESETS = {
    scala40: { 
      name: 'Scala 40', 
      mode: 'min', 
      target: 101, 
      description: '🃏 Scala 40: Perde chi raggiunge per primo 101 punti.',
      isDefault: true,
      category: 'carte'
    },
    burraco: { 
      name: 'Burraco', 
      mode: 'max', 
      target: 2005, 
      description: '🃏 Burraco: Vince chi raggiunge 2005 punti.',
      isDefault: true,
      category: 'carte'
    },
    briscola: { 
      name: 'Briscola', 
      mode: 'max', 
      target: 11, 
      description: '🃏 Briscola: Vince chi arriva a 11 vittorie.',
      isDefault: true,
      category: 'carte'
    },
    scopa: { 
      name: 'Scopa', 
      mode: 'rounds',
      roundMode: 'max', // 🆕 Chi fa PIÙ punti vince il round
      target: 21, // 🆕 Round finisce a 21 punti
      roundsTarget: 2, // 🆕 Vince chi vince 2 round su 3
      description: '🃏 Scopa: Ogni round finisce a 21 punti. Vince chi vince 2 round.',
      isDefault: true,
      category: 'carte'
    },
    pinnacola: { 
      name: 'Pinnacola', 
      mode: 'max', 
      target: 1500, 
      description: '🃏 Pinnacola: Vince chi totalizza 1500 punti.',
      isDefault: true,
      category: 'carte'
    },
    tennis: {
      name: 'Tennis (Set)',
      mode: 'rounds',
      roundMode: 'max',
      target: 6, // Set finisce a 6 game
      roundsTarget: 2, // Best-of-3 set
      description: '🎾 Tennis: Ogni set finisce a 6 game. Vince chi vince 2 set.',
      isDefault: true,
      category: 'sport'
    },
    volleyball: {
      name: 'Pallavolo (Set)',
      mode: 'rounds',
      roundMode: 'max',
      target: 25, // Set finisce a 25 punti
      roundsTarget: 3, // Best-of-5 set
      description: '🏐 Pallavolo: Ogni set finisce a 25 punti. Vince chi vince 3 set.',
      isDefault: true,
      category: 'sport'
    },
    poker_mani: {
      name: 'Poker (Mani)',
      mode: 'rounds',
      roundMode: 'max',
      target: 10000, // Mano finisce a 10k chips
      roundsTarget: 5, // Vince chi vince 5 mani
      description: '🃏 Poker: Ogni mano finisce a 10k chips. Vince chi vince 5 mani.',
      isDefault: true,
      category: 'carte'
    },
    freccette501: { 
      name: 'Freccette 501', 
      mode: 'min', 
      target: 0, 
      description: '🎯 Freccette 501: Si parte da 501, vince chi arriva esattamente a 0.',
      isDefault: true,
      category: 'altri'
    },
    freccette301: { 
      name: 'Freccette 301', 
      mode: 'min', 
      target: 0, 
      description: '🎯 Freccette 301: Si parte da 301, vince chi arriva esattamente a 0.',
      isDefault: true,
      category: 'altri'
    }
  };

  const PRESET_STORAGE_KEY = 'custom_presets';
  const FREE_CUSTOM_LIMIT = 1; // ✅ Free users possono creare 1 solo preset custom
  
  const CATEGORY_ICONS = {
    carte: '🃏',
    tavolo: '🎲',
    sport: '⚽',
    altri: '🎯',
    custom: '⭐'
  };

  const loadCustomPresets = () => {
    try {
      const stored = StorageHelper.getItem(PRESET_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Errore nel caricamento dei preset personalizzati:', error);
    }
    return {};
  };

  const saveCustomPresets = (presets) => {
    try {
      StorageHelper.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
      return true;
    } catch (error) {
      console.error('Errore nel salvataggio dei preset:', error);
      return false;
    }
  };

  const getAllPresets = () => {
    const customPresets = loadCustomPresets();
    return { ...DEFAULT_PRESETS, ...customPresets };
  };

  const getPresetsByCategory = () => {
    const allPresets = getAllPresets();
    const categorized = {};

    Object.entries(allPresets).forEach(([key, preset]) => {
      const category = preset.category || 'custom';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push({ key, ...preset });
    });

    return categorized;
  };

  const createPreset = (key, presetData) => {
    if (!key || key.trim() === '') {
      throw new Error('Il codice del preset non può essere vuoto');
    }

    if (!/^[a-z0-9_]+$/.test(key)) {
      throw new Error('Il codice può contenere solo lettere minuscole, numeri e underscore');
    }

    if (!presetData.name || presetData.name.trim() === '') {
      throw new Error('Il nome del gioco non può essere vuoto');
    }

    if (!['max', 'min', 'rounds'].includes(presetData.mode)) {
      throw new Error('La modalità deve essere "max", "min" o "rounds"');
    }

    const target = parseInt(presetData.target, 10);
    if (isNaN(target) || target < 0) {
      throw new Error('Il punteggio obiettivo deve essere un numero maggiore o uguale a 0');
    }

    // 🆕 Validazione rounds migliorata
    if (presetData.mode === 'rounds') {
      const roundsTarget = parseInt(presetData.roundsTarget, 10);
      if (isNaN(roundsTarget) || roundsTarget <= 0) {
        throw new Error('Il numero di rounds deve essere un numero positivo');
      }
      
      // 🆕 Validazione roundMode
      if (!presetData.roundMode || !['max', 'min'].includes(presetData.roundMode)) {
        throw new Error('Per modalità rounds devi specificare come si vince il round: "max" (più punti) o "min" (meno punti)');
      }
    }

    if (DEFAULT_PRESETS[key]) {
      throw new Error('Non puoi sovrascrivere un preset predefinito. Usa un altro codice.');
    }

    const customPresets = loadCustomPresets();
    
    // 🆕 Genera descrizione più dettagliata per rounds
    let autoDescription = '';
    if (presetData.mode === 'rounds') {
      const roundModeText = presetData.roundMode === 'max' ? 'più punti' : 'meno punti';
      autoDescription = `${presetData.name} - Ogni round finisce a ${target} punti (vince chi fa ${roundModeText}). Vince chi vince ${presetData.roundsTarget} round.`;
    } else {
      const modeText = presetData.mode === 'max' ? 'Più punti' : 'Meno punti';
      autoDescription = `${presetData.name} - Modalità ${modeText}, Obiettivo: ${target}`;
    }
    
    const newPreset = {
      name: presetData.name.trim(),
      mode: presetData.mode,
      target: target,
      description: presetData.description?.trim() || autoDescription,
      category: presetData.category || 'custom',
      isDefault: false,
      createdAt: Date.now(),
      modifiedAt: Date.now()
    };

    // 🆕 Salva roundMode e roundsTarget per modalità rounds
    if (presetData.mode === 'rounds') {
      newPreset.roundMode = presetData.roundMode;
      newPreset.roundsTarget = parseInt(presetData.roundsTarget, 10);
    }

    customPresets[key] = newPreset;
    
    if (saveCustomPresets(customPresets)) {
      return { key, ...newPreset };
    } else {
      throw new Error('Errore nel salvataggio del preset');
    }
  };

  const updatePreset = (key, presetData) => {
    const customPresets = loadCustomPresets();
    
    if (!customPresets[key]) {
      throw new Error('Preset non trovato o non modificabile');
    }

    if (DEFAULT_PRESETS[key]) {
      throw new Error('Non puoi modificare un preset predefinito');
    }

    if (!presetData.name || presetData.name.trim() === '') {
      throw new Error('Il nome del gioco non può essere vuoto');
    }

    if (!['max', 'min', 'rounds'].includes(presetData.mode)) {
      throw new Error('La modalità deve essere "max", "min" o "rounds"');
    }

    const target = parseInt(presetData.target, 10);
    if (isNaN(target) || target < 0) {
      throw new Error('Il punteggio obiettivo deve essere un numero maggiore o uguale a 0');
    }

    // 🆕 Validazione rounds migliorata
    if (presetData.mode === 'rounds') {
      const roundsTarget = parseInt(presetData.roundsTarget, 10);
      if (isNaN(roundsTarget) || roundsTarget <= 0) {
        throw new Error('Il numero di rounds deve essere un numero positivo');
      }
      
      if (!presetData.roundMode || !['max', 'min'].includes(presetData.roundMode)) {
        throw new Error('Per modalità rounds devi specificare come si vince il round: "max" (più punti) o "min" (meno punti)');
      }
    }

    customPresets[key] = {
      ...customPresets[key],
      name: presetData.name.trim(),
      mode: presetData.mode,
      target: target,
      description: presetData.description?.trim() || customPresets[key].description,
      category: presetData.category || customPresets[key].category,
      modifiedAt: Date.now()
    };

    // 🆕 Gestisci roundMode e roundsTarget
    if (presetData.mode === 'rounds') {
      customPresets[key].roundMode = presetData.roundMode;
      customPresets[key].roundsTarget = parseInt(presetData.roundsTarget, 10);
    } else {
      delete customPresets[key].roundMode;
      delete customPresets[key].roundsTarget;
    }

    if (saveCustomPresets(customPresets)) {
      return { key, ...customPresets[key] };
    } else {
      throw new Error('Errore nel salvataggio delle modifiche');
    }
  };

  const deletePreset = (key) => {
    if (DEFAULT_PRESETS[key]) {
      throw new Error('Non puoi eliminare un preset predefinito');
    }

    const customPresets = loadCustomPresets();
    
    if (!customPresets[key]) {
      throw new Error('Preset non trovato');
    }

    delete customPresets[key];
    
    if (saveCustomPresets(customPresets)) {
      return true;
    } else {
      throw new Error('Errore nell\'eliminazione del preset');
    }
  };

  const restoreDefaults = () => {
    if (confirm('Sei sicuro di voler eliminare tutti i preset personalizzati? Questa azione non può essere annullata.')) {
      StorageHelper.removeItem(PRESET_STORAGE_KEY);
      return true;
    }
    return false;
  };

  const exportPresets = () => {
    const customPresets = loadCustomPresets();
    const exportData = {
      version: '1.2.0',
      exportDate: new Date().toISOString(),
      presets: customPresets
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `segnapunti-presets-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const importPresets = (jsonString) => {
    try {
      const importData = JSON.parse(jsonString);
      
      if (!importData.presets || typeof importData.presets !== 'object') {
        throw new Error('File non valido: formato preset non riconosciuto');
      }

      const customPresets = loadCustomPresets();
      let imported = 0;
      let skipped = 0;

      Object.entries(importData.presets).forEach(([key, preset]) => {
        if (DEFAULT_PRESETS[key]) {
          skipped++;
        } else if (customPresets[key]) {
          skipped++;
        } else {
          // Validazione base
          if (preset.name && preset.mode && preset.target !== undefined) {
            customPresets[key] = preset;
            imported++;
          } else {
            skipped++;
          }
        }
      });

      if (saveCustomPresets(customPresets)) {
        return { imported, skipped };
      } else {
        throw new Error('Errore nel salvataggio dei preset importati');
      }

    } catch (error) {
      throw new Error('Errore nell\'importazione: ' + error.message);
    }
  };

  const duplicatePreset = (sourceKey, newKey, newName) => {
    const allPresets = getAllPresets();
    const sourcePreset = allPresets[sourceKey];
    
    if (!sourcePreset) {
      throw new Error('Preset sorgente non trovato');
    }

    const presetData = {
      name: newName || sourcePreset.name + ' (Copia)',
      mode: sourcePreset.mode,
      target: sourcePreset.target,
      description: sourcePreset.description,
      category: sourcePreset.category || 'custom'
    };

    // 🆕 Copia anche roundMode e roundsTarget se presenti
    if (sourcePreset.mode === 'rounds') {
      presetData.roundMode = sourcePreset.roundMode;
      presetData.roundsTarget = sourcePreset.roundsTarget;
    }

    return createPreset(newKey, presetData);
  };

  // 🆕 NUOVO: Check limite free
  const canCreatePreset = () => {
    const isPremium = window.BillingModule?.isPremium() || false;
    
    if (isPremium) {
      return { allowed: true, reason: 'premium' };
    }
    
    const customPresets = loadCustomPresets();
    const customCount = Object.keys(customPresets).length;
    
    if (customCount < FREE_CUSTOM_LIMIT) {
      return { allowed: true, reason: 'free_limit_ok' };
    }
    
    return { 
      allowed: false, 
      reason: 'free_limit_reached',
      message: `Hai raggiunto il limite di ${FREE_CUSTOM_LIMIT} preset personalizzato.\n\nPassa a Premium per creare preset illimitati!`
    };
  };

  return {
    getAllPresets,
    getPresetsByCategory,
    createPreset,
    updatePreset,
    deletePreset,
    restoreDefaults,
    exportPresets,
    importPresets,
    duplicatePreset,
    canCreatePreset, // 🆕
    FREE_CUSTOM_LIMIT
  };
})();

// ===================================================================
// 🎨 PRESET UI MODULE
// ===================================================================

const PresetUIModule = (() => {
  let currentEditingKey = null;
  
  const CATEGORY_ORDER = ['carte', 'tavolo', 'sport', 'altri', 'custom'];
  const CATEGORY_NAMES = {
    carte: '🃏 Giochi di Carte',
    tavolo: '🎲 Giochi da Tavolo',
    sport: '⚽ Sport',
    altri: '🎯 Altri Giochi',
    custom: '⭐ Personalizzati'
  };
  const CATEGORY_ICONS = {
    carte: '🃏',
    tavolo: '🎲',
    sport: '⚽',
    altri: '🎯',
    custom: '⭐'
  };

  // ✅ FIX #7: Aggiorna stato pulsante create in base a limite free
  const updateCreateButtonState = () => {
    const btn = document.getElementById('btn-create-preset');
    if (!btn) return;
    
    const isPremium = window.BillingModule?.isPremium() || false;
    
    if (!isPremium) {
      const customCount = Object.values(getAllPresets())
        .filter(p => p.category === 'custom').length;
      
      btn.innerHTML = `➕ Nuovo Preset <small>(${customCount}/1)</small>`;
      
      if (customCount >= 1) {
        btn.style.opacity = '0.6';
        btn.title = 'Limite free raggiunto. Passa a Premium per preset illimitati!';
      } else {
        btn.style.opacity = '1';
        btn.title = 'Crea un nuovo preset personalizzato';
      }
    } else {
      btn.innerHTML = '➕ Nuovo Preset';
      btn.style.opacity = '1';
      btn.title = 'Crea un nuovo preset personalizzato';
    }
  };

  const renderPresetList = () => {
    const container = document.getElementById('preset-list-container');
    if (!container) return;

    container.innerHTML = '';

    const categorized = PresetManagerModule.getPresetsByCategory();
    
    CATEGORY_ORDER.forEach(categoryKey => {
      const presets = categorized[categoryKey];
      if (!presets || presets.length === 0) return;

      const categorySection = document.createElement('div');
      categorySection.className = 'preset-category';

      const categoryHeader = document.createElement('h2');
      categoryHeader.className = 'preset-category-header';
      categoryHeader.textContent = CATEGORY_NAMES[categoryKey] || categoryKey;

      const presetGrid = document.createElement('div');
      presetGrid.className = 'preset-grid';

      const sortedPresets = presets.sort((a, b) => a.name.localeCompare(b.name));

      sortedPresets.forEach(preset => {
        const card = createPresetCard(preset);
        presetGrid.appendChild(card);
      });

      categorySection.appendChild(categoryHeader);
      categorySection.appendChild(presetGrid);
      container.appendChild(categorySection);
    });

    if (container.children.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = 'Nessun preset disponibile.';
      emptyMessage.style.textAlign = 'center';
      emptyMessage.style.color = '#999';
      emptyMessage.style.padding = '40px 20px';
      container.appendChild(emptyMessage);
    }
    
    // ✅ FIX #7: Aggiorna stato pulsante create
    updateCreateButtonState();
  };

  const createPresetCard = (preset) => {
    const card = document.createElement('div');
    card.className = 'preset-card';
    
    if (preset.isDefault) {
      card.classList.add('preset-default');
    } else {
      card.classList.add('preset-custom');
    }

    // Header
    const header = document.createElement('div');
    header.className = 'preset-card-header';

    const icon = document.createElement('div');
    icon.className = 'preset-icon';
    icon.textContent = CATEGORY_ICONS[preset.category] || '⭐';

    const title = document.createElement('h3');
    title.className = 'preset-title';
    title.textContent = preset.name;

    header.appendChild(icon);
    header.appendChild(title);

    // Body
    const body = document.createElement('div');
    body.className = 'preset-card-body';

    // 🆕 Visualizzazione migliorata per modalità rounds
    if (preset.mode === 'rounds') {
      const roundModeText = preset.roundMode === 'max' ? 'più punti' : 'meno punti';
      
      const roundInfo = document.createElement('p');
      roundInfo.className = 'preset-mode';
      roundInfo.innerHTML = `<strong>🏆 Modalità:</strong> Rounds (vince chi vince ${preset.roundsTarget || 3} round)`;
      
      const roundEndInfo = document.createElement('p');
      roundEndInfo.className = 'preset-target';
      roundEndInfo.innerHTML = `<strong>📊 Fine Round:</strong> ${preset.target} punti (vince chi fa ${roundModeText})`;
      
      body.appendChild(roundInfo);
      body.appendChild(roundEndInfo);
    } else {
      const modeP = document.createElement('p');
      modeP.className = 'preset-mode';
      const modeText = preset.mode === 'max' ? 'Vince chi fa PIÙ punti' : 'Vince chi fa MENO punti';
      modeP.innerHTML = `<strong>🎯 Modalità:</strong> ${modeText}`;

      const targetP = document.createElement('p');
      targetP.className = 'preset-target';
      targetP.innerHTML = `<strong>🎯 Obiettivo:</strong> ${preset.target} punti`;

      body.appendChild(modeP);
      body.appendChild(targetP);
    }

    if (preset.description) {
      const descP = document.createElement('p');
      descP.className = 'preset-description';
      descP.textContent = preset.description;
      body.appendChild(descP);
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'preset-card-actions';

    const btnDuplicate = document.createElement('button');
    btnDuplicate.className = 'btn-secondary btn-small';
    btnDuplicate.innerHTML = '📋 Duplica';
    btnDuplicate.addEventListener('click', () => showDuplicateModal(preset.key));

    actions.appendChild(btnDuplicate);

    if (!preset.isDefault) {
      const btnEdit = document.createElement('button');
      btnEdit.className = 'btn-primary btn-small';
      btnEdit.innerHTML = '✏️ Modifica';
      btnEdit.addEventListener('click', () => showEditModal(preset.key));

      const btnDelete = document.createElement('button');
      btnDelete.className = 'btn-rimuovi btn-small';
      btnDelete.innerHTML = '🗑️ Elimina';
      btnDelete.addEventListener('click', () => deletePreset(preset.key));

      actions.appendChild(btnEdit);
      actions.appendChild(btnDelete);
    } else {
      const defaultBadge = document.createElement('span');
      defaultBadge.className = 'preset-badge-default';
      defaultBadge.textContent = '🔒 Predefinito';
      actions.appendChild(defaultBadge);
    }

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(actions);

    return card;
  };

  const showCreateModal = () => {
    // 🆕 CHECK: Verifica limite free
    const canCreate = PresetManagerModule.canCreatePreset();
    
    if (!canCreate.allowed) {
      if (window.PremiumUIModule) {
        window.PremiumUIModule.showFeatureLockedModal(
          'Preset Personalizzati Illimitati',
          canCreate.message
        );
      } else {
        alert(canCreate.message);
      }
      return;
    }
    
    currentEditingKey = null;
    const modal = document.getElementById('preset-edit-modal');
    const form = document.getElementById('preset-form');
    
    if (!modal || !form) return;

    document.getElementById('preset-modal-title').textContent = '➕ Nuovo Preset';
    form.reset();
    
    const keyInput = document.getElementById('preset-key');
    if (keyInput) {
      keyInput.value = '';
      keyInput.disabled = false;
    }
    
    toggleRoundsFields('max'); // Default
    
    modal.style.display = 'flex';
  };

  // 🆕 RINOMINATO: toggleRoundsFields per gestire entrambi i campi
  const toggleRoundsFields = (mode) => {
    const roundsField = document.getElementById('preset-rounds-field');
    const roundModeField = document.getElementById('preset-round-mode-field');
    
    if (roundsField) {
      roundsField.style.display = mode === 'rounds' ? 'block' : 'none';
    }
    
    if (roundModeField) {
      roundModeField.style.display = mode === 'rounds' ? 'block' : 'none';
    }
  };

  const showEditModal = (key) => {
    const allPresets = PresetManagerModule.getAllPresets();
    const preset = allPresets[key];
    
    if (!preset) return;

    currentEditingKey = key;
    const modal = document.getElementById('preset-edit-modal');
    const form = document.getElementById('preset-form');
    
    if (!modal || !form) return;

    document.getElementById('preset-modal-title').textContent = '✏️ Modifica Preset';
    
    const keyInput = document.getElementById('preset-key');
    if (keyInput) {
      keyInput.value = key;
      keyInput.disabled = true;
    }
    
    const nameInput = document.getElementById('preset-name');
    if (nameInput) nameInput.value = preset.name;
    
    const modeSelect = document.getElementById('preset-mode');
    if (modeSelect) modeSelect.value = preset.mode;
    
    const targetInput = document.getElementById('preset-target');
    if (targetInput) targetInput.value = preset.target;
    
    const descInput = document.getElementById('preset-description');
    if (descInput) descInput.value = preset.description || '';
    
    const categorySelect = document.getElementById('preset-category');
    if (categorySelect) categorySelect.value = preset.category || 'custom';
    
    // 🆕 Popola anche roundMode
    if (preset.mode === 'rounds') {
      const roundModeSelect = document.getElementById('preset-round-mode');
      if (roundModeSelect) roundModeSelect.value = preset.roundMode || 'max';
      
      const roundsInput = document.getElementById('preset-rounds-target');
      if (roundsInput) roundsInput.value = preset.roundsTarget || 3;
    }
    
    toggleRoundsFields(preset.mode);
    
    modal.style.display = 'flex';
  };

  const showDuplicateModal = (sourceKey) => {
    // 🆕 CHECK: Verifica limite free prima di duplicare
    const canCreate = PresetManagerModule.canCreatePreset();
    
    if (!canCreate.allowed) {
      if (window.PremiumUIModule) {
        window.PremiumUIModule.showFeatureLockedModal(
          'Preset Personalizzati Illimitati',
          canCreate.message
        );
      } else {
        alert(canCreate.message);
      }
      return;
    }
    
    const newKey = prompt('Inserisci il codice per il nuovo preset (lettere minuscole, numeri, underscore):');
    if (!newKey) return;

    const newName = prompt('Inserisci il nome per il nuovo preset:');
    if (!newName) return;

    try {
      PresetManagerModule.duplicatePreset(sourceKey, newKey, newName);
      alert('✅ Preset duplicato con successo!');
      renderPresetList();
    } catch (error) {
      alert('❌ Errore: ' + error.message);
    }
  };

  const closeModal = () => {
    const modal = document.getElementById('preset-edit-modal');
    if (modal) modal.style.display = 'none';
    currentEditingKey = null;
  };

  const savePreset = () => {
    const keyInput = document.getElementById('preset-key');
    const nameInput = document.getElementById('preset-name');
    const modeSelect = document.getElementById('preset-mode');
    const targetInput = document.getElementById('preset-target');
    const descInput = document.getElementById('preset-description');
    const categorySelect = document.getElementById('preset-category');
    
    if (!keyInput || !nameInput || !modeSelect || !targetInput) return;
    
    const key = keyInput.value.trim();
    const name = nameInput.value.trim();
    const mode = modeSelect.value;
    const target = targetInput.value;
    const description = descInput ? descInput.value.trim() : '';
    const category = categorySelect ? categorySelect.value : 'custom';

    const presetData = { name, mode, target, description, category };

    // 🆕 Includi roundMode per modalità rounds
    if (mode === 'rounds') {
      const roundModeSelect = document.getElementById('preset-round-mode');
      const roundsInput = document.getElementById('preset-rounds-target');
      
      if (roundModeSelect) {
        presetData.roundMode = roundModeSelect.value;
      }
      
      if (roundsInput) {
        presetData.roundsTarget = roundsInput.value;
      }
    }

    try {
      if (currentEditingKey) {
        PresetManagerModule.updatePreset(currentEditingKey, presetData);
        alert('✅ Preset modificato con successo!');
      } else {
        PresetManagerModule.createPreset(key, presetData);
        alert('✅ Preset creato con successo!');
      }
      closeModal();
      renderPresetList();
    } catch (error) {
      alert('❌ Errore: ' + error.message);
    }
  };

  const deletePreset = (key) => {
    if (!confirm('Sei sicuro di voler eliminare questo preset? Questa azione non può essere annullata.')) {
      return;
    }

    try {
      PresetManagerModule.deletePreset(key);
      alert('✅ Preset eliminato');
      renderPresetList();
    } catch (error) {
      alert('❌ Errore: ' + error.message);
    }
  };

  const exportPresets = () => {
    try {
      PresetManagerModule.exportPresets();
      alert('✅ Preset esportati con successo!');
    } catch (error) {
      alert('❌ Errore nell\'export: ' + error.message);
    }
  };

  const importPresets = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const result = PresetManagerModule.importPresets(event.target.result);
          alert(`✅ Import completato!\nImportati: ${result.imported}\nIgnorati: ${result.skipped}`);
          renderPresetList();
        } catch (error) {
          alert('❌ ' + error.message);
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  };

  const restoreDefaults = () => {
    if (PresetManagerModule.restoreDefaults()) {
      alert('✅ Preset personalizzati eliminati. Solo i preset predefiniti sono disponibili.');
      renderPresetList();
    }
  };

  const setupEventListeners = () => {
    const btnCreate = document.getElementById('btn-create-preset');
    if (btnCreate) {
      btnCreate.addEventListener('click', () => {
        // ✅ FIX #7: Controlla limite free users
        const isPremium = window.BillingModule?.isPremium() || false;
        
        if (!isPremium) {
          const customCount = Object.values(getAllPresets())
            .filter(p => p.category === 'custom').length;
          
          if (customCount >= 1) {
            alert(
              'Limite raggiunto! 🎁\n\n' +
              'Gli utenti free possono creare solo 1 preset.\n' +
              'Passa a Premium per preset illimitati!'
            );
            return;
          }
        }
        
        showCreateModal();
      });
    }

    const btnCloseModal = document.getElementById('btn-close-preset-modal');
    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', closeModal);
    }

    const btnSavePreset = document.getElementById('btn-save-preset');
    if (btnSavePreset) {
      btnSavePreset.addEventListener('click', savePreset);
    }

    const modeSelect = document.getElementById('preset-mode');
    if (modeSelect) {
      modeSelect.addEventListener('change', (e) => {
        toggleRoundsFields(e.target.value);
      });
    }

    const btnExport = document.getElementById('btn-export-presets');
    if (btnExport) {
      btnExport.addEventListener('click', exportPresets);
    }

    const btnImport = document.getElementById('btn-import-presets');
    if (btnImport) {
      btnImport.addEventListener('click', importPresets);
    }

    const btnRestore = document.getElementById('btn-restore-defaults');
    if (btnRestore) {
      btnRestore.addEventListener('click', restoreDefaults);
    }
  };

  return {
    renderPresetList,
    setupEventListeners
  };
})();

window.PresetManager = PresetManagerModule;
window.PresetUI = PresetUIModule;
