// ===================================================================
// MODULE PATTERN ES6 - Segnapunti v1.0.9
// ===================================================================

// -------------------------------------------------------------------
// 🗄️ DATABASE MODULE - Gestione IndexedDB
// -------------------------------------------------------------------
const DatabaseModule = (() => {
  const DB_NAME = 'SegnapuntiDB';
  const DB_VERSION = 2;
  const STORE_NAME = 'stato_partita';
  const HISTORY_STORE_NAME = 'storico_partite';
  const STATE_KEY = 'current_state';

  let db = null;
  let dbPromise = null;

  const openDB = () => {
    if (dbPromise) return dbPromise;
    if (db) return Promise.resolve(db);

    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        db = event.target.result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(HISTORY_STORE_NAME)) {
          db.createObjectStore(HISTORY_STORE_NAME, { keyPath: 'timestamp' });
        }
      };

      request.onsuccess = (event) => {
        db = event.target.result;
        resolve(db);
      };

      request.onerror = (event) => {
        console.error("Errore IndexedDB:", event.target.errorCode);
        dbPromise = null;
        reject(new Error("Errore nell'apertura del database IndexedDB."));
      };
    });

    return dbPromise;
  };

  const loadState = async () => {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(STATE_KEY);

        transaction.onerror = () => {
          console.error('Errore durante il caricamento dello stato');
          resolve(null);
        };

        request.onsuccess = (event) => {
          resolve(event.target.result || null);
        };
        
        request.onerror = () => {
          console.error('Errore nella richiesta di caricamento');
          resolve(null);
        };
      });
    } catch (error) {
      console.error("Errore nel caricamento dello stato:", error);
      return null;
    }
  };

  const saveState = async (state) => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ id: STATE_KEY, ...state });
        
        transaction.onerror = () => {
          console.error('Errore durante il salvataggio dello stato');
          reject();
        };
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
      });
    } catch (error) {
      console.error("Errore nel salvataggio dello stato:", error);
    }
  };

  const saveHistory = async (partita) => {
    try {
      const db = await openDB();
      const transaction = db.transaction([HISTORY_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(HISTORY_STORE_NAME);
      await store.add(partita);
    } catch (error) {
      console.error("Errore nel salvataggio dello storico:", error);
    }
  };

  const loadHistory = async () => {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([HISTORY_STORE_NAME], 'readonly');
        const store = transaction.objectStore(HISTORY_STORE_NAME);
        const request = store.getAll();

        transaction.onerror = () => {
          console.error('Errore durante il caricamento dello storico');
          resolve([]);
        };

        request.onsuccess = (event) => {
          const storico = event.target.result.sort((a, b) => b.timestamp - a.timestamp);
          resolve(storico);
        };
        
        request.onerror = () => {
          console.error('Errore nella richiesta dello storico');
          resolve([]);
        };
      });
    } catch (error) {
      console.error("Errore nel caricamento dello storico:", error);
      return [];
    }
  };

  const requestPersistentStorage = async () => {
    if (navigator.storage && navigator.storage.persist) {
      try {
        const isPersisted = await navigator.storage.persisted();
        if (!isPersisted) {
          await navigator.storage.persist();
        }
      } catch (error) {
        console.error('Errore richiesta storage persistente:', error);
      }
    }
  };

  // Public API
  return {
    loadState,
    saveState,
    saveHistory,
    loadHistory,
    requestPersistentStorage
  };
})();

