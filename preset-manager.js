// ===================================================================
// 🎮 PRESET MANAGER MODULE v1.2.1 - BUG FIXES
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
      roundMode: 'max',
      target: 21,
      roundsTarget: 2,
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
      target: 6,
      roundsTarget: 2,
      description: '🎾 Tennis: Ogni set finisce a 6 game. Vince chi vince 2 set.',
      isDefault: true,
      category: 'sport'
    },
    volleyball: {
      name: 'Pallavolo (Set)',
      mode: 'rounds',
      roundMode: 'max',
      target: 25,
      roundsTarget: 3,
      description: '🏐 Pallavolo: Ogni set finisce a 25 punti. Vince chi vince 3 set.',
      isDefault: true,
      category: 'sport'
    },
    poker_mani: {
      name: 'Poker (Mani)',
      mode: 'rounds',
      roundMode: 'max',
      target: 10000,
      roundsTarget: 5,
      description: '🃏 Poker: Ogni mano finisce a 10k chips. Vince chi vince 5 mani.',
      isDefault: true,
      category: 'carte'
    },
    freccette501: { 
      name: 'Freccette 501', 
      mode: 'darts', 
      target: 501, 
      description: '🎯 Freccette 501: Si parte da 501, vince chi arriva esattamente a 0. Se vai sotto zero, torni al punteggio precedente.',
      isDefault: true,
      category: 'altri',
      startingScore: 501
    },
    freccette301: { 
      name: 'Freccette 301', 
      mode: 'darts', 
      target: 301, 
      description: '🎯 Freccette 301: Si parte da 301, vince chi arriva esattamente a 0. Se vai sotto zero, torni al punteggio precedente.',
      isDefault: true,
      category: 'altri',
      startingScore: 301
    }
  };

  const PRESET_STORAGE_KEY = 'custom_presets';
  const FREE_CUSTOM_LIMIT = 1;
  
  const CATEGORY_ICONS = {
    carte: '🃏',
    tavolo: '🎲',
    sport: '⚽',
    altri: '🎯',
    custom: '⭐'
  };

  // ✅ FIX: Lista modalità valide (incluso darts)
  const VALID_MODES = ['max', 'min', 'rounds', 'darts'];

  // ✅ FIX: Funzione per generare codice preset automatico da nome
  const generatePresetKey = (name) => {
    if (!name || typeof name !== 'string') {
      return `custom_${Date.now()}`;
    }
    
    let slug = name
      .toLowerCase()
      .trim()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_');
    
    if (slug.length > 30) {
      slug = slug.substring(0, 30);
    }
    
    // ✅ FIX: Assicura che inizi con lettera (non numero/underscore)
    if (!slug || slug === '' || !/^[a-z]/.test(slug)) {
      slug = `preset_${slug || Date.now()}`;
    }
    
    // Rimuovi underscore iniziali/finali multipli
    slug = slug.replace(/^_+|_+$/g, '').replace(/_+/g, '_');
    
    // Se ancora invalido, usa fallback
    if (!slug || !/^[a-z][a-z0-9_]*$/.test(slug)) {
      slug = `custom_${Date.now()}`;
    }
    
    const allPresets = getAllPresets();
    let finalKey = slug;
    let counter = 1;

    const MAX_ITERATIONS = 1000;
    let iterations = 0;

    while (allPresets[finalKey] && iterations < MAX_ITERATIONS) {
      finalKey = `${slug}_${counter}`;
      counter++;
      iterations++;
    }

    if (iterations >= MAX_ITERATIONS) {
      Logger.warn('generatePresetKey: Raggiunto limite iterazioni, uso timestamp');
      finalKey = `${slug}_${Date.now()}`;
    }

    return finalKey;
  };

  const loadCustomPresets = () => {
    try {
      const stored = StorageHelper.getItem(PRESET_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      Logger.error('Errore nel caricamento dei preset personalizzati:', error);
    }
    return {};
  };

  const saveCustomPresets = (presets) => {
    try {
      StorageHelper.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
      return true;
    } catch (error) {
      Logger.error('Errore nel salvataggio dei preset:', error);
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

  const createPreset = (keyOrNull, presetData) => {
    const key = (keyOrNull && keyOrNull.trim() !== '') ? keyOrNull : generatePresetKey(presetData.name);

    const RESERVED_KEYS = ['__proto__', 'constructor', 'prototype', 'default', 'toString', 'valueOf', 'hasOwnProperty'];

    const MAX_KEY_LENGTH = 50;

    if (key.length > MAX_KEY_LENGTH) {
      throw new Error(`Il codice preset non può superare ${MAX_KEY_LENGTH} caratteri`);
    }

    if (!/^[a-z][a-z0-9_]*$/.test(key)) {
      throw new Error('Il codice preset deve iniziare con una lettera e contenere solo lettere minuscole, numeri e underscore');
    }

    if (RESERVED_KEYS.includes(key.toLowerCase())) {
      throw new Error(`La chiave "${key}" è riservata e non può essere utilizzata`);
    }

    if (!presetData.name || presetData.name.trim() === '') {
      throw new Error('Il nome del gioco non può essere vuoto');
    }

    const safeName = presetData.name.trim().slice(0, 50);
    if (!/^[\p{L}\p{N}\s'\-]+$/u.test(safeName)) {
      throw new Error('Il nome può contenere solo lettere, numeri, spazi, apostrofi e trattini');
    }

    if (/<[^>]*>/g.test(safeName)) {
      throw new Error('Il nome non può contenere tag HTML');
    }

    // ✅ FIX: Validazione mode include 'darts'
    if (!VALID_MODES.includes(presetData.mode)) {
      throw new Error('La modalità deve essere "max", "min", "rounds" o "darts"');
    }

    const target = parseInt(presetData.target, 10);
    if (isNaN(target) || target < 0) {
      throw new Error('Il punteggio obiettivo deve essere un numero maggiore o uguale a 0');
    }

    // Validazione rounds
    if (presetData.mode === 'rounds') {
      const roundsTarget = parseInt(presetData.roundsTarget, 10);
      if (isNaN(roundsTarget) || roundsTarget <= 0) {
        throw new Error('Il numero di rounds deve essere un numero positivo');
      }
      
      if (!presetData.roundMode || !['max', 'min'].includes(presetData.roundMode)) {
        throw new Error('Per modalità rounds devi specificare come si vince il round: "max" (più punti) o "min" (meno punti)');
      }
    }

    if (DEFAULT_PRESETS[key]) {
      throw new Error('Non puoi sovrascrivere un preset predefinito. Usa un altro codice.');
    }

    const customPresets = loadCustomPresets();
    
    // Genera descrizione
    let autoDescription = '';
    if (presetData.mode === 'rounds') {
      const roundModeText = presetData.roundMode === 'max' ? 'più punti' : 'meno punti';
      autoDescription = `${safeName} - Ogni round finisce a ${target} punti (vince chi fa ${roundModeText}). Vince chi vince ${presetData.roundsTarget} round.`;
    } else if (presetData.mode === 'darts') {
      autoDescription = `${safeName} - Si parte da ${target}, vince chi arriva a 0.`;
    } else {
      const modeText = presetData.mode === 'max' ? 'Più punti' : 'Meno punti';
      autoDescription = `${safeName} - Modalità ${modeText}, Obiettivo: ${target}`;
    }
    
    const newPreset = {
      name: safeName,
      mode: presetData.mode,
      target: target,
      description: presetData.description?.trim() || autoDescription,
      category: presetData.category || 'custom',
      isDefault: false,
      createdAt: Date.now(),
      modifiedAt: Date.now()
    };

    // Campi specifici per rounds
    if (presetData.mode === 'rounds') {
      newPreset.roundMode = presetData.roundMode;
      newPreset.roundsTarget = parseInt(presetData.roundsTarget, 10);
    }

    // ✅ FIX: Campi specifici per darts
    if (presetData.mode === 'darts') {
      newPreset.startingScore = target;
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

    // ✅ FIX: Validazione mode include 'darts'
    if (!VALID_MODES.includes(presetData.mode)) {
      throw new Error('La modalità deve essere "max", "min", "rounds" o "darts"');
    }

    const target = parseInt(presetData.target, 10);
    if (isNaN(target) || target < 0) {
      throw new Error('Il punteggio obiettivo deve essere un numero maggiore o uguale a 0');
    }

    // Validazione rounds
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

    // Gestisci roundMode e roundsTarget
    if (presetData.mode === 'rounds') {
      customPresets[key].roundMode = presetData.roundMode;
      customPresets[key].roundsTarget = parseInt(presetData.roundsTarget, 10);
      delete customPresets[key].startingScore;
    } else if (presetData.mode === 'darts') {
      customPresets[key].startingScore = target;
      delete customPresets[key].roundMode;
      delete customPresets[key].roundsTarget;
    } else {
      delete customPresets[key].roundMode;
      delete customPresets[key].roundsTarget;
      delete customPresets[key].startingScore;
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
      if (typeof window !== 'undefined' && window.PresetUI && typeof window.PresetUI.updateCreateButtonState === 'function') {
        setTimeout(() => {
          window.PresetUI.updateCreateButtonState();
        }, 100);
      }
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
      version: '1.2.1',
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
          try {
            if (!key || typeof key !== 'string' || key.trim() === '') {
              throw new Error('Invalid key');
            }

            if (!preset.name || typeof preset.name !== 'string') {
              throw new Error('Invalid name');
            }
            const safeName = preset.name.trim().slice(0, 50);
            if (!/^[\p{L}\p{N}\s'\-]+$/u.test(safeName)) {
              throw new Error('Invalid characters in name');
            }

            // ✅ FIX: Validazione mode include 'darts'
            if (!VALID_MODES.includes(preset.mode)) {
              throw new Error('Invalid mode');
            }

            const MAX_SAFE_TARGET = 999999;
            const target = parseInt(preset.target, 10);
            if (isNaN(target) || target <= 0 || target > MAX_SAFE_TARGET) {
              throw new Error(`Invalid target (must be 1-${MAX_SAFE_TARGET})`);
            }

            let roundMode = preset.roundMode || 'max';
            let roundsTarget = preset.roundsTarget ? parseInt(preset.roundsTarget, 10) : 3;

            if (preset.mode === 'rounds') {
              if (!['max', 'min'].includes(roundMode)) {
                roundMode = 'max';
              }
              if (isNaN(roundsTarget) || roundsTarget <= 0) {
                roundsTarget = 3;
              }
            }

            let description = '';
            if (preset.description && typeof preset.description === 'string') {
              description = preset.description
                .replace(/<[^>]*>/g, '')
                .trim()
                .slice(0, 200);
            }

            const ALLOWED_CATEGORIES = ['carte', 'tavolo', 'sport', 'altri', 'custom'];
            let category = preset.category || 'custom';
            if (!ALLOWED_CATEGORIES.includes(category)) {
              category = 'custom';
            }

            const validatedPreset = {
              name: safeName,
              mode: preset.mode,
              target: target,
              description: description,
              category: category
            };

            if (preset.mode === 'rounds') {
              validatedPreset.roundMode = roundMode;
              validatedPreset.roundsTarget = roundsTarget;
            }

            // ✅ FIX: Gestisci darts nell'import
            if (preset.mode === 'darts') {
              validatedPreset.startingScore = target;
            }

            customPresets[key.trim()] = validatedPreset;
            imported++;

          } catch (validationError) {
            Logger.warn(`[Import] Preset "${key}" skipped:`, validationError.message);
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

    // Copia roundMode e roundsTarget se presenti
    if (sourcePreset.mode === 'rounds') {
      presetData.roundMode = sourcePreset.roundMode;
      presetData.roundsTarget = sourcePreset.roundsTarget;
    }

    // ✅ FIX: Copia startingScore per darts
    if (sourcePreset.mode === 'darts') {
      presetData.startingScore = sourcePreset.startingScore || sourcePreset.target;
    }

    const keyToUse = (newKey && newKey.trim() !== '') ? newKey : null;
    return createPreset(keyToUse, presetData);
  };

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
    canCreatePreset,
    loadCustomPresets,
    FREE_CUSTOM_LIMIT,
    VALID_MODES // ✅ Esponi per uso nella UI
  };
})();

// ===================================================================
// 🎨 PRESET UI MODULE
// ===================================================================

const PresetUIModule = (() => {
  let currentEditingKey = null;

  const eventHandlers = {
    btnCreateClick: null,
    btnCloseModalClick: null,
    btnSavePresetClick: null,
    modeSelectChange: null,
    btnExportClick: null,
    btnImportClick: null,
    btnRestoreClick: null
  };

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

  const updateCreateButtonState = () => {
    const btn = document.getElementById('btn-create-preset');
    if (!btn) return;
    
    const isPremium = window.BillingModule?.isPremium() || false;
    
    if (!isPremium) {
      const customPresets = PresetManagerModule.loadCustomPresets();
      const customCount = Object.keys(customPresets).length;
      
      btn.innerHTML = `➕ Nuovo Preset <small style="font-size:0.7em;opacity:0.8;margin-left:6px;">(${customCount}/1)</small>`;
      
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
    if (!container) {
      Logger.warn('[PresetUI] Container non trovato');
      return;
    }

    try {
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
      
      updateCreateButtonState();
      
    } catch (error) {
      Logger.error('[PresetUI] Errore render preset list:', error);
      
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #ff6b6b;">
          <h3>⚠️ Errore Caricamento Preset</h3>
          <p>Si è verificato un errore durante il caricamento dei preset.</p>
          <p style="font-size: 0.9em; opacity: 0.8;">${error.message}</p>
          <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #4A148C; color: white; border: none; border-radius: 8px; cursor: pointer;">
            🔄 Ricarica Pagina
          </button>
        </div>
      `;
    }
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

    // ✅ FIX: Visualizzazione migliorata per tutte le modalità incluso darts
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
    } else if (preset.mode === 'darts') {
      // ✅ FIX: Gestione corretta modalità darts
      const modeP = document.createElement('p');
      modeP.className = 'preset-mode';
      modeP.innerHTML = `<strong>🎯 Modalità:</strong> Freccette (da ${preset.target} a 0)`;

      const targetP = document.createElement('p');
      targetP.className = 'preset-target';
      targetP.innerHTML = `<strong>🎯 Partenza:</strong> ${preset.startingScore || preset.target} punti`;

      body.appendChild(modeP);
      body.appendChild(targetP);
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
    const keyFormGroup = keyInput?.closest('.form-group');
    
    if (keyInput) {
      keyInput.value = '';
      keyInput.disabled = false;
    }
    
    if (keyFormGroup) {
      keyFormGroup.style.display = 'none';
    }
    
    toggleRoundsFields('max');
    
    modal.style.display = 'flex';
  };

  // ✅ FIX: toggleRoundsFields gestisce tutti i modi
  const toggleRoundsFields = (mode) => {
    const roundsField = document.getElementById('preset-rounds-field');
    const roundModeField = document.getElementById('preset-round-mode-field');
    
    const isRounds = mode === 'rounds';
    
    if (roundsField) {
      roundsField.style.display = isRounds ? 'block' : 'none';
    }
    
    if (roundModeField) {
      roundModeField.style.display = isRounds ? 'block' : 'none';
    }

    // ✅ FIX: Aggiorna label obiettivo in base alla modalità
    const targetLabel = document.querySelector('label[for="preset-target"]');
    if (targetLabel) {
      if (mode === 'darts') {
        targetLabel.textContent = 'Punteggio di Partenza *';
      } else if (mode === 'rounds') {
        targetLabel.textContent = 'Punti per Fine Round *';
      } else {
        targetLabel.textContent = 'Punteggio Obiettivo *';
      }
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
    const keyFormGroup = keyInput?.closest('.form-group');
    
    if (keyInput) {
      keyInput.value = key;
      keyInput.disabled = true;
    }
    
    if (keyFormGroup) {
      keyFormGroup.style.display = 'block';
    }
    
    const nameInput = document.getElementById('preset-name');
    if (nameInput) nameInput.value = preset.name;
    
    const modeSelect = document.getElementById('preset-mode');
    if (modeSelect) modeSelect.value = preset.mode;
    
    const targetInput = document.getElementById('preset-target');
    if (targetInput) {
      // ✅ FIX: Per darts usa startingScore se disponibile
      targetInput.value = preset.mode === 'darts' ? (preset.startingScore || preset.target) : preset.target;
    }
    
    const descInput = document.getElementById('preset-description');
    if (descInput) descInput.value = preset.description || '';
    
    const categorySelect = document.getElementById('preset-category');
    if (categorySelect) categorySelect.value = preset.category || 'custom';
    
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

    const newName = prompt('Inserisci il nome per il nuovo preset:');
    if (!newName || newName.trim() === '') return;

    try {
      const duplicatedPreset = PresetManagerModule.duplicatePreset(sourceKey, null, newName);
      alert(`✅ Preset "${duplicatedPreset.name}" duplicato con successo!\nCodice: ${duplicatedPreset.key}`);
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
    
    if (!nameInput || !modeSelect || !targetInput) return;
    
    const key = currentEditingKey ? currentEditingKey : null;
    const name = nameInput.value.trim();
    const mode = modeSelect.value;
    const target = targetInput.value;
    const description = descInput ? descInput.value.trim() : '';
    const category = categorySelect ? categorySelect.value : 'custom';

    const presetData = { name, mode, target, description, category };

    // Includi roundMode per modalità rounds
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

    // ✅ FIX: Per darts il target è anche startingScore
    if (mode === 'darts') {
      presetData.startingScore = target;
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

      reader.onerror = () => {
        alert('❌ Errore lettura file. Il file potrebbe essere corrotto o non leggibile.');
      };

      const timeout = setTimeout(() => {
        reader.abort();
        alert('⏱️ Timeout: File troppo grande o lettura bloccata.');
      }, 10000);

      reader.onload = (event) => {
        clearTimeout(timeout);
        try {
          const result = PresetManagerModule.importPresets(event.target.result);
          alert(`✅ Import completato!\nImportati: ${result.imported}\nIgnorati: ${result.skipped}`);
          renderPresetList();
        } catch (error) {
          alert('❌ ' + error.message);
        }
      };

      reader.onloadend = () => {
        clearTimeout(timeout);
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
    cleanup();

    const btnCreate = document.getElementById('btn-create-preset');
    if (btnCreate) {
      eventHandlers.btnCreateClick = () => {
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

        showCreateModal();
      };
      btnCreate.addEventListener('click', eventHandlers.btnCreateClick);
    }

    const btnCloseModal = document.getElementById('btn-close-preset-modal');
    if (btnCloseModal) {
      eventHandlers.btnCloseModalClick = closeModal;
      btnCloseModal.addEventListener('click', eventHandlers.btnCloseModalClick);
    }

    const btnSavePreset = document.getElementById('btn-save-preset');
    if (btnSavePreset) {
      eventHandlers.btnSavePresetClick = savePreset;
      btnSavePreset.addEventListener('click', eventHandlers.btnSavePresetClick);
    }

    const modeSelect = document.getElementById('preset-mode');
    if (modeSelect) {
      eventHandlers.modeSelectChange = (e) => {
        toggleRoundsFields(e.target.value);
      };
      modeSelect.addEventListener('change', eventHandlers.modeSelectChange);
    }

    const btnExport = document.getElementById('btn-export-presets');
    if (btnExport) {
      eventHandlers.btnExportClick = exportPresets;
      btnExport.addEventListener('click', eventHandlers.btnExportClick);
    }

    const btnImport = document.getElementById('btn-import-presets');
    if (btnImport) {
      eventHandlers.btnImportClick = importPresets;
      btnImport.addEventListener('click', eventHandlers.btnImportClick);
    }

    const btnRestore = document.getElementById('btn-restore-defaults');
    if (btnRestore) {
      eventHandlers.btnRestoreClick = restoreDefaults;
      btnRestore.addEventListener('click', eventHandlers.btnRestoreClick);
    }
  };

  const cleanup = () => {
    if (eventHandlers.btnCreateClick) {
      const btnCreate = document.getElementById('btn-create-preset');
      if (btnCreate) {
        btnCreate.removeEventListener('click', eventHandlers.btnCreateClick);
      }
      eventHandlers.btnCreateClick = null;
    }

    if (eventHandlers.btnCloseModalClick) {
      const btnCloseModal = document.getElementById('btn-close-preset-modal');
      if (btnCloseModal) {
        btnCloseModal.removeEventListener('click', eventHandlers.btnCloseModalClick);
      }
      eventHandlers.btnCloseModalClick = null;
    }

    if (eventHandlers.btnSavePresetClick) {
      const btnSavePreset = document.getElementById('btn-save-preset');
      if (btnSavePreset) {
        btnSavePreset.removeEventListener('click', eventHandlers.btnSavePresetClick);
      }
      eventHandlers.btnSavePresetClick = null;
    }

    if (eventHandlers.modeSelectChange) {
      const modeSelect = document.getElementById('preset-mode');
      if (modeSelect) {
        modeSelect.removeEventListener('change', eventHandlers.modeSelectChange);
      }
      eventHandlers.modeSelectChange = null;
    }

    if (eventHandlers.btnExportClick) {
      const btnExport = document.getElementById('btn-export-presets');
      if (btnExport) {
        btnExport.removeEventListener('click', eventHandlers.btnExportClick);
      }
      eventHandlers.btnExportClick = null;
    }

    if (eventHandlers.btnImportClick) {
      const btnImport = document.getElementById('btn-import-presets');
      if (btnImport) {
        btnImport.removeEventListener('click', eventHandlers.btnImportClick);
      }
      eventHandlers.btnImportClick = null;
    }

    if (eventHandlers.btnRestoreClick) {
      const btnRestore = document.getElementById('btn-restore-defaults');
      if (btnRestore) {
        btnRestore.removeEventListener('click', eventHandlers.btnRestoreClick);
      }
      eventHandlers.btnRestoreClick = null;
    }

    Logger.log('✅ PresetUIModule cleanup completato');
  };

  return {
    renderPresetList,
    setupEventListeners,
    cleanup,
    updateCreateButtonState
  };
})();

window.PresetManager = PresetManagerModule;
window.PresetUI = PresetUIModule;