// ===================================================================
// MODULE PATTERN ES6 - Segnapunti v1.1.2 - BUG FIXES COMPLETI
// ===================================================================

// -------------------------------------------------------------------
// 🗄️ DATABASE MODULE - Gestione IndexedDB (✅ FIX #1, #7)
// -------------------------------------------------------------------
const DatabaseModule = (() => {
  const DB_NAME = 'SegnapuntiDB';
  const DB_VERSION = 3;
  const STORE_NAME = 'stato_partita';
  const HISTORY_STORE_NAME = 'storico_partite';
  const STATE_KEY = 'current_state';

  let db = null;
  let dbPromise = null;
  let retryCount = 0;
  const MAX_RETRIES = 3;

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
        retryCount = 0; // ✅ FIX #1: Reset retry count on success
        resolve(db);
      };

      request.onerror = (event) => {
        console.error("Errore IndexedDB:", event.target.errorCode);
        
        // ✅ FIX #1: Retry logic invece di reject immediato
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          dbPromise = null;
          console.log(`Retry ${retryCount}/${MAX_RETRIES}...`);
          
          setTimeout(() => {
            openDB().then(resolve).catch(reject);
          }, 1000 * retryCount);
        } else {
          dbPromise = null;
          reject(new Error("Errore nell'apertura del database dopo " + MAX_RETRIES + " tentativi."));
        }
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
        
        // ✅ FIX #7: Usa transaction.oncomplete invece di request.onsuccess
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => {
          console.error('Errore durante il salvataggio dello stato');
          reject(new Error('Transaction failed'));
        };
        
        request.onerror = () => reject(new Error('Put request failed'));
      });
    } catch (error) {
      console.error("Errore nel salvataggio dello stato:", error);
    }
  };

  const saveHistory = async (partita) => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([HISTORY_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(HISTORY_STORE_NAME);
        const request = store.add(partita);
        
        // ✅ FIX #7: Transaction completion
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => {
          console.error('Errore salvataggio storico');
          reject();
        };
        
        request.onerror = () => reject();
      });
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

  const clearHistory = async () => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([HISTORY_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(HISTORY_STORE_NAME);
        const request = store.clear();

        // ✅ FIX #7: Transaction completion
        transaction.oncomplete = () => {
          console.log('Storico cancellato con successo');
          resolve();
        };
        
        transaction.onerror = () => {
          console.error('Errore durante la cancellazione dello storico');
          reject();
        };
        
        request.onerror = () => {
          console.error('Errore nella richiesta di cancellazione');
          reject();
        };
      });
    } catch (error) {
      console.error("Errore nella cancellazione dello storico:", error);
      throw error;
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

  return {
    loadState,
    saveState,
    saveHistory,
    loadHistory,
    clearHistory,
    requestPersistentStorage
  };
})();