// -------------------------------------------------------------------
// 🎮 GAME STATE MODULE - Gestione stato del gioco
// -------------------------------------------------------------------
const GameStateModule = (() => {
  // Private state
  let modalitaVittoria = 'max';
  let punteggioObiettivo = 100;
  let giocatori = [];
  let partitaTerminata = false;

  // Utility per generare ID univoci
  const generatePlayerId = () => {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Getters
  const getModalitaVittoria = () => modalitaVittoria;
  const getPunteggioObiettivo = () => punteggioObiettivo;
  const getGiocatori = () => [...giocatori]; // Return copy
  const isPartitaTerminata = () => partitaTerminata;
  const getPresets = () => {
    // Usa il PresetManager se disponibile, altrimenti fallback vuoto
    if (window.PresetManager) {
      return window.PresetManager.getAllPresets();
    }
    return {};
  };

  // Setters
  const setModalitaVittoria = (value) => {
    modalitaVittoria = value;
    saveCurrentState();
  };

  const setPunteggioObiettivo = (value) => {
    const punti = parseInt(value, 10);
    if (isNaN(punti) || punti <= 0) {
      throw new Error('Il punteggio obiettivo deve essere un numero positivo.');
    }
    punteggioObiettivo = punti;
    saveCurrentState();
  };

  const setPartitaTerminata = (value) => {
    partitaTerminata = value;
  };

  // Giocatori management
  const addGiocatore = (nome) => {
    const nomeTrimmed = nome.trim().slice(0, 30);
    
    if (nomeTrimmed === '') {
      throw new Error("Inserisci un nome valido.");
    }

    if (nomeTrimmed.match(/[<>]/)) {
      throw new Error("Il nome non può contenere caratteri speciali come < o >");
    }

    const nomeNormalizzato = nomeTrimmed.replace(/\s+/g, ' ').toLowerCase();
    if (giocatori.some(g => g.nome.replace(/\s+/g, ' ').toLowerCase() === nomeNormalizzato)) {
      throw new Error("Questo nome esiste già!");
    }

    const newPlayer = {
      id: generatePlayerId(),
      nome: nomeTrimmed,
      punti: 0,
      createdAt: Date.now()
    };
    
    giocatori.push(newPlayer);
    saveCurrentState();
    
    return newPlayer;
  };

  const removeGiocatore = (playerId) => {
    const index = giocatori.findIndex(g => g.id === playerId);
    if (index !== -1) {
      giocatori.splice(index, 1);
      saveCurrentState();
      return true;
    }
    return false;
  };

  const updatePunteggio = (playerId, delta) => {
    if (partitaTerminata) return false;
    
    const giocatore = giocatori.find(g => g.id === playerId);
    if (giocatore) {
      giocatore.punti += delta;
      saveCurrentState();
      return true;
    }
    return false;
  };
  
  const getGiocatoreById = (playerId) => {
    return giocatori.find(g => g.id === playerId) || null;
  };

  const resetPunteggi = () => {
    giocatori.forEach(g => g.punti = 0);
    partitaTerminata = false;
    saveCurrentState();
  };

  // Preset application
  const applyPreset = (presetKey) => {
    const presets = getPresets();
    const preset = presets[presetKey];
    if (!preset) return null;
    
    modalitaVittoria = preset.mode;
    punteggioObiettivo = preset.target;
    saveCurrentState();
    
    return preset;
  };

  // Victory logic
  const checkVittoria = () => {
    if (giocatori.length === 0) {
      return { hasWinner: false, vincitori: [], puntiVincitore: 0 };
    }

    const puntiMappa = giocatori.map(g => g.punti);
    const maxPunti = Math.max(...puntiMappa);
    const minPunti = Math.min(...puntiMappa);

    let vincitori = [];
    let puntiVincitore = 0;
    let hasWinner = false;

    if (modalitaVittoria === 'max' && maxPunti >= punteggioObiettivo) {
      hasWinner = true;
      vincitori = giocatori.filter(g => g.punti === maxPunti).map(g => g.nome);
      puntiVincitore = maxPunti;
    } else if (modalitaVittoria === 'min' && maxPunti >= punteggioObiettivo) {
      hasWinner = true;
      vincitori = giocatori.filter(g => g.punti === minPunti).map(g => g.nome);
      puntiVincitore = minPunti;
    }

    return { hasWinner, vincitori, puntiVincitore, maxPunti, minPunti };
  };

  // State persistence
  const saveCurrentState = () => {
    const darkMode = document.body.classList.contains('dark-mode');
    DatabaseModule.saveState({
      modalitaVittoria,
      punteggioObiettivo,
      giocatori,
      partitaTerminata,
      darkMode
    });
  };

  const loadFromState = (state) => {
    if (state) {
      modalitaVittoria = state.modalitaVittoria || 'max';
      punteggioObiettivo = state.punteggioObiettivo || 100;
      giocatori = state.giocatori || [];
      partitaTerminata = state.partitaTerminata || false;
      
      // Migrazione: aggiungi ID ai giocatori esistenti senza ID
      giocatori = giocatori.map(g => {
        if (!g.id) {
          return {
            ...g,
            id: generatePlayerId(),
            createdAt: Date.now()
          };
        }
        return g;
      });
      
      if (state.darkMode) {
        document.body.classList.add('dark-mode');
      }
    }
  };

  const saveToHistory = async (vincitori, puntiVincitore) => {
    const partita = {
      timestamp: Date.now(),
      data: new Date().toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }),
      vincitori: vincitori,
      puntiVincitore: puntiVincitore,
      modalita: modalitaVittoria,
      giocatori: giocatori.map(g => ({ nome: g.nome, punti: g.punti }))
    };
    
    await DatabaseModule.saveHistory(partita);
  };

  // Public API
  return {
    // Getters
    getModalitaVittoria,
    getPunteggioObiettivo,
    getGiocatori,
    isPartitaTerminata,
    getPresets,
    // Setters
    setModalitaVittoria,
    setPunteggioObiettivo,
    setPartitaTerminata,
    // Giocatori
    addGiocatore,
    removeGiocatore,
    updatePunteggio,
    getGiocatoreById,
    resetPunteggi,
    // Preset
    applyPreset,
    // Victory
    checkVittoria,
    // Persistence
    saveCurrentState,
    loadFromState,
    saveToHistory
  };
})();

