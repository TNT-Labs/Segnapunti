// ===================================================================
// 🎮 PRESET MANAGER MODULE v1.1.2 - BUG FIXES APPLICATI
// ===================================================================

const PresetManagerModule = (() => {
  // Preset di default con supporto rounds
  const DEFAULT_PRESETS = {
    scala40: { 
      name: 'Scala 40', 
      mode: 'min', 
      target: 151, 
      description: '🃏 Scala 40: Perde chi raggiunge per primo 151 punti. Modalità punti alti.',
      isDefault: true,
      category: 'carte'
    },
    burraco: { 
      name: 'Burraco', 
      mode: 'max', 
      target: 2000, 
      description: '🃏 Burraco: Vince chi raggiunge 2000 punti. Partite lunghe e strategiche.',
      isDefault: true,
      category: 'carte'
    },
    poker_tournament: {
      name: 'Poker (Torneo)',
      mode: 'rounds',
      target: 10000,
      roundsTarget: 5,
      description: '🃏 Poker Torneo: Vince chi vince 5 mani. Punteggio secondario per pareggi.',
      isDefault: true,
      category: 'carte'
    },
    briscola: { 
      name: 'Briscola', 
      mode: 'max', 
      target: 21, 
      description: '🃏 Briscola: Vince chi arriva a 21 punti (totale carte in gioco).',
      isDefault: true,
      category: 'carte'
    },
    scopa_rounds: {
      name: 'Scopa (a Partite)',
      mode: 'rounds',
      target: 100,
      roundsTarget: 3,
      description: '🃏 Scopa a Partite: Vince chi vince 3 partite. Best of 5.',
      isDefault: true,
      category: 'carte'
    },
    scopa: { 
      name: 'Scopa', 
      mode: 'max', 
      target: 21, 
      description: '🃏 Scopa: Vince chi raggiunge 21 punti. Partite rapide.',
      isDefault: true,
      category: 'carte'
    },
    pinnacola: { 
      name: 'Pinnacola', 
      mode: 'max', 
      target: 1500, 
      description: '🃏 Pinnacola: Vince chi totalizza 1500 punti. Gioco di combinazioni.',
      isDefault: true,
      category: 'carte'
    },
    yahtzee: { 
      name: 'Yahtzee', 
      mode: 'max', 
      target: 300, 
      description: '🎲 Yahtzee: Vince chi fa più punti. Obiettivo tipico 300+ per partita completa.',
      isDefault: true,
      category: 'tavolo'
    },
    catan: { 
      name: 'Catan', 
      mode: 'max', 
      target: 10, 
      description: '🎲 Catan: Vince chi raggiunge 10 punti vittoria. Strategia e commercio.',
      isDefault: true,
      category: 'tavolo'
    },
    carcassonne: { 
      name: 'Carcassonne', 
      mode: 'max', 
      target: 100, 
      description: '🎲 Carcassonne: Obiettivo tipico 100+ punti. Piazzamento tessere strategico.',
      isDefault: true,
      category: 'tavolo'
    },
    ticket: { 
      name: 'Ticket to Ride', 
      mode: 'max', 
      target: 150, 
      description: '🎲 Ticket to Ride: Vince chi fa più punti. Obiettivo tipico 150+.',
      isDefault: true,
      category: 'tavolo'
    },
    tennis: {
      name: 'Tennis/Volley',
      mode: 'rounds',
      target: 25,
      roundsTarget: 3,
      description: '⚽ Tennis/Volley: Vince chi vince 3 set. Ogni set a 25 punti.',
      isDefault: true,
      category: 'sport'
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
    },
    bowling: { 
      name: 'Bowling', 
      mode: 'max', 
      target: 300, 
      description: '🎳 Bowling: Vince chi fa più punti. 300 è il punteggio perfetto.',
      isDefault: true,
      category: 'altri'
    },
    golf: { 
      name: 'Golf (Mini)', 
      mode: 'min', 
      target: 50, 
      description: '⛳ Golf: Vince chi fa meno punti. Obiettivo tipico: sotto il par (50).',
      isDefault: true,
      category: 'altri'
    },
    pingpong: {
      name: 'Ping Pong',
      mode: 'rounds',
      target: 11,
      roundsTarget: 3,
      description: '🏓 Ping Pong: Vince chi vince 3 set. Ogni set a 11 punti.',
      isDefault: true,
      category: 'sport'
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
      const stored = localStorage.getItem(PRESET_STORAGE_KEY);
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
      localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
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

    if (presetData.mode === 'rounds') {
      const roundsTarget = parseInt(presetData.roundsTarget, 10);
      if (isNaN(roundsTarget) || roundsTarget <= 0) {
        throw new Error('Il numero di rounds deve essere un numero positivo');
      }
    }

    if (DEFAULT_PRESETS[key]) {
      throw new Error('Non puoi sovrascrivere un preset predefinito. Usa un altro codice.');
    }

    const customPresets = loadCustomPresets();
    
    const newPreset = {
      name: presetData.name.trim(),
      mode: presetData.mode,
      target: target,
      description: presetData.description?.trim() || `${presetData.name} - Modalità ${presetData.mode === 'rounds' ? 'Rounds' : presetData.mode === 'max' ? 'Più punti' : 'Meno punti'}, Obiettivo: ${target}`,
      category: presetData.category || 'custom',
      isDefault: false,
      createdAt: Date.now(),
      modifiedAt: Date.now()
    };

    if (presetData.mode === 'rounds' && presetData.roundsTarget) {
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

    if (presetData.mode === 'rounds') {
      const roundsTarget = parseInt(presetData.roundsTarget, 10);
      if (isNaN(roundsTarget) || roundsTarget <= 0) {
        throw new Error('Il numero di rounds deve essere un numero positivo');
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

    if (presetData.mode === 'rounds' && presetData.roundsTarget) {
      customPresets[key].roundsTarget = parseInt(presetData.roundsTarget, 10);
    } else {
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
      localStorage.removeItem(PRESET_STORAGE_KEY);
      return true;
    }
    return false;
  };

  const exportPresets = () => {
    const customPresets = loadCustomPresets();
    const exportData = {
      version: '1.1.2',
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

  // ✅ FIX #12: Validazione rigorosa import
  const importPresets = (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.presets || typeof data.presets !== 'object') {
        throw new Error('Formato file non valido');
      }

      const customPresets = loadCustomPresets();
      let imported = 0;
      let skipped = 0;

      Object.entries(data.presets).forEach(([key, preset]) => {
        if (DEFAULT_PRESETS[key]) {
          skipped++;
          return;
        }

        // ✅ FIX #12: Validazione rigorosa
        const isValid = 
          preset.name && 
          typeof preset.name === 'string' &&
          ['max', 'min', 'rounds'].includes(preset.mode) &&
          typeof preset.target === 'number' &&
          preset.target >= 0 &&
          (preset.mode !== 'rounds' || (preset.roundsTarget && preset.roundsTarget > 0));

        if (isValid) {
          customPresets[key] = {
            ...preset,
            importedAt: Date.now()
          };
          imported++;
        } else {
          console.warn(`Preset "${key}" ignorato: dati non validi`);
          skipped++;
        }
      });

      if (imported > 0) {
        saveCustomPresets(customPresets);
      }

      return { imported, skipped };
    } catch (error) {
      throw new Error('Errore nell\'importazione: ' + error.message);
    }
  };

  const duplicatePreset = (sourceKey, newKey, newName) => {
    const allPresets = getAllPresets();
    
    if (!allPresets[sourceKey]) {
      throw new Error('Preset sorgente non trovato');
    }

    if (!newKey || !/^[a-z0-9_]+$/.test(newKey)) {
      throw new Error('Codice non valido');
    }

    if (DEFAULT_PRESETS[newKey] || loadCustomPresets()[newKey]) {
      throw new Error('Esiste già un preset con questo codice');
    }

    const sourcePreset = allPresets[sourceKey];
    
    const newPresetData = {
      name: newName || `${sourcePreset.name} (Copia)`,
      mode: sourcePreset.mode,
      target: sourcePreset.target,
      description: sourcePreset.description,
      category: sourcePreset.category === 'carte' || sourcePreset.category === 'tavolo' || sourcePreset.category === 'altri' ? 'custom' : sourcePreset.category
    };

    if (sourcePreset.roundsTarget) {
      newPresetData.roundsTarget = sourcePreset.roundsTarget;
    }

    return createPreset(newKey, newPresetData);
  };

  return {
    getAllPresets,
    getPresetsByCategory,
    createPreset,
    updatePreset,
    deletePreset,
    duplicatePreset,
    restoreDefaults,
    exportPresets,
    importPresets,
    getCategoryIcon: (category) => CATEGORY_ICONS[category] || CATEGORY_ICONS.custom,
    isDefaultPreset: (key) => !!DEFAULT_PRESETS[key]
  };
})();

// ===================================================================
// 🎨 PRESET UI MODULE - CON FIX #4
// ===================================================================

const PresetUIModule = (() => {
  let currentEditingKey = null;

  const renderPresetList = () => {
    const container = document.getElementById('preset-list-container');
    if (!container) return;

    const presetsByCategory = PresetManagerModule.getPresetsByCategory();
    container.innerHTML = '';

    const categoryNames = {
      carte: '🃏 Giochi di Carte',
      tavolo: '🎲 Giochi da Tavolo',
      sport: '⚽ Sport',
      altri: '🎯 Altri Giochi',
      custom: '⭐ Personalizzati'
    };

    const categoryOrder = ['carte', 'tavolo', 'sport', 'altri', 'custom'];

    categoryOrder.forEach(category => {
      const presets = presetsByCategory[category];
      if (!presets || presets.length === 0) return;

      const categorySection = document.createElement('div');
      categorySection.className = 'preset-category';

      const categoryHeader = document.createElement('h3');
      categoryHeader.className = 'preset-category-header';
      categoryHeader.textContent = categoryNames[category] || category;

      const presetGrid = document.createElement('div');
      presetGrid.className = 'preset-grid';

      presets.forEach(preset => {
        const presetCard = createPresetCard(preset);
        presetGrid.appendChild(presetCard);
      });

      categorySection.appendChild(categoryHeader);
      categorySection.appendChild(presetGrid);
      container.appendChild(categorySection);
    });
  };

  const createPresetCard = (preset) => {
    const card = document.createElement('div');
    card.className = `preset-card ${preset.isDefault ? 'preset-default' : 'preset-custom'}`;

    const header = document.createElement('div');
    header.className = 'preset-card-header';

    const icon = document.createElement('span');
    icon.className = 'preset-icon';
    icon.textContent = PresetManagerModule.getCategoryIcon(preset.category);

    const title = document.createElement('h4');
    title.className = 'preset-title';
    title.textContent = preset.name;

    header.appendChild(icon);
    header.appendChild(title);

    const body = document.createElement('div');
    body.className = 'preset-card-body';

    const mode = document.createElement('p');
    mode.className = 'preset-mode';
    
    let modeText = '';
    if (preset.mode === 'rounds') {
      modeText = '🏆 Rounds';
    } else if (preset.mode === 'max') {
      modeText = '📈 Più punti';
    } else {
      modeText = '📉 Meno punti';
    }
    mode.innerHTML = `<strong>Modalità:</strong> ${modeText}`;

    const target = document.createElement('p');
    target.className = 'preset-target';
    
    if (preset.mode === 'rounds' && preset.roundsTarget) {
      target.innerHTML = `<strong>Obiettivo:</strong> ${preset.roundsTarget} rounds (${preset.target} pt/round)`;
    } else {
      target.innerHTML = `<strong>Obiettivo:</strong> ${preset.target} punti`;
    }

    const description = document.createElement('p');
    description.className = 'preset-description';
    description.textContent = preset.description;

    body.appendChild(mode);
    body.appendChild(target);
    body.appendChild(description);

    const actions = document.createElement('div');
    actions.className = 'preset-card-actions';

    const btnDuplicate = document.createElement('button');
    btnDuplicate.className = 'btn-secondary btn-small';
    btnDuplicate.innerHTML = '📋 Duplica';
    btnDuplicate.title = 'Duplica questo preset';
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
    
    toggleRoundsField('max');
    
    modal.style.display = 'flex';
  };

  const toggleRoundsField = (mode) => {
    const roundsField = document.getElementById('preset-rounds-field');
    if (roundsField) {
      roundsField.style.display = mode === 'rounds' ? 'block' : 'none';
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
    
    if (preset.mode === 'rounds' && preset.roundsTarget) {
      const roundsInput = document.getElementById('preset-rounds-target');
      if (roundsInput) roundsInput.value = preset.roundsTarget;
    }
    
    toggleRoundsField(preset.mode);
    
    modal.style.display = 'flex';
  };

  const showDuplicateModal = (sourceKey) => {
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

    if (mode === 'rounds') {
      const roundsInput = document.getElementById('preset-rounds-target');
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
      btnCreate.addEventListener('click', showCreateModal);
    }

    const btnCloseModal = document.getElementById('btn-close-preset-modal');
    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', closeModal);
    }

    const btnSavePreset = document.getElementById('btn-save-preset');
    if (btnSavePreset) {
      btnSavePreset.addEventListener('click', savePreset);
    }

    // ✅ FIX #4: Null check prima di aggiungere listener
    const modeSelect = document.getElementById('preset-mode');
    if (modeSelect) {
      modeSelect.addEventListener('change', (e) => {
        toggleRoundsField(e.target.value);
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
