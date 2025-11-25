// ===================================================================
// 🎮 PRESET MANAGER MODULE v1.3.4 - FIX CRITICO DARTS
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
      mode: 'darts', 
      target: 501, 
      description: '🎯 Freccette 501: Si parte da 501, vince chi arriva esattamente a 0. Se vai sotto zero, torni al punteggio precedente.',
      isDefault: true,
      category: 'altri',
      startingScore: 501 // 🎯 Campo essenziale per DARTS
    },
    freccette301: { 
      name: 'Freccette 301', 
      mode: 'darts', 
      target: 301, 
      description: '🎯 Freccette 301: Si parte da 301, vince chi arriva esattamente a 0. Se vai sotto zero, torni al punteggio precedente.',
      isDefault: true,
      category: 'altri',
      startingScore: 301 // 🎯 Campo essenziale per DARTS
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

  // ✅ NUOVO v1.3.3: Funzione per generare codice preset automatico da nome
  const generatePresetKey = (name) => {
    if (!name || typeof name !== 'string') {
      return `custom_${Date.now()}`;
    }
    
    // Converti in slug: rimuovi caratteri speciali, lowercase, sostituisci spazi con _
    let slug = name
      .toLowerCase()
      .trim()
      // Normalizza caratteri accentati
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[^a-z0-9\s]/g, '') // Rimuovi caratteri speciali
      .replace(/\s+/g, '_'); // Sostituisci spazi con underscore
    
    // Se troppo lungo, tronca
    if (slug.length > 30) {
      slug = slug.substring(0, 30);
    }
    
    // Se vuoto dopo cleaning, usa timestamp
    if (!slug || slug === '') {
      slug = `custom_${Date.now()}`;
    }
    
    // Assicurati che sia unico
    const allPresets = getAllPresets();
    let finalKey = slug;
    let counter = 1;

    // ✅ FIX BUG #30: Limite massimo iterazioni per prevenire infinite loop
    const MAX_ITERATIONS = 1000;
    let iterations = 0;

    while (allPresets[finalKey] && iterations < MAX_ITERATIONS) {
      finalKey = `${slug}_${counter}`;
      counter++;
      iterations++;
    }

    // ✅ FIX BUG #30: Fallback con timestamp se raggiunto limite
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
    // ✅ NUOVO v1.3.3: Auto-genera key se non fornita o vuota
    const key = (keyOrNull && keyOrNull.trim() !== '') ? keyOrNull : generatePresetKey(presetData.name);

    // ✅ FIX #22: Lista chiavi riservate JavaScript
    const RESERVED_KEYS = ['__proto__', 'constructor', 'prototype', 'default', 'toString', 'valueOf', 'hasOwnProperty'];

    // ✅ FIX #22 + BUG #39: Validazione formato key rafforzata
    // - Deve iniziare con lettera (non numero/underscore)
    // - Solo lettere minuscole, numeri, underscore
    // - Non può essere una chiave riservata
    // - Lunghezza massima 50 caratteri
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

    // ✅ FIX BUG #37: Validazione name più rigorosa
    const safeName = presetData.name.trim().slice(0, 50);
    if (!/^[\p{L}\p{N}\s'\-]+$/u.test(safeName)) {
      throw new Error('Il nome può contenere solo lettere, numeri, spazi, apostrofi e trattini');
    }

    // ✅ FIX BUG #37: Rimuovi HTML tags per sicurezza
    if (/<[^>]*>/g.test(safeName)) {
      throw new Error('Il nome non può contenere tag HTML');
    }

    if (!['max', 'min', 'rounds', 'darts'].includes(presetData.mode)) {
      throw new Error('La modalità deve essere "max", "min", "rounds" o "darts"');
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
    
    // 🎯 Validazione darts
    if (presetData.mode === 'darts') {
        if (target <= 0) {
            throw new Error('Per la modalità freccette (darts), il punteggio di partenza deve essere positivo');
        }
    }

    if (DEFAULT_PRESETS[key]) {
      throw new Error('Non puoi sovrascrivere un preset predefinito. Usa un altro codice.');
    }

    const customPresets = loadCustomPresets();
    
    // 🆕 Genera descrizione più dettagliata per rounds e darts
    let autoDescription = '';
    if (presetData.mode === 'rounds') {
      const roundModeText = presetData.roundMode === 'max' ? 'più punti' : 'meno punti';
      autoDescription = `${safeName} - Ogni round finisce a ${target} punti (vince chi fa ${roundModeText}). Vince chi vince ${presetData.roundsTarget} round.`;
    } else if (presetData.mode === 'darts') { 
      autoDescription = `${safeName} - 🎯 Partenza da ${target}, vince chi arriva a 0.`;
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

    // 🆕 Salva campi specifici per modalità (rounds e darts)
    if (presetData.mode === 'rounds') {
      newPreset.roundMode = presetData.roundMode;
      newPreset.roundsTarget = parseInt(presetData.roundsTarget, 10);
    } else if (presetData.mode === 'darts') { 
      // ✅ FIX CRITICO: Aggiungi startingScore per la modalità darts
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

    if (!['max', 'min', 'rounds', 'darts'].includes(presetData.mode)) {
      throw new Error('La modalità deve essere "max", "min", "rounds" o "darts"');
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
    
    // 🎯 Validazione darts
    if (presetData.mode === 'darts') {
        if (target <= 0) {
            throw new Error('Per la modalità freccette (darts), il punteggio di partenza deve essere positivo');
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

    // 🆕 Gestisci roundMode, roundsTarget e startingScore (per darts)
    if (presetData.mode === 'rounds') {
      customPresets[key].roundMode = presetData.roundMode;
      customPresets[key].roundsTarget = parseInt(presetData.roundsTarget, 10);
      delete customPresets[key].startingScore; // Cleanup se era darts o max/min
    } else if (presetData.mode === 'darts') {
      // ✅ FIX CRITICO: Usa target come startingScore per la modalità darts
      customPresets[key].startingScore = target; 
      delete customPresets[key].roundMode; // Cleanup se era rounds
      delete customPresets[key].roundsTarget; // Cleanup se era rounds
    } else {
      delete customPresets[key].roundMode;
      delete customPresets[key].roundsTarget;
      delete customPresets[key].startingScore; // Cleanup per max/min
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
      // ✅ NUOVO v1.3.3: Aggiorna contatore dopo delete
      if (typeof window !== 'undefined' && window.PresetUI) {
        window.PresetUI.updateCreateButtonState();
      }
      return true;
    } else {
      throw new Error('Errore nell\'eliminazione del preset');
    }
  };

  const canCreateNewPreset = () => {
    // Utenti premium hanno limite superiore (e gestito dal billing module)
    if (typeof window !== 'undefined' && window.BillingModule && window.BillingModule.isPremium()) {
      return true; 
    }
    
    // Utenti free: limite di FREE_CUSTOM_LIMIT
    const customPresets = loadCustomPresets();
    const currentCount = Object.keys(customPresets).length;
    return currentCount < FREE_CUSTOM_LIMIT;
  };
  
  const getPreset = (key) => {
    const all = getAllPresets();
    const preset = all[key];
    if (!preset) {
      throw new Error(`Preset con chiave "${key}" non trovato.`);
    }
    return { key, ...preset };
  };

  // ------------------------------------------------------------------
  // 💾 EXPORT/IMPORT
  // ------------------------------------------------------------------
  
  const exportPresets = () => {
    try {
      const customPresets = loadCustomPresets();
      if (Object.keys(customPresets).length === 0) {
        return null;
      }
      return JSON.stringify(customPresets, null, 2);
    } catch (error) {
      Logger.error('Errore durante l\'export dei preset:', error);
      throw new Error('Impossibile esportare i preset');
    }
  };

  const importPresets = (jsonString) => {
    try {
      const importedPresets = JSON.parse(jsonString);
      
      if (typeof importedPresets !== 'object' || importedPresets === null) {
        throw new Error('Formato dati non valido: non è un oggetto');
      }
      
      const customPresets = loadCustomPresets();
      let importedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;
      
      const allPresets = getAllPresets();

      for (const [key, data] of Object.entries(importedPresets)) {
        // Ignora preset predefiniti o già esistenti (con la stessa key)
        if (DEFAULT_PRESETS[key] || allPresets[key]) {
          skippedCount++;
          continue;
        }

        try {
            // Validazione minima per l'import (più leggera che per la creazione)
            if (!data.name || !data.mode || typeof data.target !== 'number') {
                failedCount++;
                continue;
            }
            
            // Cleanup e normalizzazione (es. garantisci che non sia un default)
            data.isDefault = false;
            data.category = data.category || 'custom';
            data.createdAt = data.createdAt || Date.now();
            data.modifiedAt = Date.now();
            
            // ✅ FIX CRITICO: Assicurati che startingScore sia presente per darts
            if (data.mode === 'darts' && !data.startingScore) {
                data.startingScore = data.target;
            }
            
            // Pulisci campi specifici se il mode è cambiato
            if (data.mode !== 'rounds') {
                delete data.roundMode;
                delete data.roundsTarget;
            }
            if (data.mode !== 'darts') {
                delete data.startingScore;
            }


            customPresets[key] = data;
            importedCount++;

        } catch (e) {
            Logger.warn(`Errore durante l'import del preset ${key}:`, e.message);
            failedCount++;
        }
      }

      if (saveCustomPresets(customPresets)) {
        // ✅ NUOVO v1.3.3: Aggiorna stato dopo import
        if (typeof window !== 'undefined' && window.PresetUI) {
          window.PresetUI.updateCreateButtonState();
        }
        return { imported: importedCount, skipped: skippedCount, failed: failedCount };
      } else {
        throw new Error('Errore nel salvataggio dei preset importati');
      }

    } catch (error) {
      Logger.error('Errore durante l\'import dei preset:', error);
      throw new Error(`Import fallito: ${error.message}`);
    }
  };
  
  // ------------------------------------------------------------------
  // ⚙️ UI Module (per interazione con preset-manager.html)
  // ------------------------------------------------------------------
  
  // Questo modulo gestisce solo la logica dei dati. 
  // La parte UI (PresetUIModule in segnapunti.js o preset-manager.html) 
  // si interfaccia con queste funzioni.

  return {
    getAllPresets,
    getPresetsByCategory,
    getPreset,
    createPreset,
    updatePreset,
    deletePreset,
    canCreateNewPreset,
    exportPresets,
    importPresets,
    DEFAULT_PRESETS,
    generatePresetKey, // Esposto per utilità di debug/test
    CATEGORY_ICONS // Esposto per la UI
  };
})();

// Export globale
if (typeof window !== 'undefined') {
  window.PresetManagerModule = PresetManagerModule;
}

// ===================================================================
// 🖥️ PRESET UI MODULE (Integra la logica del modulo dati)
// ===================================================================
// Questo è il modulo che si occupa di renderizzare la UI in preset-manager.html
const PresetUIModule = (() => {
  // Riferimenti agli elementi UI
  const presetListContainer = document.getElementById('preset-list-container');
  const modal = document.getElementById('preset-modal');
  const modalTitle = document.getElementById('preset-modal-title');
  const btnSavePreset = document.getElementById('btn-save-preset');
  const btnCreatePreset = document.getElementById('btn-create-preset');
  const modalForm = document.getElementById('preset-form');
  const modeSelect = document.getElementById('preset-mode');
  const roundsFields = document.getElementById('rounds-fields');
  const targetLabel = document.getElementById('target-label');
  const infoBox = document.getElementById('preset-info-box');
  const infoMessage = document.getElementById('preset-info-message');

  let currentEditingKey = null; // Mantiene la chiave del preset che si sta modificando
  const eventHandlers = {}; // Mappa per gestire la rimozione degli event listeners

  const showModal = (title, key = null, preset = {}) => {
    currentEditingKey = key;
    modalTitle.textContent = title;
    
    // Resetta il form
    modalForm.reset();
    
    // Pre-popola se è in modalità modifica
    if (key && preset.name) {
      document.getElementById('preset-code').value = key;
      document.getElementById('preset-code').disabled = true; // Non si cambia la key in modifica
      
      document.getElementById('preset-name').value = preset.name;
      modeSelect.value = preset.mode;
      document.getElementById('preset-target').value = preset.target;
      document.getElementById('preset-description').value = preset.description || '';
      document.getElementById('preset-category').value = preset.category || 'custom';
      
      // Campi rounds
      document.getElementById('rounds-target').value = preset.roundsTarget || 0;
      document.getElementById('round-mode-max').checked = preset.roundMode === 'max';
      document.getElementById('round-mode-min').checked = preset.roundMode === 'min';

    } else {
      // Modalità creazione
      document.getElementById('preset-code').value = '';
      document.getElementById('preset-code').disabled = false;
      // Imposta i valori di default per la creazione
      modeSelect.value = 'max';
      document.getElementById('preset-target').value = 10;
      document.getElementById('preset-category').value = 'altri';
      // Nascondi rounds fields inizialmente
      roundsFields.style.display = 'none';
      targetLabel.textContent = 'Punteggio Obiettivo / Punteggio Round';
    }

    // Aggiorna la UI in base alla modalità selezionata
    handleModeChange(modeSelect.value);

    modal.classList.add('is-active');
    setTimeout(() => {
        modal.querySelector('.modal-content-wrapper').classList.add('is-open');
        // Focus sul primo campo
        document.getElementById('preset-name').focus();
    }, 10);
  };

  const hideModal = () => {
    modal.querySelector('.modal-content-wrapper').classList.remove('is-open');
    setTimeout(() => {
      modal.classList.remove('is-active');
      currentEditingKey = null;
    }, 300); // 300ms per l'animazione
  };
  
  const handleModeChange = (mode) => {
    if (mode === 'rounds') {
      roundsFields.style.display = 'block';
      targetLabel.textContent = 'Punteggio Obiettivo Round';
      // Inizializza i valori di rounds se sono vuoti
      if (!document.getElementById('rounds-target').value || document.getElementById('rounds-target').value == 0) {
        document.getElementById('rounds-target').value = 3; 
      }
      if (!document.getElementById('preset-target').value || document.getElementById('preset-target').value == 0) {
        document.getElementById('preset-target').value = 10;
      }
    } else if (mode === 'darts') {
      // ✅ FIX UI: Nascondi campi Rounds
      roundsFields.style.display = 'none';
      targetLabel.textContent = 'Punteggio di Partenza (es. 501, 301)';
      // Valore di default per darts
      if (!currentEditingKey || document.getElementById('preset-target').value == 0) {
        document.getElementById('preset-target').value = 501;
      }
    } else {
      roundsFields.style.display = 'none';
      targetLabel.textContent = 'Punteggio Obiettivo';
      // Valore di default per max/min
      if (!currentEditingKey || document.getElementById('preset-target').value == 0) {
        document.getElementById('preset-target').value = 10;
      }
    }
  };

  const renderPresetCard = (key, preset) => {
    const isCustom = !preset.isDefault;
    const categoryIcon = PresetManagerModule.CATEGORY_ICONS[preset.category] || PresetManagerModule.CATEGORY_ICONS['altri'];
    
    // 🆕 Visualizzazione corretta per rounds e darts
    let modeDisplay = '';
    if (preset.mode === 'rounds') {
      const modeText = preset.roundMode === 'max' ? 'Max' : 'Min';
      modeDisplay = `ROUND: ${modeText} a ${preset.target} (Migliore di ${preset.roundsTarget})`;
    } else if (preset.mode === 'darts') {
      modeDisplay = `DARTS: Start da ${preset.startingScore} (Target 0)`;
    } else {
      modeDisplay = `MODALITÀ: ${preset.mode === 'max' ? 'Vince chi fa più punti' : 'Vince chi fa meno punti'} (Target ${preset.target})`;
    }

    return `
      <div class="preset-card animate__animated animate__fadeInUp" data-key="${key}" data-category="${preset.category}">
        <div class="preset-header">
          <span class="preset-category-icon">${categoryIcon}</span>
          <h3 class="preset-title">${preset.name}</h3>
        </div>
        <p class="preset-description">${preset.description}</p>
        <div class="preset-details">
          <span class="preset-mode"><strong>${preset.mode.toUpperCase()}</strong></span>
          <span class="preset-target">${modeDisplay}</span>
        </div>
        <div class="preset-actions">
          <button class="btn btn-apply" data-key="${key}">Applica</button>
          ${isCustom ? `
            <button class="btn btn-edit" data-key="${key}" aria-label="Modifica ${preset.name}"><span aria-hidden="true">✏️</span></button>
            <button class="btn btn-delete" data-key="${key}" aria-label="Elimina ${preset.name}"><span aria-hidden="true">🗑️</span></button>
          ` : ''}
        </div>
      </div>
    `;
  };

  const renderPresetList = () => {
    if (!presetListContainer) return;
    
    presetListContainer.innerHTML = '';
    const categories = PresetManagerModule.getPresetsByCategory();

    Object.entries(categories).forEach(([category, presets]) => {
      // Ordina i preset: prima i default, poi i custom per data di modifica
      presets.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        if (a.isDefault && b.isDefault) return 0;
        return (b.modifiedAt || b.createdAt) - (a.modifiedAt || a.createdAt); // Custom: più recenti prima
      });
      
      const categoryTitle = category === 'custom' ? '⭐ I tuoi Preset' : category.charAt(0).toUpperCase() + category.slice(1);
      
      const categorySection = document.createElement('section');
      categorySection.className = 'preset-category-section';
      categorySection.innerHTML = `<h2>${categoryTitle}</h2>`;
      
      const listDiv = document.createElement('div');
      listDiv.className = 'preset-cards-grid';

      presets.forEach(preset => {
        listDiv.innerHTML += renderPresetCard(preset.key, preset);
      });
      
      categorySection.appendChild(listDiv);
      presetListContainer.appendChild(categorySection);
    });

    // Aggiorna lo stato del pulsante "Crea Nuovo"
    updateCreateButtonState();
  };
  
  const updateCreateButtonState = () => {
    if (!btnCreatePreset) return;
    
    if (!PresetManagerModule.canCreateNewPreset()) {
      btnCreatePreset.disabled = true;
      btnCreatePreset.textContent = '❌ Limite Preset Raggiunto';
      if (typeof window !== 'undefined' && window.BillingModule && !window.BillingModule.isPremium()) {
         btnCreatePreset.title = 'Sblocca preset illimitati con Premium!';
      } else {
         btnCreatePreset.title = 'Limite massimo di preset raggiunto.';
      }
      
    } else {
      btnCreatePreset.disabled = false;
      btnCreatePreset.textContent = '➕ Crea Nuovo Preset';
      btnCreatePreset.title = 'Crea un nuovo preset personalizzato';
    }
  };

  // ------------------------------------------------------------------
  // 💾 HANDLERS
  // ------------------------------------------------------------------
  
  const handleBtnSavePresetClick = (e) => {
    e.preventDefault();
    const formData = new FormData(modalForm);
    const presetData = Object.fromEntries(formData.entries());

    // Seleziona correttamente roundMode
    presetData.roundMode = modalForm.querySelector('input[name="roundMode"]:checked')?.value;
    
    const isUpdate = !!currentEditingKey;
    const key = document.getElementById('preset-code').value.trim();

    try {
      if (isUpdate) {
        PresetManagerModule.updatePreset(currentEditingKey, presetData);
        Toast.show('Preset aggiornato con successo!', 'success');
      } else {
        PresetManagerModule.createPreset(key, presetData);
        Toast.show('Preset creato con successo!', 'success');
      }
      
      renderPresetList();
      hideModal();

    } catch (error) {
      Logger.error('Errore durante il salvataggio del preset:', error);
      Toast.show(error.message, 'error');
    }
  };

  const handleApplyPreset = async (e) => {
    const key = e.target.dataset.key;
    if (!key) return;

    try {
      const preset = PresetManagerModule.getPreset(key);
      
      // Salva il preset selezionato per l'app principale
      StorageHelper.setItem('selected_preset_key', key);

      Toast.show(`Preset "${preset.name}" applicato!`, 'info');
      
      // ✅ FIX #21: Reindirizza alla pagina principale dopo un breve timeout per mostrare il toast
      await new Promise(resolve => setTimeout(resolve, 500)); 
      window.location.href = 'index.html';

    } catch (error) {
      Logger.error('Errore nell\'applicazione del preset:', error);
      Toast.show(error.message, 'error');
    }
  };

  const handleDeletePreset = (e) => {
    const key = e.target.dataset.key;
    if (!key) return;

    ConfirmModal.show({
      title: 'Conferma Eliminazione',
      message: `Sei sicuro di voler eliminare il preset "${PresetManagerModule.getPreset(key).name}"? Questa azione è irreversibile.`,
      confirmText: 'Sì, Elimina',
      onConfirm: () => {
        try {
          PresetManagerModule.deletePreset(key);
          renderPresetList();
          Toast.show('Preset eliminato con successo.', 'success');
        } catch (error) {
          Logger.error('Errore durante l\'eliminazione:', error);
          Toast.show(error.message, 'error');
        }
      }
    });
  };

  const handleEditPreset = (e) => {
    const key = e.target.dataset.key;
    if (!key) return;

    try {
      const preset = PresetManagerModule.getPreset(key);
      showModal('Modifica Preset', key, preset);
    } catch (error) {
      Toast.show(error.message, 'error');
    }
  };
  
  const handleBtnExportClick = () => {
    try {
      const json = PresetManagerModule.exportPresets();
      if (!json) {
        Toast.show('Non ci sono preset personalizzati da esportare.', 'warning');
        return;
      }
      
      // Crea un blob e un link per il download
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `segnapunti_presets_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      Toast.show('Preset esportati con successo!', 'success');
    } catch (error) {
      Toast.show(error.message, 'error');
    }
  };
  
  const handleBtnImportClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';
    
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonString = event.target.result;
          const result = PresetManagerModule.importPresets(jsonString);
          
          let message = `Import completato: ${result.imported} importati, ${result.skipped} saltati, ${result.failed} falliti.`;
          Toast.show(message, 'success');
          renderPresetList();
          
        } catch (error) {
          Toast.show(error.message, 'error');
        }
      };
      reader.onerror = () => {
        Toast.show('Errore nella lettura del file.', 'error');
      };
      
      reader.readAsText(file);
    };
    
    fileInput.click();
  };
  
  const handleBtnRestoreClick = () => {
    ConfirmModal.show({
      title: 'Ripristina Preset',
      message: 'Sei sicuro di voler ripristinare i preset predefiniti? Tutti i tuoi preset personalizzati verranno eliminati.',
      confirmText: 'Sì, Ripristina',
      onConfirm: () => {
        try {
          // Basta eliminare la chiave custom_presets dal localStorage
          StorageHelper.removeItem(PresetManagerModule.PRESET_STORAGE_KEY);
          renderPresetList();
          Toast.show('Preset ripristinati. I preset personalizzati sono stati eliminati.', 'success');
        } catch (error) {
          Logger.error('Errore nel ripristino dei preset:', error);
          Toast.show('Errore nel ripristino dei preset.', 'error');
        }
      }
    });
  };


  const setupEventListeners = () => {
    // 1. Modale
    const modalCloseButton = document.getElementById('modal-close-btn');
    if (modalCloseButton) {
      modalCloseButton.addEventListener('click', hideModal);
      eventHandlers.modalCloseButton = hideModal;
    }
    
    // 2. Pulsante Crea Nuovo Preset
    if (btnCreatePreset) {
      const handler = () => showModal('Crea Nuovo Preset');
      btnCreatePreset.addEventListener('click', handler);
      eventHandlers.btnCreatePresetClick = handler;
    }
    
    // 3. Pulsante Salva Preset nel modale
    if (btnSavePreset) {
      btnSavePreset.addEventListener('click', handleBtnSavePresetClick);
      eventHandlers.btnSavePresetClick = handleBtnSavePresetClick;
    }

    // 4. Cambiamento modalità nel modale
    if (modeSelect) {
      const handler = (e) => handleModeChange(e.target.value);
      modeSelect.addEventListener('change', handler);
      eventHandlers.modeSelectChange = handler;
    }

    // 5. Azioni sulle card (Applica, Modifica, Elimina)
    if (presetListContainer) {
      const handler = (e) => {
        if (e.target.classList.contains('btn-apply')) {
          handleApplyPreset(e);
        } else if (e.target.classList.contains('btn-delete') || e.target.closest('.btn-delete')) {
          handleDeletePreset(e);
        } else if (e.target.classList.contains('btn-edit') || e.target.closest('.btn-edit')) {
          handleEditPreset(e);
        }
      };
      presetListContainer.addEventListener('click', handler);
      eventHandlers.presetCardActions = handler;
    }
    
    // 6. Pulsanti Export/Import/Restore
    const btnExport = document.getElementById('btn-export-presets');
    if (btnExport) {
      btnExport.addEventListener('click', handleBtnExportClick);
      eventHandlers.btnExportClick = handleBtnExportClick;
    }
    
    const btnImport = document.getElementById('btn-import-presets');
    if (btnImport) {
      btnImport.addEventListener('click', handleBtnImportClick);
      eventHandlers.btnImportClick = handleBtnImportClick;
    }
    
    const btnRestore = document.getElementById('btn-restore-defaults');
    if (btnRestore) {
      btnRestore.addEventListener('click', handleBtnRestoreClick);
      eventHandlers.btnRestoreClick = handleBtnRestoreClick;
    }
    
    // 7. Chiudi modale cliccando fuori
    if (modal) {
        const handler = (e) => {
            // Se cliccato sull'overlay ma non sul contenuto
            if (e.target === modal) {
                hideModal();
            }
        };
        modal.addEventListener('click', handler);
        eventHandlers.modalOverlayClick = handler;
    }


    Logger.log('✅ PresetUIModule event listeners configurati');
  };
  
  // ✅ FIX BUG #38: Metodo di cleanup per prevenire memory leak in SPAs
  const cleanup = () => {
    // Rimuovi listener sulla lista
    if (presetListContainer && eventHandlers.presetCardActions) {
      presetListContainer.removeEventListener('click', eventHandlers.presetCardActions);
      eventHandlers.presetCardActions = null;
    }
    
    // Rimuovi listener sul modale
    const modalCloseButton = document.getElementById('modal-close-btn');
    if (modalCloseButton && eventHandlers.modalCloseButton) {
      modalCloseButton.removeEventListener('click', eventHandlers.modalCloseButton);
      eventHandlers.modalCloseButton = null;
    }
    if (modal && eventHandlers.modalOverlayClick) {
        modal.removeEventListener('click', eventHandlers.modalOverlayClick);
        eventHandlers.modalOverlayClick = null;
    }

    // Rimuovi listener sul pulsante Crea
    if (btnCreatePreset && eventHandlers.btnCreatePresetClick) {
      btnCreatePreset.removeEventListener('click', eventHandlers.btnCreatePresetClick);
      eventHandlers.btnCreatePresetClick = null;
    }
    
    // Rimuovi listener sul pulsante Salva
    if (btnSavePreset && eventHandlers.btnSavePresetClick) {
      btnSavePreset.removeEventListener('click', eventHandlers.btnSavePresetClick);
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
    cleanup, // ✅ FIX BUG #38: Esponi cleanup method
    updateCreateButtonState
  };
})();

// Export globale
if (typeof window !== 'undefined') {
  window.PresetManager = PresetManagerModule;
  window.PresetUI = PresetUIModule;
}