// -------------------------------------------------------------------
// 🎨 UI MODULE - Gestione interfaccia utente
// -------------------------------------------------------------------
const UIModule = (() => {
  let currentButtonListeners = [];
  let activeAnimations = new Set();
  let globalPlayerIdToUpdate = null; // Cambiato da Index a ID

  // DOM Elements cache
  const elements = {
    modal: null,
    modalTitle: null,
    modalInput: null,
    loader: null,
    winnerMessage: null,
    gameOverActions: null,
    giocatoriListaPartita: null,
    giocatoriListaSettings: null,
    storicoLista: null
  };

  const cacheElements = () => {
    elements.modal = document.getElementById('modal-overlay');
    elements.modalTitle = document.getElementById('modal-title-player-name');
    elements.modalInput = document.getElementById('punteggio-input-custom');
    elements.loader = document.getElementById('loader-overlay');
    elements.winnerMessage = document.getElementById('winner-message');
    elements.gameOverActions = document.getElementById('game-over-actions');
    elements.giocatoriListaPartita = document.getElementById('giocatori-lista-partita');
    elements.giocatoriListaSettings = document.getElementById('giocatori-lista-settings');
    elements.storicoLista = document.getElementById('storico-lista');
  };

  // Cleanup
  const cleanupButtonListeners = () => {
    currentButtonListeners.forEach(({ element, event, handler }) => {
      if (element) {
        element.removeEventListener(event, handler);
      }
    });
    currentButtonListeners = [];
  };

  // Animations
  const animatePunteggio = (playerId, delta) => {
    const puntiElement = document.getElementById(`punti-${playerId}`);
    if (!puntiElement) return;
    
    const strongElement = puntiElement.querySelector('strong');
    if (!strongElement) return;
    
    const animKey = `anim-${playerId}`;
    if (activeAnimations.has(animKey)) return;
    
    activeAnimations.add(animKey);
    
    const animClass = delta >= 0 ? 'anim-up' : 'anim-down';
    
    puntiElement.classList.remove('anim-up', 'anim-down');
    void puntiElement.offsetWidth;
    puntiElement.classList.add(animClass);
    
    const giocatore = GameStateModule.getGiocatoreById(playerId);
    if (giocatore) {
      strongElement.textContent = giocatore.punti;
    }
    
    // Floating number
    const floatingNumber = document.createElement('span');
    floatingNumber.className = `floating-number ${delta >= 0 ? 'positive' : 'negative'}`;
    floatingNumber.textContent = delta >= 0 ? `+${delta}` : delta;
    
    const rect = strongElement.getBoundingClientRect();
    floatingNumber.style.position = 'fixed';
    floatingNumber.style.left = `${rect.right + 10}px`;
    floatingNumber.style.top = `${rect.top}px`;
    
    document.body.appendChild(floatingNumber);
    
    const removeFloating = setTimeout(() => {
      if (floatingNumber && floatingNumber.parentNode) {
        floatingNumber.parentNode.removeChild(floatingNumber);
      }
    }, 1200);
    
    const cleanup = () => {
      puntiElement.classList.remove(animClass);
      activeAnimations.delete(animKey);
    };
    
    puntiElement.addEventListener('animationend', cleanup, { once: true });
    
    setTimeout(() => {
      cleanup();
      clearTimeout(removeFloating);
    }, 500);
  };

  // Modal
  const showModal = (playerId) => {
    if (GameStateModule.isPartitaTerminata()) return;
    
    const giocatore = GameStateModule.getGiocatoreById(playerId);
    if (!giocatore) return;
    
    globalPlayerIdToUpdate = playerId;
    
    if (elements.modal && elements.modalTitle && elements.modalInput) {
      elements.modalTitle.textContent = `Aggiungi Punti a ${giocatore.nome}`;
      elements.modalInput.value = '';
      elements.modal.style.display = 'flex';
      
      setTimeout(() => elements.modalInput.focus(), 100);
    }
  };

  const hideModal = () => {
    if (elements.modal) {
      elements.modal.style.display = 'none';
    }
    globalPlayerIdToUpdate = null;
    
    if (elements.modalInput) {
      elements.modalInput.value = '';
    }
  };

  const applyCustomScore = (punti = null) => {
    if (!globalPlayerIdToUpdate || GameStateModule.isPartitaTerminata()) {
      hideModal();
      return;
    }
    
    let deltaPunti = 0;

    if (punti !== null && typeof punti === 'number') {
      deltaPunti = punti;
    } else {
      let val = parseInt(elements.modalInput.value, 10);
      
      if (isNaN(val) || elements.modalInput.value.trim() === '') {
        alert("Devi inserire un punteggio numerico valido.");
        elements.modalInput.focus();
        return;
      }
      
      if (val < -99999 || val > 99999) {
        alert("Il punteggio deve essere tra -99999 e 99999.");
        elements.modalInput.focus();
        return;
      }
      
      deltaPunti = val;
    }
    
    if (GameStateModule.updatePunteggio(globalPlayerIdToUpdate, deltaPunti)) {
      animatePunteggio(globalPlayerIdToUpdate, deltaPunti);
      renderGiocatoriPartita();
      checkAndDisplayVittoria();
    }
    
    hideModal();
  };

  // Render functions
  const renderGiocatoriPartita = () => {
    if (!elements.giocatoriListaPartita) return;

    cleanupButtonListeners();

    const giocatori = GameStateModule.getGiocatori();
    const modalita = GameStateModule.getModalitaVittoria();
    const partitaTerminata = GameStateModule.isPartitaTerminata();
    
    const giocatoriConId = giocatori.map(g => ({ ...g }));
    
    if (modalita === 'max') {
      giocatoriConId.sort((a, b) => b.punti - a.punti);
    } else {
      giocatoriConId.sort((a, b) => a.punti - b.punti);
    }

    elements.giocatoriListaPartita.innerHTML = '';
    
    if (giocatori.length === 0) {
      elements.giocatoriListaPartita.innerHTML = '<p class="empty-state">Nessun giocatore in partita. Aggiungine uno dalle impostazioni (⚙️).</p>';
      return;
    }

    giocatoriConId.forEach((g) => {
      const playerId = g.id;

      const li = document.createElement('li');
      li.className = `giocatore-item ${partitaTerminata ? 'game-over' : ''}`;
      li.id = `giocatore-${playerId}`;

      const nomeSpan = document.createElement('span');
      nomeSpan.className = 'giocatore-nome';
      nomeSpan.textContent = g.nome;

      const puntiEControlli = document.createElement('div');
      puntiEControlli.className = 'punti-e-controlli';

      const puntiSpan = document.createElement('span');
      puntiSpan.className = 'giocatore-punti';
      puntiSpan.id = `punti-${playerId}`;
      
      const puntiStrong = document.createElement('strong');
      puntiStrong.textContent = g.punti;
      puntiSpan.appendChild(puntiStrong);
      puntiSpan.appendChild(document.createTextNode(' Punti'));

      const controlsDiv = document.createElement('div');
      controlsDiv.className = 'punteggio-controls';

      const buttons = [
        { text: '+1', title: 'Aggiungi 1 punto', delta: 1 },
        { text: '-1', title: 'Rimuovi 1 punto', delta: -1 },
        { text: '+5', title: 'Aggiungi 5 punti', delta: 5 },
        { text: '-5', title: 'Rimuovi 5 punti', delta: -5 },
        { text: '+10', title: 'Aggiungi 10 punti', delta: 10 },
        { text: '-10', title: 'Rimuovi 10 punti', delta: -10 },
        { text: '±', title: 'Punteggio Personalizzato', delta: null, class: 'btn-custom-score' }
      ];

      buttons.forEach(btn => {
        const button = document.createElement('button');
        button.textContent = btn.text;
        button.title = btn.title;
        if (btn.class) button.className = btn.class;
        
        const handler = btn.delta !== null 
          ? () => {
              if (GameStateModule.updatePunteggio(playerId, btn.delta)) {
                animatePunteggio(playerId, btn.delta);
                renderGiocatoriPartita();
                checkAndDisplayVittoria();
              }
            }
          : () => showModal(playerId);
        
        button.addEventListener('click', handler);
        
        currentButtonListeners.push({ element: button, event: 'click', handler });
        controlsDiv.appendChild(button);
      });

      puntiEControlli.appendChild(puntiSpan);
      puntiEControlli.appendChild(controlsDiv);

      li.appendChild(nomeSpan);
      li.appendChild(puntiEControlli);
      elements.giocatoriListaPartita.appendChild(li);
    });
    
    checkAndDisplayVittoria();
  };

  const renderGiocatoriSettings = () => {
    if (!elements.giocatoriListaSettings) return;

    const giocatori = GameStateModule.getGiocatori();
    elements.giocatoriListaSettings.innerHTML = '';
    
    if (giocatori.length === 0) {
      elements.giocatoriListaSettings.innerHTML = '<p class="empty-state">Nessun giocatore in lista.</p>';
      return;
    }

    giocatori.forEach((g) => {
      const li = document.createElement('li');
      li.className = 'giocatore-item';
      
      const nomeSpan = document.createElement('span');
      nomeSpan.className = 'giocatore-nome';
      nomeSpan.textContent = g.nome;
      
      const puntiEControlli = document.createElement('div');
      puntiEControlli.className = 'punti-e-controlli';
      
      const puntiSpan = document.createElement('span');
      puntiSpan.className = 'giocatore-punti';
      puntiSpan.textContent = `${g.punti} Punti`;
      
      const controlsDiv = document.createElement('div');
      controlsDiv.className = 'punteggio-controls';
      
      const btnRimuovi = document.createElement('button');
      btnRimuovi.className = 'btn-rimuovi';
      btnRimuovi.title = 'Rimuovi giocatore';
      btnRimuovi.textContent = '🗑️ Rimuovi';
      btnRimuovi.addEventListener('click', () => {
        if (confirm(`Sei sicuro di voler rimuovere ${g.nome}?`)) {
          GameStateModule.removeGiocatore(g.id);
          renderGiocatoriSettings();
          if (elements.giocatoriListaPartita) {
            renderGiocatoriPartita();
          }
        }
      });
      
      controlsDiv.appendChild(btnRimuovi);
      puntiEControlli.appendChild(puntiSpan);
      puntiEControlli.appendChild(controlsDiv);
      
      li.appendChild(nomeSpan);
      li.appendChild(puntiEControlli);
      elements.giocatoriListaSettings.appendChild(li);
    });
  };

  const renderStorico = async () => {
    if (!elements.storicoLista) return;

    const storico = await DatabaseModule.loadHistory();
    elements.storicoLista.innerHTML = '';

    if (storico.length === 0) {
      elements.storicoLista.innerHTML = '<p class="empty-state">Nessuna partita nello storico.</p>';
      return;
    }

    storico.forEach(partita => {
      const li = document.createElement('li');
      li.className = 'storico-item';

      const header = document.createElement('div');
      header.className = 'storico-header';
      
      const vincitoreSpan = document.createElement('span');
      vincitoreSpan.className = 'storico-vincitore';
      vincitoreSpan.textContent = `🏆 ${partita.vincitori.join(', ')} (${partita.puntiVincitore})`;
      
      const dataSpan = document.createElement('span');
      dataSpan.className = 'storico-data';
      dataSpan.textContent = partita.data;
      
      header.appendChild(vincitoreSpan);
      header.appendChild(dataSpan);

      const details = document.createElement('div');
      details.className = 'storico-details';
      
      const modalitaP = document.createElement('p');
      modalitaP.innerHTML = `Modalità: <strong>${partita.modalita === 'max' ? 'Più punti' : 'Meno punti'}</strong>`;
      
      const partecipantiP = document.createElement('p');
      partecipantiP.textContent = 'Partecipanti:';
      
      const giocatoriUl = document.createElement('ul');
      giocatoriUl.className = 'giocatori-list';
      
      partita.giocatori.forEach(g => {
        const giocatoreLi = document.createElement('li');
        giocatoreLi.textContent = `${g.nome}: ${g.punti}`;
        giocatoriUl.appendChild(giocatoreLi);
      });
      
      details.appendChild(modalitaP);
      details.appendChild(partecipantiP);
      details.appendChild(giocatoriUl);
      
      li.appendChild(header);
      li.appendChild(details);
      elements.storicoLista.appendChild(li);
    });
  };

  const checkAndDisplayVittoria = () => {
    if (!elements.winnerMessage) return;

    const giocatori = GameStateModule.getGiocatori();
    const modalita = GameStateModule.getModalitaVittoria();
    
    if (giocatori.length === 0) {
      if (elements.winnerMessage.textContent !== '') {
        elements.winnerMessage.textContent = '';
      }
      if (elements.gameOverActions) {
        elements.gameOverActions.style.display = 'none';
      }
      GameStateModule.setPartitaTerminata(false);
      GameStateModule.saveCurrentState();
      return;
    }

    const { hasWinner, vincitori, puntiVincitore, maxPunti, minPunti } = GameStateModule.checkVittoria();

    if (hasWinner) {
      if (!GameStateModule.isPartitaTerminata()) {
        GameStateModule.saveToHistory(vincitori, puntiVincitore);
        GameStateModule.setPartitaTerminata(true);
        GameStateModule.saveCurrentState();
      }

      elements.winnerMessage.textContent = '';
      const text1 = document.createTextNode('Partita Terminata! Il vincitore è: ');
      const strong = document.createElement('strong');
      strong.textContent = vincitori.join(', ');
      const text2 = document.createTextNode(` con ${puntiVincitore} punti!`);
      
      elements.winnerMessage.appendChild(text1);
      elements.winnerMessage.appendChild(strong);
      elements.winnerMessage.appendChild(text2);
      elements.winnerMessage.style.display = 'block';
      
      if (elements.gameOverActions) {
        elements.gameOverActions.style.display = 'block';
      }

      giocatori.forEach((g, i) => {
        const item = document.getElementById(`giocatore-${g.id}`);
        if (item) {
          item.classList.add('game-over');
          if (vincitori.includes(g.nome)) {
            item.classList.add('winner-highlight');
          } else {
            item.classList.remove('winner-highlight');
          }
        }
      });
      
    } else {
      elements.winnerMessage.style.display = 'none';
      if (elements.gameOverActions) {
        elements.gameOverActions.style.display = 'none';
      }
      GameStateModule.setPartitaTerminata(false);
      
      giocatori.forEach((g, i) => {
        const item = document.getElementById(`giocatore-${g.id}`);
        if (item) {
          item.classList.remove('game-over');
          
          if (modalita === 'max') {
            if (g.punti === maxPunti && giocatori.length > 0) {
              item.classList.add('winner-highlight');
            } else {
              item.classList.remove('winner-highlight');
            }
          } else {
            if (g.punti === minPunti && giocatori.length > 0) {
              item.classList.add('winner-highlight');
            } else {
              item.classList.remove('winner-highlight');
            }
          }
        }
      });
      GameStateModule.saveCurrentState();
    }
    
    document.querySelectorAll('.punteggio-controls button').forEach(btn => {
      btn.disabled = GameStateModule.isPartitaTerminata();
    });
  };

  const showLoader = () => {
    if (elements.loader) {
      elements.loader.style.display = 'flex';
    }
  };

  const hideLoader = () => {
    if (elements.loader) {
      setTimeout(() => {
        elements.loader.style.display = 'none';
      }, 100);
    }
  };

  const updateDarkModeIcon = () => {
    const iconBtn = document.getElementById('toggle-dark-mode');
    if (iconBtn) {
      iconBtn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    }
  };

  const toggleDarkMode = () => {
    document.body.classList.toggle('dark-mode');
    updateDarkModeIcon();
    GameStateModule.saveCurrentState();
  };

  // Public API
  return {
    cacheElements,
    showModal,
    hideModal,
    applyCustomScore,
    renderGiocatoriPartita,
    renderGiocatoriSettings,
    renderStorico,
    checkAndDisplayVittoria,
    showLoader,
    hideLoader,
    updateDarkModeIcon,
    toggleDarkMode
  };
})();