// -------------------------------------------------------------------
// 🎮 GAME STATE MODULE - Gestione stato del gioco (✅ FIX #8, #9)
// -------------------------------------------------------------------
const GameStateModule = (() => {
  let modalitaVittoria = 'max';
  let punteggioObiettivo = 100;
  let roundsObiettivo = 3;
  let roundMode = 'max'; // ✅ FIX #11: Chi vince il round (max/min) - solo per mode='rounds'
  let giocatori = [];
  let partitaTerminata = false;
  let nomeGiocoCorrente = '';
  let presetKeySelezionato = ''; // ✅ NUOVO: Salva la key del preset attivo
  const generatePlayerId = () => {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const getModalitaVittoria = () => modalitaVittoria;
  const getPunteggioObiettivo = () => punteggioObiettivo;
  const getRoundsObiettivo = () => roundsObiettivo;
  const getRoundMode = () => roundMode; // ✅ FIX #11: Getter per roundMode
  const getGiocatori = () => [...giocatori];
  const isPartitaTerminata = () => partitaTerminata;
  const getNomeGiocoCorrente = () => nomeGiocoCorrente;
  const getPresetKeySelezionato = () => presetKeySelezionato; // ✅ NUOVO
  const getPresets = () => {
    if (window.PresetManager) {
      return window.PresetManager.getAllPresets();
    }
    return {};
  };

  const setModalitaVittoria = (value) => {
    modalitaVittoria = value;
    nomeGiocoCorrente = '';
    presetKeySelezionato = ''; // ✅ NUOVO: Reset preset key
    saveCurrentState();
  };

  const setPunteggioObiettivo = (value) => {
    const punti = parseInt(value, 10);
    if (isNaN(punti) || punti <= 0) {
      throw new Error('Il punteggio obiettivo deve essere un numero positivo.');
    }
    punteggioObiettivo = punti;
    nomeGiocoCorrente = '';
    presetKeySelezionato = ''; // ✅ NUOVO: Reset preset key
    saveCurrentState();
  };

  const setRoundsObiettivo = (value) => {
    const rounds = parseInt(value, 10);
    if (isNaN(rounds) || rounds <= 0) {
      throw new Error('Il numero di rounds deve essere un numero positivo.');
    }
    roundsObiettivo = rounds;
    nomeGiocoCorrente = '';
    presetKeySelezionato = ''; // ✅ NUOVO: Reset preset key
    saveCurrentState();
  };

  const setPartitaTerminata = (value) => {
    partitaTerminata = value;
  };

  const addGiocatore = (nome) => {
    const nomeTrimmed = nome.trim().slice(0, 30);
    
    if (nomeTrimmed === '') {
      throw new Error("Inserisci un nome valido.");
    }

    // ✅ FIX #9: Validazione più robusta contro XSS
    const dangerousChars = /[<>"'`]/;
    if (dangerousChars.test(nomeTrimmed)) {
      throw new Error("Il nome contiene caratteri non ammessi.");
    }

    const nomeNormalizzato = nomeTrimmed.replace(/\s+/g, ' ').toLowerCase();
    if (giocatori.some(g => g.nome.replace(/\s+/g, ' ').toLowerCase() === nomeNormalizzato)) {
      throw new Error("Questo nome esiste già!");
    }

    const newPlayer = {
      id: generatePlayerId(),
      nome: nomeTrimmed,
      punti: 0,
      rounds: 0,
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
      
      // ✅ FIX #11: NON chiamare checkAndAssignRoundWinner qui
      // Lo facciamo nell'UI dopo updatePunteggio per avere il return value
      
      return true;
    }
    return false;
  };

  // ✅ FIX #11: Controlla se qualcuno ha vinto il round e assegna automaticamente
  const checkAndAssignRoundWinner = () => {
    if (giocatori.length === 0) return null;
    
    const puntiMappa = giocatori.map(g => g.punti);
    const maxPunti = Math.max(...puntiMappa);
    const minPunti = Math.min(...puntiMappa);
    
    let roundWinner = null;
    let winningPoints = 0;
    
    // Determina se qualcuno ha raggiunto il target
    if (roundMode === 'max' && maxPunti >= punteggioObiettivo) {
      // Vince chi ha PIÙ punti
      winningPoints = maxPunti;
      const winners = giocatori.filter(g => g.punti === maxPunti);
      
      if (winners.length === 1) {
        roundWinner = winners[0];
      } else if (winners.length > 1) {
        // Pareggio: nessuno vince il round, continua
        return null;
      }
    } else if (roundMode === 'min' && maxPunti >= punteggioObiettivo) {
      // Vince chi ha MENO punti (quando qualcuno raggiunge target)
      winningPoints = minPunti;
      const winners = giocatori.filter(g => g.punti === minPunti);
      
      if (winners.length === 1) {
        roundWinner = winners[0];
      } else if (winners.length > 1) {
        // Pareggio: nessuno vince il round
        return null;
      }
    }
    
    // Se c'è un vincitore, assegna round e resetta punti
    if (roundWinner) {
      roundWinner.rounds += 1;
      
      // Resetta tutti i punti a 0 per nuovo round
      giocatori.forEach(g => {
        g.punti = 0;
      });
      
      saveCurrentState();
      
      // Restituisci info per notifica UI
      return {
        winnerId: roundWinner.id,
        winnerName: roundWinner.nome,
        winningPoints: winningPoints,
        newRoundCount: roundWinner.rounds
      };
    }
    
    return null;
  };

  const updateRounds = (playerId, delta) => {
    if (partitaTerminata) return false;
    
    const giocatore = giocatori.find(g => g.id === playerId);
    if (giocatore) {
      giocatore.rounds = Math.max(0, giocatore.rounds + delta);
      saveCurrentState();
      return true;
    }
    return false;
  };
  
  const getGiocatoreById = (playerId) => {
    return giocatori.find(g => g.id === playerId) || null;
  };

  const resetPunteggi = () => {
    giocatori.forEach(g => {
      g.punti = 0;
      g.rounds = 0;
    });
    partitaTerminata = false;
    saveCurrentState();
  };

  const applyPreset = (presetKey) => {
    const presets = getPresets();
    const preset = presets[presetKey];
    if (!preset) return null;
    
    modalitaVittoria = preset.mode;
    punteggioObiettivo = preset.target;
    
    // ✅ FIX #11: Salva roundMode dal preset
    if (preset.mode === 'rounds') {
      roundMode = preset.roundMode || 'max'; // Default 'max' se non specificato
      roundsObiettivo = preset.roundsTarget || 3;
    } else {
      // Per mode='max' o 'min', roundMode non serve ma impostiamo comunque
      roundMode = preset.mode;
      if (preset.roundsTarget) {
        roundsObiettivo = preset.roundsTarget;
      }
    }
    
    // ✅ NUOVO: Salva il nome del gioco e la key
    nomeGiocoCorrente = preset.name || '';
    presetKeySelezionato = presetKey; // ✅ NUOVO: Salva preset key
    
    saveCurrentState();
    
    return preset;
  };

  const checkVittoria = () => {
    if (giocatori.length === 0) {
      return { hasWinner: false, vincitori: [], puntiVincitore: 0, roundsVincitore: 0 };
    }

    const puntiMappa = giocatori.map(g => g.punti);
    const roundsMappa = giocatori.map(g => g.rounds);
    const maxPunti = Math.max(...puntiMappa);
    const minPunti = Math.min(...puntiMappa);
    const maxRounds = Math.max(...roundsMappa);

    let vincitori = [];
    let puntiVincitore = 0;
    let roundsVincitore = 0;
    let hasWinner = false;

    if (modalitaVittoria === 'rounds' && maxRounds >= roundsObiettivo) {
      hasWinner = true;
      vincitori = giocatori.filter(g => g.rounds === maxRounds).map(g => g.nome);
      roundsVincitore = maxRounds;
      puntiVincitore = giocatori.filter(g => g.rounds === maxRounds)[0]?.punti || 0;
    }
    else if (modalitaVittoria === 'max' && maxPunti >= punteggioObiettivo) {
      hasWinner = true;
      vincitori = giocatori.filter(g => g.punti === maxPunti).map(g => g.nome);
      puntiVincitore = maxPunti;
    }
    else if (modalitaVittoria === 'min' && maxPunti >= punteggioObiettivo) {
      hasWinner = true;
      vincitori = giocatori.filter(g => g.punti === minPunti).map(g => g.nome);
      puntiVincitore = minPunti;
    }

    return { hasWinner, vincitori, puntiVincitore, roundsVincitore, maxPunti, minPunti, maxRounds };
  };

  const saveCurrentState = () => {
    const darkMode = document.body.classList.contains('dark-mode');
    DatabaseModule.saveState({
      modalitaVittoria,
      punteggioObiettivo,
      roundsObiettivo,
      roundMode,
      giocatori,
      partitaTerminata,
      darkMode,
      nomeGiocoCorrente,
      presetKeySelezionato // ✅ NUOVO
    });
  };

  const loadFromState = (state) => {
    if (state) {
      modalitaVittoria = state.modalitaVittoria || 'max';
      punteggioObiettivo = state.punteggioObiettivo || 100;
      roundsObiettivo = state.roundsObiettivo || 3;
      roundMode = state.roundMode || 'max'; // ✅ FIX #11: Carica roundMode
      giocatori = state.giocatori || [];
      partitaTerminata = state.partitaTerminata || false;
      nomeGiocoCorrente = state.nomeGiocoCorrente || '';
      presetKeySelezionato = state.presetKeySelezionato || ''; // ✅ NUOVO
      
      giocatori = giocatori.map(g => {
        if (!g.id) {
          g.id = generatePlayerId();
          g.createdAt = Date.now();
        }
        if (g.rounds === undefined) {
          g.rounds = 0;
        }
        return g;
      });
      
      // ✅ FIX #8: Sincronizza dark mode correttamente
      if (state.darkMode === true) {
        document.body.classList.add('dark-mode');
      } else if (state.darkMode === false) {
        document.body.classList.remove('dark-mode');
      }
      // Se undefined, mantieni stato corrente
    }
  };

  const saveToHistory = async (vincitori, puntiVincitore, roundsVincitore) => {
    const partita = {
      timestamp: Date.now(),
      data: new Date().toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }),
      vincitori: vincitori,
      puntiVincitore: puntiVincitore,
      roundsVincitore: roundsVincitore || 0,
      modalita: modalitaVittoria,
      nomeGioco: nomeGiocoCorrente || '', // ✅ NUOVO: Salva nome gioco
      giocatori: giocatori.map(g => ({ 
        nome: g.nome, 
        punti: g.punti, 
        rounds: g.rounds || 0
      }))
    };
    
    await DatabaseModule.saveHistory(partita);
    
    // ✅ FIX: Dispatch evento per ads module
    document.dispatchEvent(new CustomEvent('gameCompleted', {
      detail: { partita }
    }));
  };

  return {
    getModalitaVittoria,
    getPunteggioObiettivo,
    getRoundsObiettivo,
    getRoundMode,
    getGiocatori,
    isPartitaTerminata,
    getNomeGiocoCorrente,
    getPresetKeySelezionato, // ✅ NUOVO
    getPresets,
    setModalitaVittoria,
    setPunteggioObiettivo,
    setRoundsObiettivo,
    setPartitaTerminata,
    addGiocatore,
    removeGiocatore,
    updatePunteggio,
    updateRounds,
    getGiocatoreById,
    resetPunteggi,
    applyPreset,
    checkVittoria,
    checkAndAssignRoundWinner, // ✅ FIX #11: Esporta nuova funzione
    saveCurrentState,
    loadFromState,
    saveToHistory
  };
})();