// -------------------------------------------------------------------
// 🎛️ SETTINGS MODULE - Gestione impostazioni
// -------------------------------------------------------------------
const SettingsModule = (() => {
  let presetSelectElement = null;
  let modalitaSelectElement = null;
  let obiettivoInputElement = null;
  let presetInfoElement = null;
  let presetDescriptionElement = null;

  const cacheElements = () => {
    presetSelectElement = document.getElementById('preset-gioco');
    modalitaSelectElement = document.getElementById('modalita-vittoria');
    obiettivoInputElement = document.getElementById('punteggio-obiettivo');
    presetInfoElement = document.getElementById('preset-info');
    presetDescriptionElement = document.getElementById('preset-description');
    
    // Popola dinamicamente il select dei preset
    populatePresetSelect();
  };

  const populatePresetSelect = () => {
    if (!presetSelectElement) return;
    
    const presets = GameStateModule.getPresets();
    
    // Raggruppa per categoria
    const categories = {
      carte: [],
      tavolo: [],
      sport: [],
      altri: [],
      custom: []
    };
    
    Object.entries(presets).forEach(([key, preset]) => {
      const category = preset.category || 'custom';
      if (categories[category]) {
        categories[category].push({ key, ...preset });
      }
    });
    
    // Pulisci e ricostruisci il select (mantieni prima opzione)
    const firstOption = presetSelectElement.querySelector('option:first-child');
    presetSelectElement.innerHTML = '';
    if (firstOption) {
      presetSelectElement.appendChild(firstOption);
    }
    
    // Aggiungi optgroup per ogni categoria
    const categoryLabels = {
      carte: '🃏 Giochi di Carte',
      tavolo: '🎲 Giochi da Tavolo',
      sport: '⚽ Sport',
      altri: '🎯 Altri Giochi',
      custom: '⭐ Personalizzati'
    };
    
    ['carte', 'tavolo', 'sport', 'altri', 'custom'].forEach(category => {
      if (categories[category].length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = categoryLabels[category];
        
        categories[category]
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.key;
            option.textContent = preset.name;
            optgroup.appendChild(option);
          });
        
        presetSelectElement.appendChild(optgroup);
      }
    });
  };

  const applyPreset = (presetKey) => {
    if (!presetKey || presetKey === '') {
      if (presetInfoElement) {
        presetInfoElement.style.display = 'none';
      }
      return;
    }
    
    const preset = GameStateModule.applyPreset(presetKey);
    if (!preset) return;
    
    // Aggiorna UI
    if (modalitaSelectElement) {
      modalitaSelectElement.value = preset.mode;
    }
    if (obiettivoInputElement) {
      obiettivoInputElement.value = preset.target;
    }
    
    // Mostra descrizione
    if (presetInfoElement && presetDescriptionElement) {
      presetDescriptionElement.textContent = preset.description;
      presetInfoElement.style.display = 'block';
    }
  };

  const resetPresetUI = () => {
    if (presetSelectElement) {
      presetSelectElement.value = '';
    }
    if (presetInfoElement) {
      presetInfoElement.style.display = 'none';
    }
  };

  const initializeFromState = () => {
    if (modalitaSelectElement) {
      modalitaSelectElement.value = GameStateModule.getModalitaVittoria();
    }
    if (obiettivoInputElement) {
      obiettivoInputElement.value = GameStateModule.getPunteggioObiettivo();
    }
  };

  const setupEventListeners = () => {
    // Preset selector
    if (presetSelectElement) {
      presetSelectElement.addEventListener('change', (e) => {
        applyPreset(e.target.value);
      });
    }

    // Modalità vittoria
    if (modalitaSelectElement) {
      modalitaSelectElement.addEventListener('change', (e) => {
        GameStateModule.setModalitaVittoria(e.target.value);
        resetPresetUI();
      });
    }

    // Punteggio obiettivo
    if (obiettivoInputElement) {
      obiettivoInputElement.addEventListener('change', (e) => {
        try {
          GameStateModule.setPunteggioObiettivo(parseInt(e.target.value, 10));
          resetPresetUI();
        } catch (error) {
          alert(error.message);
          e.target.value = GameStateModule.getPunteggioObiettivo();
        }
      });

      obiettivoInputElement.addEventListener('blur', (e) => {
        const val = parseInt(e.target.value, 10);
        if (isNaN(val) || val <= 0) {
          e.target.value = GameStateModule.getPunteggioObiettivo();
          alert('Il punteggio obiettivo deve essere un numero positivo.');
        }
      });
    }

    // Nuova partita button
    const btnNuovaPartita = document.getElementById('btn-nuova-partita');
    if (btnNuovaPartita) {
      btnNuovaPartita.addEventListener('click', () => {
        if (confirm('Sei sicuro di voler iniziare una nuova partita? Tutti i punteggi attuali saranno azzerati.')) {
          GameStateModule.resetPunteggi();
          window.location.href = 'index.html';
        }
      });
    }

    // Aggiungi giocatore
    const btnAggiungi = document.getElementById('btn-aggiungi-giocatore');
    if (btnAggiungi) {
      btnAggiungi.addEventListener('click', addGiocatoreHandler);
    }

    const nomeInput = document.getElementById('nuovo-giocatore');
    if (nomeInput) {
      nomeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addGiocatoreHandler();
        }
      });
    }
  };

  const addGiocatoreHandler = () => {
    const nomeInput = document.getElementById('nuovo-giocatore');
    if (!nomeInput) return;

    try {
      GameStateModule.addGiocatore(nomeInput.value);
      nomeInput.value = '';
      UIModule.renderGiocatoriSettings();
    } catch (error) {
      alert(error.message);
      nomeInput.value = '';
    }
  };

  // Public API
  return {
    cacheElements,
    initializeFromState,
    setupEventListeners
  };
})();

// -------------------------------------------------------------------
// 🎮 APP CONTROLLER - Coordinatore principale
// -------------------------------------------------------------------
const AppController = (() => {
  const init = async () => {
    // Cache DOM elements
    UIModule.cacheElements();
    
    // Show loader
    UIModule.showLoader();

    // Hide modal if present
    const modal = document.getElementById('modal-overlay');
    if (modal) modal.style.display = 'none';

    // Load state from database
    const state = await DatabaseModule.loadState();
    GameStateModule.loadFromState(state);
    
    // Request persistent storage
    await DatabaseModule.requestPersistentStorage();

    // Update dark mode icon
    UIModule.updateDarkModeIcon();

    // Initialize based on current page
    const currentPage = getCurrentPage();
    
    switch (currentPage) {
      case 'partita':
        initPartitaPage();
        break;
      case 'settings':
        initSettingsPage();
        break;
      case 'storico':
        initStoricoPage();
        break;
    }

    // Hide loader
    UIModule.hideLoader();
  };

  const getCurrentPage = () => {
    if (document.getElementById('giocatori-lista-partita')) return 'partita';
    if (document.getElementById('impostazioni-partita')) return 'settings';
    if (document.getElementById('storico-lista')) return 'storico';
    return 'unknown';
  };

  const initPartitaPage = () => {
    UIModule.renderGiocatoriPartita();
    UIModule.checkAndDisplayVittoria();

    // Modal buttons
    const btnAnnulla = document.getElementById('btn-modal-annulla');
    if (btnAnnulla) {
      btnAnnulla.addEventListener('click', () => UIModule.hideModal());
    }

    const modalForm = document.getElementById('modal-input-form');
    if (modalForm) {
      modalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        UIModule.applyCustomScore();
      });
    }

    // Quick score buttons
    const quickButtons = [
      { id: 'btn-quick-plus10', value: 10 },
      { id: 'btn-quick-minus10', value: -10 },
      { id: 'btn-quick-plus20', value: 20 },
      { id: 'btn-quick-minus20', value: -20 },
      { id: 'btn-quick-plus50', value: 50 },
      { id: 'btn-quick-minus50', value: -50 }
    ];
    
    quickButtons.forEach(btn => {
      const element = document.getElementById(btn.id);
      if (element) {
        element.addEventListener('click', () => UIModule.applyCustomScore(btn.value));
      }
    });
    
    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        UIModule.hideModal();
      }
    });
    
    // Ricomincia partita button
    const btnRicomincia = document.getElementById('btn-ricomincia-partita');
    if (btnRicomincia) {
      btnRicomincia.addEventListener('click', () => {
        if (confirm('Sei sicuro di voler iniziare una nuova partita? Tutti i punteggi attuali saranno azzerati.')) {
          GameStateModule.resetPunteggi();
          window.location.href = 'index.html';
        }
      });
    }
  };

  const initSettingsPage = () => {
    SettingsModule.cacheElements();
    SettingsModule.initializeFromState();
    SettingsModule.setupEventListeners();
    UIModule.renderGiocatoriSettings();
  };

  const initStoricoPage = async () => {
    await UIModule.renderStorico();
  };

  // Public API
  return {
    init
  };
})();

// -------------------------------------------------------------------
// 🚀 BOOTSTRAP - Inizializzazione applicazione
// -------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  AppController.init();
});

// -------------------------------------------------------------------
// 🌐 GLOBAL API - Funzioni esposte al window (solo necessarie)
// -------------------------------------------------------------------
window.SegnapuntiApp = {
  // Esponi solo le funzioni che devono essere chiamate da HTML onclick
  toggleDarkMode: () => UIModule.toggleDarkMode(),
  
  // Versione e info
  version: '1.0.9',
  
  // Debug helper (solo in dev)
  debug: {
    getState: () => ({
      modalita: GameStateModule.getModalitaVittoria(),
      obiettivo: GameStateModule.getPunteggioObiettivo(),
      giocatori: GameStateModule.getGiocatori(),
      terminata: GameStateModule.isPartitaTerminata()
    })
  }
};

// Backward compatibility - mantieni le funzioni globali esistenti per HTML
window.toggleDarkMode = () => UIModule.toggleDarkMode();