// -------------------------------------------------------------------
// 🎨 UI MODULE - (✅ FIX #2, #3, #6, #11)
// -------------------------------------------------------------------
const UIModule = (() => {
  let currentButtonListeners = [];
  let activeAnimations = new Set();
  let globalPlayerIdToUpdate = null;

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

  const cleanupButtonListeners = () => {
    currentButtonListeners.forEach(({ element, event, handler }) => {
      if (element) {
        element.removeEventListener(event, handler);
      }
    });
    currentButtonListeners = [];
  };

  // ✅ FIX #2: Helper per registrare listener e tracciare cleanup
  const registerListener = (element, event, handler) => {
    if (element) {
      element.addEventListener(event, handler);
      currentButtonListeners.push({ element, event, handler });
    }
  };

  // ✅ FIX #6: Ordina giocatori con fallback consistente
  const sortPlayers = (giocatori, modalita) => {
    return [...giocatori].sort((a, b) => {
      if (modalita === 'rounds') {
        // Prima per rounds, poi per punti, poi per nome
        return b.rounds - a.rounds || 
               b.punti - a.punti || 
               a.nome.localeCompare(b.nome);
      }
      
      // ✅ FIX #6: Aggiungi fallback per nome in tutte le modalità
      const puntDiff = modalita === 'max' ? 
                       b.punti - a.punti : 
                       a.punti - b.punti;
      
      return puntDiff !== 0 ? puntDiff : a.nome.localeCompare(b.nome);
    });
  };

  const createEmptyStateMessage = (text) => {
    const li = document.createElement('li');
    li.style.textAlign = 'center';
    li.style.padding = '20px';
    li.style.color = '#999';
    li.style.fontStyle = 'italic';
    li.textContent = text;
    return li;
  };

  const createRoundsControls = (playerId) => {
    const container = document.createElement('div');
    container.className = 'rounds-controls';
    
    const btnMinus = document.createElement('button');
    btnMinus.textContent = '-1 🏆';
    btnMinus.className = 'btn-round-minus';
    btnMinus.title = 'Rimuovi 1 round';
    
    // ✅ FIX #2: Usa addEventListener + registrazione per cleanup
    const minusHandler = () => {
      if (GameStateModule.updateRounds(playerId, -1)) {
        animateRounds(playerId, -1);
        renderGiocatoriPartita();
        checkAndDisplayVittoria();
      }
    };
    registerListener(btnMinus, 'click', minusHandler);
    
    const btnPlus = document.createElement('button');
    btnPlus.textContent = '+1 🏆';
    btnPlus.className = 'btn-round-plus';
    btnPlus.title = 'Aggiungi 1 round vinto';
    
    const plusHandler = () => {
      if (GameStateModule.updateRounds(playerId, 1)) {
        animateRounds(playerId, 1);
        renderGiocatoriPartita();
        checkAndDisplayVittoria();
      }
    };
    registerListener(btnPlus, 'click', plusHandler);
    
    container.appendChild(btnMinus);
    container.appendChild(btnPlus);
    
    return container;
  };

  const createPlayerItemPartita = (giocatore) => {
    const isRoundsMode = GameStateModule.getModalitaVittoria() === 'rounds';
    const partitaTerminata = GameStateModule.isPartitaTerminata();
    
    const li = document.createElement('li');
    li.className = 'giocatore-item';
    li.id = `giocatore-${giocatore.id}`;
    
    const nomeDiv = document.createElement('div');
    nomeDiv.className = 'giocatore-nome';
    nomeDiv.textContent = giocatore.nome;
    
    const statsDiv = document.createElement('div');
    statsDiv.className = 'giocatore-stats';
    
    if (isRoundsMode) {
      const roundsSpan = document.createElement('span');
      roundsSpan.className = 'giocatore-rounds';
      roundsSpan.id = `rounds-${giocatore.id}`;
      roundsSpan.innerHTML = `🏆 <strong>${giocatore.rounds}</strong>`;
      roundsSpan.title = 'Rounds vinti';
      statsDiv.appendChild(roundsSpan);
    }
    
    const puntiSpan = document.createElement('span');
    puntiSpan.className = 'giocatore-punti';
    puntiSpan.id = `punti-${giocatore.id}`;
    puntiSpan.innerHTML = `<strong>${giocatore.punti}</strong> ${isRoundsMode ? 'pt' : 'punti'}`;
    statsDiv.appendChild(puntiSpan);
    
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'punti-e-controlli';
    
    if (isRoundsMode) {
      const roundsControls = createRoundsControls(giocatore.id);
      controlsDiv.appendChild(roundsControls);
    }
    
    const scoreControls = document.createElement('div');
    scoreControls.className = 'punteggio-controls';
    
    const buttons = [
      { text: '+1', value: 1 },
      { text: '-1', value: -1 },
      { text: '+5', value: 5 },
      { text: '-5', value: -5 },
      { text: '+10', value: 10 },
      { text: '-10', value: -10 }
    ];
    
    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.textContent = btn.text;
      button.disabled = partitaTerminata;
      
      // ✅ FIX #2: Registra listener per cleanup
      const handler = () => {
        if (GameStateModule.updatePunteggio(giocatore.id, btn.value)) {
          animatePunteggio(giocatore.id, btn.value);
          
          // ✅ FIX #11: Controlla se round vinto e mostra notifica
          const roundWon = GameStateModule.checkAndAssignRoundWinner();
          if (roundWon) {
            showRoundWonNotification(roundWon);
          }
          
          renderGiocatoriPartita();
          checkAndDisplayVittoria();
        }
      };
      registerListener(button, 'click', handler);
      
      scoreControls.appendChild(button);
    });
    
    const customBtn = document.createElement('button');
    customBtn.textContent = '± Personalizza';
    customBtn.className = 'btn-custom-score';
    customBtn.disabled = partitaTerminata;
    
    // ✅ FIX #2: Registra listener
    const customHandler = () => showModal(giocatore.id);
    registerListener(customBtn, 'click', customHandler);
    
    scoreControls.appendChild(customBtn);
    
    controlsDiv.appendChild(scoreControls);
    
    li.appendChild(nomeDiv);
    li.appendChild(statsDiv);
    li.appendChild(controlsDiv);
    
    return li;
  };

  const createPlayerItemSettings = (giocatore) => {
    const li = document.createElement('li');
    li.className = 'giocatore-item';
    li.id = `giocatore-${giocatore.id}`;
    
    const nomeDiv = document.createElement('div');
    nomeDiv.className = 'giocatore-nome';
    nomeDiv.textContent = giocatore.nome;
    
    const statsDiv = document.createElement('div');
    statsDiv.className = 'giocatore-punti';
    statsDiv.innerHTML = `<strong>${giocatore.punti}</strong> punti | 🏆 <strong>${giocatore.rounds || 0}</strong> rounds`;
    
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'punteggio-controls';
    
    const btnRemove = document.createElement('button');
    btnRemove.textContent = '🗑️ Rimuovi';
    btnRemove.className = 'btn-rimuovi';
    
    // ✅ FIX #2: Registra listener
    const removeHandler = () => {
      if (confirm(`Rimuovere ${giocatore.nome} dalla partita?`)) {
        GameStateModule.removeGiocatore(giocatore.id);
        renderGiocatoriSettings();
      }
    };
    registerListener(btnRemove, 'click', removeHandler);
    
    controlsDiv.appendChild(btnRemove);
    
    li.appendChild(nomeDiv);
    li.appendChild(statsDiv);
    li.appendChild(controlsDiv);
    
    return li;
  };

  const animateRounds = (playerId, delta) => {
    const roundsElement = document.getElementById(`rounds-${playerId}`);
    if (!roundsElement) return;
    
    const strongElement = roundsElement.querySelector('strong');
    if (!strongElement) return;
    
    const animKey = `anim-rounds-${playerId}`;
    if (activeAnimations.has(animKey)) return;
    
    activeAnimations.add(animKey);
    
    const animClass = delta >= 0 ? 'anim-up' : 'anim-down';
    
    roundsElement.classList.remove('anim-up', 'anim-down');
    void roundsElement.offsetWidth;
    roundsElement.classList.add(animClass);
    
    const giocatore = GameStateModule.getGiocatoreById(playerId);
    if (giocatore) {
      strongElement.textContent = giocatore.rounds;
    }
    
    const cleanup = () => {
      roundsElement.classList.remove(animClass);
      activeAnimations.delete(animKey);
    };
    
    roundsElement.addEventListener('animationend', cleanup, { once: true });
    setTimeout(cleanup, 500);
  };

  // ✅ FIX #11: Mostra notifica quando un round viene vinto
  const showRoundWonNotification = (roundInfo) => {
    // Crea elemento notifica
    const notification = document.createElement('div');
    notification.className = 'round-won-notification';
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #FFD700, #FFA500);
      color: #333;
      padding: 20px 30px;
      border-radius: 16px;
      font-size: 1.2em;
      font-weight: 700;
      box-shadow: 0 8px 24px rgba(255, 215, 0, 0.5);
      z-index: 9998;
      animation: slideInTop 0.5s ease-out, slideOutTop 0.5s ease-in 2.5s;
      max-width: 90%;
      text-align: center;
    `;
    
    const modalita = GameStateModule.getModalitaVittoria();
    let roundLabel = 'Round';
    
    // Determina etichetta corretta per il tipo di gioco
    const nomeGioco = GameStateModule.getNomeGiocoCorrente().toLowerCase();
    if (nomeGioco.includes('tennis') || nomeGioco.includes('pallavolo') || nomeGioco.includes('volleyball')) {
      roundLabel = 'Set';
    } else if (nomeGioco.includes('poker')) {
      roundLabel = 'Mano';
    }
    
    notification.innerHTML = `
      <div style="font-size: 2em; margin-bottom: 5px;">🏆</div>
      <div><strong>${roundInfo.winnerName}</strong> vince il ${roundLabel}!</div>
      <div style="font-size: 0.9em; opacity: 0.9; margin-top: 5px;">
        ${roundInfo.winningPoints} punti • ${roundLabel} vinti: ${roundInfo.newRoundCount}
      </div>
    `;
    
    // Aggiungi animazioni CSS se non esistono
    if (!document.querySelector('#round-notification-animations')) {
      const style = document.createElement('style');
      style.id = 'round-notification-animations';
      style.textContent = `
        @keyframes slideInTop {
          from {
            transform: translate(-50%, -150%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
        @keyframes slideOutTop {
          from {
            transform: translate(-50%, 0);
            opacity: 1;
          }
          to {
            transform: translate(-50%, -150%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Rimuovi dopo animazione
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  };

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
    
    const floatingNumber = document.createElement('span');
    floatingNumber.className = `floating-number ${delta >= 0 ? 'positive' : 'negative'}`;
    floatingNumber.textContent = delta >= 0 ? `+${delta}` : delta;
    
    const rect = strongElement.getBoundingClientRect();
    floatingNumber.style.position = 'fixed';
    floatingNumber.style.left = `${rect.right + 10}px`;
    floatingNumber.style.top = `${rect.top}px`;
    
    document.body.appendChild(floatingNumber);
    
    // ✅ FIX #3: Cleanup corretto floating number
    let floatingRemoved = false;
    const removeFloating = () => {
      if (!floatingRemoved && floatingNumber && floatingNumber.parentNode) {
        floatingNumber.parentNode.removeChild(floatingNumber);
        floatingRemoved = true;
      }
    };
    
    // Rimuovi dopo animazione (1.2s)
    setTimeout(removeFloating, 1200);
    
    const cleanup = () => {
      puntiElement.classList.remove(animClass);
      activeAnimations.delete(animKey);
      removeFloating(); // ✅ FIX #3: Assicura rimozione anche se animazione interrotta
    };
    
    puntiElement.addEventListener('animationend', cleanup, { once: true });
    
    // Fallback cleanup dopo 500ms
    setTimeout(cleanup, 500);
  };

  const showModal = (playerId) => {
    if (GameStateModule.isPartitaTerminata()) return;
    
    const giocatore = GameStateModule.getGiocatoreById(playerId);
    if (!giocatore) return;
    
    globalPlayerIdToUpdate = playerId;
    
    if (elements.modal && elements.modalTitle && elements.modalInput) {
      elements.modalTitle.textContent = `Aggiungi Punti a ${giocatore.nome}`;
      elements.modalInput.value = '';
      elements.modal.style.display = 'flex';
      
      // ✅ FIX #11: Usa requestAnimationFrame invece di setTimeout
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (elements.modalInput) {
            elements.modalInput.focus();
          }
        });
      });
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
      
      // ✅ FIX #11: Controlla se round vinto e mostra notifica
      const roundWon = GameStateModule.checkAndAssignRoundWinner();
      if (roundWon) {
        showRoundWonNotification(roundWon);
      }
      
      renderGiocatoriPartita();
      checkAndDisplayVittoria();
    }
    
    hideModal();
  };

  const renderGiocatoriPartita = () => {
    if (!elements.giocatoriListaPartita) return;

    cleanupButtonListeners();

    const giocatori = GameStateModule.getGiocatori();
    const modalita = GameStateModule.getModalitaVittoria();
    
    elements.giocatoriListaPartita.innerHTML = '';
    
    if (giocatori.length === 0) {
      const emptyMessage = createEmptyStateMessage(
        'Nessun giocatore in partita. Aggiungine uno dalle impostazioni (⚙️).'
      );
      elements.giocatoriListaPartita.appendChild(emptyMessage);
      return;
    }

    const giocatoriOrdinati = sortPlayers(giocatori, modalita);
    
    giocatoriOrdinati.forEach((giocatore) => {
      const playerItem = createPlayerItemPartita(giocatore);
      elements.giocatoriListaPartita.appendChild(playerItem);
    });
    
    checkAndDisplayVittoria();
  };

  const renderGiocatoriSettings = () => {
    if (!elements.giocatoriListaSettings) return;

    const giocatori = GameStateModule.getGiocatori();
    elements.giocatoriListaSettings.innerHTML = '';
    
    if (giocatori.length === 0) {
      const emptyMessage = createEmptyStateMessage('Nessun giocatore in lista.');
      elements.giocatoriListaSettings.appendChild(emptyMessage);
      return;
    }

    giocatori.forEach((giocatore) => {
      const playerItem = createPlayerItemSettings(giocatore);
      elements.giocatoriListaSettings.appendChild(playerItem);
    });
  };

  const renderStorico = async () => {
    if (!elements.storicoLista) return;

    const storico = await DatabaseModule.loadHistory();
    
    const statsContainer = document.getElementById('storico-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `<span><strong>${storico.length}</strong> partite giocate</span>`;
    }
    
    elements.storicoLista.innerHTML = '';

    if (storico.length === 0) {
      const emptyMessage = createEmptyStateMessage('Nessuna partita nello storico.');
      elements.storicoLista.appendChild(emptyMessage);
      return;
    }

    storico.forEach(partita => {
      const li = document.createElement('li');
      li.className = 'storico-item';

      const header = document.createElement('div');
      header.className = 'storico-header';
      
      const vincitoreSpan = document.createElement('span');
      vincitoreSpan.className = 'storico-vincitore';
      
      if (partita.modalita === 'rounds') {
        vincitoreSpan.textContent = `🏆 ${partita.vincitori.join(', ')} (${partita.roundsVincitore || 0} rounds, ${partita.puntiVincitore} pt)`;
      } else {
        vincitoreSpan.textContent = `🏆 ${partita.vincitori.join(', ')} (${partita.puntiVincitore} punti)`;
      }
      
      const dataSpan = document.createElement('span');
      dataSpan.className = 'storico-data';
      dataSpan.textContent = partita.data;
      
      header.appendChild(vincitoreSpan);
      header.appendChild(dataSpan);
      
      const details = document.createElement('div');
      details.className = 'storico-details';
      
      // ✅ MODIFICATO: Mostra nome gioco se disponibile, altrimenti modalità
      const infoP = document.createElement('p');
      if (partita.nomeGioco && partita.nomeGioco.trim() !== '') {
        infoP.innerHTML = `Gioco: <strong>${partita.nomeGioco}</strong>`;
      } else {
        // Fallback: mostra modalità se nome gioco non disponibile
        let modalitaText = '';
        if (partita.modalita === 'rounds') {
          modalitaText = 'Rounds';
        } else if (partita.modalita === 'max') {
          modalitaText = 'Più punti';
        } else {
          modalitaText = 'Meno punti';
        }
        infoP.innerHTML = `Modalità: <strong>${modalitaText}</strong>`;
      }
      
      const partecipantiP = document.createElement('p');
      partecipantiP.textContent = 'Partecipanti:';
      
      const giocatoriUl = document.createElement('ul');
      giocatoriUl.className = 'giocatori-list';
      
      partita.giocatori.forEach(g => {
        const giocatoreLi = document.createElement('li');
        if (partita.modalita === 'rounds') {
          giocatoreLi.textContent = `${g.nome}: 🏆 ${g.rounds || 0} rounds (${g.punti} pt)`;
        } else {
          giocatoreLi.textContent = `${g.nome}: ${g.punti} punti`;
        }
        giocatoriUl.appendChild(giocatoreLi);
      });
      
      details.appendChild(infoP);
      details.appendChild(partecipantiP);
      details.appendChild(giocatoriUl);
      
      li.appendChild(header);
      li.appendChild(details);
      
      elements.storicoLista.appendChild(li);
    });
  };

  const clearStorico = async () => {
    const storico = await DatabaseModule.loadHistory();
    
    if (storico.length === 0) {
      alert('Lo storico è già vuoto!');
      return;
    }

    const confirmMessage = `⚠️ ATTENZIONE!\n\nStai per eliminare TUTTE le ${storico.length} partite dallo storico.\n\nQuesta operazione è IRREVERSIBILE!\n\nSei assolutamente sicuro di voler continuare?`;
    
    if (!confirm(confirmMessage)) return;

    const doubleConfirm = confirm('Conferma ancora una volta: vuoi davvero eliminare tutto lo storico?');
    if (!doubleConfirm) return;

    try {
      await DatabaseModule.clearHistory();
      alert('✅ Storico eliminato con successo!');
      await renderStorico();
    } catch (error) {
      alert('❌ Errore durante l\'eliminazione dello storico. Riprova.');
      console.error('Errore clear storico:', error);
    }
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

    const { hasWinner, vincitori, puntiVincitore, roundsVincitore, maxPunti, minPunti, maxRounds } = GameStateModule.checkVittoria();

    if (hasWinner) {
      if (!GameStateModule.isPartitaTerminata()) {
        GameStateModule.saveToHistory(vincitori, puntiVincitore, roundsVincitore);
        GameStateModule.setPartitaTerminata(true);
        GameStateModule.saveCurrentState();
      }

      elements.winnerMessage.textContent = '';
      const text1 = document.createTextNode('Partita Terminata! Il vincitore è: ');
      const strong = document.createElement('strong');
      strong.textContent = vincitori.join(', ');
      
      let text2;
      if (modalita === 'rounds') {
        text2 = document.createTextNode(` con ${roundsVincitore} rounds vinti (${puntiVincitore} punti)!`);
      } else {
        text2 = document.createTextNode(` con ${puntiVincitore} punti!`);
      }
      
      elements.winnerMessage.appendChild(text1);
      elements.winnerMessage.appendChild(strong);
      elements.winnerMessage.appendChild(text2);
      elements.winnerMessage.style.display = 'block';
      
      if (elements.gameOverActions) {
        elements.gameOverActions.style.display = 'block';
      }

      giocatori.forEach((g) => {
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
      
      giocatori.forEach((g) => {
        const item = document.getElementById(`giocatore-${g.id}`);
        if (item) {
          item.classList.remove('game-over');
          
          let isLeader = false;
          if (modalita === 'rounds') {
            isLeader = g.rounds === maxRounds && giocatori.length > 0;
          } else if (modalita === 'max') {
            isLeader = g.punti === maxPunti && giocatori.length > 0;
          } else {
            isLeader = g.punti === minPunti && giocatori.length > 0;
          }
          
          if (isLeader) {
            item.classList.add('winner-highlight');
          } else {
            item.classList.remove('winner-highlight');
          }
        }
      });
      GameStateModule.saveCurrentState();
    }
    
    document.querySelectorAll('.punteggio-controls button, .rounds-controls button').forEach(btn => {
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

  return {
    cacheElements,
    showModal,
    hideModal,
    applyCustomScore,
    renderGiocatoriPartita,
    renderGiocatoriSettings,
    renderStorico,
    clearStorico,
    checkAndDisplayVittoria,
    showLoader,
    hideLoader,
    updateDarkModeIcon,
    toggleDarkMode
  };
})();

// -------------------------------------------------------------------
// 🎛️ SETTINGS MODULE
// -------------------------------------------------------------------
const cacheElements = () => {
  presetSelectElement = document.getElementById('preset-gioco');
  presetInfoElement = document.getElementById('preset-info');
  presetDescriptionElement = document.getElementById('preset-description');
  
  populatePresetSelect();
  
  // ✅ NUOVO: Ripristina selezione preset salvata
  const presetKey = GameStateModule.getPresetKeySelezionato();
  if (presetKey && presetSelectElement) {
    presetSelectElement.value = presetKey;
    
    // Mostra info preset senza ri-applicarlo (evita loop)
    const presets = GameStateModule.getPresets();
    const preset = presets[presetKey];
    if (preset && presetInfoElement && presetDescriptionElement) {
      let infoText = `<strong>📋 ${preset.name}</strong><br><br>`;
      
      let modalitaText = '';
      if (preset.mode === 'rounds') {
        modalitaText = `🏆 Vince chi vince <strong>${preset.roundsTarget || 3} rounds</strong>`;
      } else if (preset.mode === 'max') {
        modalitaText = `📈 Vince chi fa <strong>più punti</strong> (obiettivo: ${preset.target})`;
      } else {
        modalitaText = `📉 Vince chi fa <strong>meno punti</strong> (obiettivo: ${preset.target})`;
      }
      
      infoText += `${modalitaText}<br><br>`;
      
      if (preset.description && preset.description.trim() !== '') {
        infoText += `<em>${preset.description}</em>`;
      }
      
      presetDescriptionElement.innerHTML = infoText;
      presetInfoElement.style.display = 'block';
    }
  }
};

  const toggleRoundsField = () => {
    if (!roundsFieldElement) return;
    
    const modalita = GameStateModule.getModalitaVittoria();
    if (modalita === 'rounds') {
      roundsFieldElement.style.display = 'block';
    } else {
      roundsFieldElement.style.display = 'none';
    }
  };

  const populatePresetSelect = () => {
    if (!presetSelectElement) return;
    
    const presets = GameStateModule.getPresets();
    
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
    
    const firstOption = presetSelectElement.querySelector('option:first-child');
    presetSelectElement.innerHTML = '';
    if (firstOption) {
      presetSelectElement.appendChild(firstOption);
    }
    
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
    
    // ✅ MODIFICATO: Mostra info complete del gioco
    if (presetInfoElement && presetDescriptionElement) {
      // Crea descrizione completa
      let infoText = `<strong>📋 ${preset.name}</strong><br><br>`;
      
      // Modalità vittoria
      let modalitaText = '';
      if (preset.mode === 'rounds') {
        modalitaText = `🏆 Vince chi vince <strong>${preset.roundsTarget || 3} rounds</strong>`;
      } else if (preset.mode === 'max') {
        modalitaText = `📈 Vince chi fa <strong>più punti</strong> (obiettivo: ${preset.target})`;
      } else {
        modalitaText = `📉 Vince chi fa <strong>meno punti</strong> (obiettivo: ${preset.target})`;
      }
      
      infoText += `${modalitaText}<br><br>`;
      
      // Descrizione preset se disponibile
      if (preset.description && preset.description.trim() !== '') {
        infoText += `<em>${preset.description}</em>`;
      }
      
      presetDescriptionElement.innerHTML = infoText;
      presetInfoElement.style.display = 'block';
    }
  };

  const resetPresetUI = () => {
    // Non serve più resettare preset UI
    // L'utente può solo selezionare preset, non modificare manualmente
  };

  const initializeFromState = () => {
    // Non serve più inizializzare controlli manuali
    // Il preset viene gestito automaticamente
  };

  const setupEventListeners = () => {
    if (presetSelectElement) {
      presetSelectElement.addEventListener('change', (e) => {
        applyPreset(e.target.value);
      });
    }

    const btnNuovaPartita = document.getElementById('btn-nuova-partita');
    if (btnNuovaPartita) {
      btnNuovaPartita.addEventListener('click', () => {
        if (confirm('Sei sicuro di voler iniziare una nuova partita? Tutti i punteggi attuali saranno azzerati.')) {
          GameStateModule.resetPunteggi();
          window.location.href = 'index.html';
        }
      });
    }

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

  return {
    cacheElements,
    initializeFromState,
    setupEventListeners
  };
})();

// -------------------------------------------------------------------
// 🎮 APP CONTROLLER
// -------------------------------------------------------------------
const AppController = (() => {
  const init = async () => {
    UIModule.cacheElements();
    UIModule.showLoader();

    const modal = document.getElementById('modal-overlay');
    if (modal) modal.style.display = 'none';

    const state = await DatabaseModule.loadState();
    GameStateModule.loadFromState(state);
    
    await DatabaseModule.requestPersistentStorage();

    UIModule.updateDarkModeIcon();

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
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        UIModule.hideModal();
      }
    });
    
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
    
    const btnClearHistory = document.getElementById('btn-clear-history');
    if (btnClearHistory) {
      btnClearHistory.addEventListener('click', async () => {
        await UIModule.clearStorico();
      });
    }
  };

  return {
    init
  };
})();

// -------------------------------------------------------------------
// 🚀 BOOTSTRAP
// -------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  AppController.init();
});

// -------------------------------------------------------------------
// 🌐 GLOBAL API
// -------------------------------------------------------------------
window.SegnapuntiApp = {
  toggleDarkMode: () => UIModule.toggleDarkMode(),
  version: '1.1.2',
  debug: {
    getState: () => ({
      modalita: GameStateModule.getModalitaVittoria(),
      obiettivo: GameStateModule.getPunteggioObiettivo(),
      roundsObiettivo: GameStateModule.getRoundsObiettivo(),
      giocatori: GameStateModule.getGiocatori(),
      terminata: GameStateModule.isPartitaTerminata()
    })
  }
};

window.toggleDarkMode = () => UIModule.toggleDarkMode();
