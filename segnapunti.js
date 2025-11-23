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
  const LOCALSTORAGE_FALLBACK_KEY = 'segnapunti_state_fallback';

  let db = null;
  let dbPromise = null;
  let retryCount = 0;
  const MAX_RETRIES = 3;

  // ✅ FIX CRITICO #3: Tracking errori per notificare utente
  let consecutiveErrors = 0;
  let hasShownPersistentErrorWarning = false;

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

  // ✅ FIX CRITICO #3: Caricamento con fallback localStorage
  const loadState = async () => {
    try {
      const db = await openDB();
      const state = await new Promise((resolve) => {
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

      // Se IndexedDB ha restituito dati, usali
      if (state) {
        return state;
      }

      // ✅ FIX CRITICO #3: Prova fallback localStorage se IndexedDB vuoto
      console.log('IndexedDB vuoto, provo fallback localStorage...');
      const fallbackData = StorageHelper.getItem(LOCALSTORAGE_FALLBACK_KEY);
      if (fallbackData) {
        try {
          const parsedState = JSON.parse(fallbackData);
          console.log('✅ Stato caricato da localStorage fallback');
          return parsedState;
        } catch (parseError) {
          console.error('Errore parsing localStorage fallback:', parseError);
        }
      }

      return null;

    } catch (error) {
      console.error("Errore nel caricamento dello stato:", error);

      // ✅ FIX CRITICO #3: Se IndexedDB fallisce completamente, usa fallback
      try {
        const fallbackData = StorageHelper.getItem(LOCALSTORAGE_FALLBACK_KEY);
        if (fallbackData) {
          const parsedState = JSON.parse(fallbackData);
          console.log('✅ Stato caricato da localStorage fallback (IndexedDB non disponibile)');
          return parsedState;
        }
      } catch (fallbackError) {
        console.error('Fallback localStorage fallito:', fallbackError);
      }

      return null;
    }
  };

  // ✅ FIX CRITICO #3: Helper per notificare errore persistente
  const showPersistentSaveError = () => {
    if (hasShownPersistentErrorWarning) return;

    hasShownPersistentErrorWarning = true;

    // Crea banner di warning persistente
    const banner = document.createElement('div');
    banner.id = 'save-error-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #f44336;
      color: white;
      padding: 15px;
      text-align: center;
      z-index: 10000;
      font-weight: 600;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    banner.innerHTML = `
      ⚠️ Impossibile salvare i dati. I progressi potrebbero andare persi!
      <button onclick="this.parentElement.remove()" style="
        margin-left: 15px;
        padding: 5px 12px;
        background: white;
        color: #f44336;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      ">OK</button>
    `;

    document.body.appendChild(banner);

    // Auto-remove dopo 10 secondi
    setTimeout(() => {
      if (banner.parentNode) {
        banner.remove();
      }
    }, 10000);
  };

  // ✅ FIX CRITICO #3: Salvataggio con retry e fallback
  const saveState = async (state, retries = 0) => {
    try {
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ id: STATE_KEY, ...state });

        // ✅ FIX #7: Usa transaction.oncomplete invece di request.onsuccess
        transaction.oncomplete = () => {
          consecutiveErrors = 0; // Reset counter su successo
          resolve();
        };
        transaction.onerror = () => {
          console.error('Errore durante il salvataggio dello stato');
          reject(new Error('Transaction failed'));
        };

        request.onerror = () => reject(new Error('Put request failed'));
      });

    } catch (error) {
      console.error(`Errore nel salvataggio dello stato (tentativo ${retries + 1}/${MAX_RETRIES + 1}):`, error);

      consecutiveErrors++;

      // ✅ FIX CRITICO #3: Retry con exponential backoff
      if (retries < MAX_RETRIES) {
        const delay = Math.pow(2, retries) * 500; // 500ms, 1s, 2s
        console.log(`Retry salvataggio tra ${delay}ms...`);

        await new Promise(resolve => setTimeout(resolve, delay));
        return saveState(state, retries + 1);
      }

      // ✅ FIX CRITICO #3: Tutti i retry falliti, usa fallback localStorage
      console.warn('IndexedDB non disponibile, uso fallback localStorage');

      try {
        StorageHelper.setItem(LOCALSTORAGE_FALLBACK_KEY, JSON.stringify(state));
        console.log('✅ Stato salvato in localStorage fallback');

        // Notifica utente solo dopo 3 errori consecutivi
        if (consecutiveErrors >= 3) {
          showPersistentSaveError();
        }

      } catch (fallbackError) {
        console.error('CRITICO: Fallback localStorage fallito:', fallbackError);

        // Show critical error
        showPersistentSaveError();
        throw new Error('Impossibile salvare i dati: sia IndexedDB che localStorage non disponibili');
      }
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
  let nomeGiocoCorrente = ''; // ✅ NUOVO: Nome del gioco/preset corrente
  let presetKeySelezionato = ''; // ✅ NUOVO v1.3.3: Salva la key del preset attivo

  const generatePlayerId = () => {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const getModalitaVittoria = () => modalitaVittoria;
  const getPunteggioObiettivo = () => punteggioObiettivo;
  const getRoundsObiettivo = () => roundsObiettivo;
  const getRoundMode = () => roundMode; // ✅ FIX #11: Getter per roundMode
  const getGiocatori = () => [...giocatori];
  const isPartitaTerminata = () => partitaTerminata;
  const getNomeGiocoCorrente = () => nomeGiocoCorrente; // ✅ NUOVO
  const getPresetKeySelezionato = () => presetKeySelezionato; // ✅ NUOVO v1.3.3
  const getPresets = () => {
    if (window.PresetManager) {
      return window.PresetManager.getAllPresets();
    }
    return {};
  };

  const setModalitaVittoria = (value) => {
    modalitaVittoria = value;
    nomeGiocoCorrente = ''; // ✅ Reset nome gioco quando cambia manualmente
    presetKeySelezionato = ''; // ✅ NUOVO v1.3.3: Reset preset key
    saveCurrentState();
  };

  const setPunteggioObiettivo = (value) => {
    const punti = parseInt(value, 10);
    if (isNaN(punti) || punti <= 0) {
      throw new Error('Il punteggio obiettivo deve essere un numero positivo.');
    }
    punteggioObiettivo = punti;
    nomeGiocoCorrente = ''; // ✅ Reset nome gioco quando cambia manualmente
    presetKeySelezionato = ''; // ✅ NUOVO v1.3.3: Reset preset key
    saveCurrentState();
  };

  const setRoundsObiettivo = (value) => {
    const rounds = parseInt(value, 10);
    if (isNaN(rounds) || rounds <= 0) {
      throw new Error('Il numero di rounds deve essere un numero positivo.');
    }
    roundsObiettivo = rounds;
    nomeGiocoCorrente = ''; // ✅ Reset nome gioco quando cambia manualmente
    presetKeySelezionato = ''; // ✅ NUOVO v1.3.3: Reset preset key
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

    // ✅ FIX CRITICO #5: Validazione WHITELIST invece di blacklist (più sicura)
    // Permette solo: lettere (tutte le lingue Unicode), numeri, spazi, apostrofi, trattini
    const allowedCharsPattern = /^[\p{L}\p{N}\s'\-]+$/u;

    if (!allowedCharsPattern.test(nomeTrimmed)) {
      throw new Error("Il nome può contenere solo lettere, numeri, spazi, apostrofi e trattini.");
    }

    // ✅ FIX CRITICO #5: Sanificazione aggiuntiva - rimuovi spazi multipli
    const nomeSanitized = nomeTrimmed.replace(/\s+/g, ' ').trim();

    // ✅ FIX CRITICO #5: Normalizzazione migliorata per check duplicati
    const nomeNormalizzato = nomeSanitized.toLowerCase();
    if (giocatori.some(g => g.nome.replace(/\s+/g, ' ').trim().toLowerCase() === nomeNormalizzato)) {
      throw new Error("Questo nome esiste già!");
    }

    // ✅ DARTS FIX: Se modalità darts, inizia dal punteggio target
    const startingScore = modalitaVittoria === 'darts' ? punteggioObiettivo : 0;

    const newPlayer = {
      id: generatePlayerId(),
      nome: nomeSanitized, // ✅ FIX CRITICO #5: Usa nome sanificato
      punti: startingScore,
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
      // ✅ FIX #6: Gestione speciale per modalità freccette con bust detection
      if (modalitaVittoria === 'darts') {
        const previousScore = giocatore.punti;
        const newScore = previousScore + delta;

        // ✅ FIX #6: BUST se va sotto zero
        if (newScore < 0) {
          return 'bust'; // Ritorna 'bust' invece di false
        }

        // ✅ FIX #6: BUST se arriva esattamente a 1 (impossibile double-out da 1)
        if (newScore === 1) {
          return 'bust';
        }

        // Aggiorna normalmente
        giocatore.punti = newScore;
      } else {
        // Modalità normale
        giocatore.punti += delta;
      }

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
      // ✅ DARTS FIX: Se modalità darts, resetta al punteggio iniziale
      g.punti = modalitaVittoria === 'darts' ? punteggioObiettivo : 0;
      g.rounds = 0;
    });
    partitaTerminata = false;
    saveCurrentState();
  };

  const applyPreset = (presetKey) => {
    const presets = getPresets();
    const preset = presets[presetKey];

    // ✅ FIX #10: Valida esistenza preset
    if (!preset) {
      console.error(`[GameState] Preset "${presetKey}" not found`);
      // Reset preset selection
      presetKeySelezionato = '';
      saveCurrentState();
      return null;
    }
    
    modalitaVittoria = preset.mode;
    punteggioObiettivo = preset.target;
    
    // ✅ DARTS FIX: Se ci sono giocatori esistenti e cambio a modalità darts, resetta punteggi
    if (preset.mode === 'darts' && giocatori.length > 0) {
      giocatori.forEach(g => {
        g.punti = preset.startingScore || preset.target;
      });
    }
    // Se cambio da darts ad altra modalità, resetta a 0
    else if (modalitaVittoria !== 'darts' && preset.mode !== 'darts' && giocatori.length > 0) {
      giocatori.forEach(g => {
        g.punti = 0;
      });
    }
    
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
    
    // ✅ NUOVO: Salva il nome del gioco e la key del preset
    nomeGiocoCorrente = preset.name || '';
    presetKeySelezionato = presetKey; // ✅ NUOVO v1.3.3: Salva preset key
    
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
    // ✅ DARTS FIX: Vince chi arriva esattamente a 0
    else if (modalitaVittoria === 'darts' && minPunti === 0) {
      hasWinner = true;
      vincitori = giocatori.filter(g => g.punti === 0).map(g => g.nome);
      puntiVincitore = 0;
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
      roundMode, // ✅ FIX #11: Salva roundMode
      giocatori,
      partitaTerminata,
      darkMode,
      nomeGiocoCorrente, // ✅ NUOVO: Salva nome gioco
      presetKeySelezionato // ✅ NUOVO v1.3.3: Salva preset key selezionato
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
      nomeGiocoCorrente = state.nomeGiocoCorrente || ''; // ✅ NUOVO: Carica nome gioco
      presetKeySelezionato = state.presetKeySelezionato || ''; // ✅ NUOVO v1.3.3: Carica preset key
      
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
      
      // ✅ FIX #12: Sincronizza dark mode da localStorage (source of truth)
      try {
        const localStorageDarkMode = localStorage.getItem('darkMode');
        if (localStorageDarkMode !== null) {
          // localStorage has precedence
          const isDark = localStorageDarkMode === 'true';
          if (isDark) {
            document.body.classList.add('dark-mode');
          } else {
            document.body.classList.remove('dark-mode');
          }
        } else if (state.darkMode === true) {
          // Fallback a state.darkMode se localStorage non disponibile
          document.body.classList.add('dark-mode');
        } else if (state.darkMode === false) {
          document.body.classList.remove('dark-mode');
        }
      } catch (error) {
        // Fallback a state.darkMode se localStorage fallisce
        if (state.darkMode === true) {
          document.body.classList.add('dark-mode');
        } else if (state.darkMode === false) {
          document.body.classList.remove('dark-mode');
        }
      }
    }
  };

  const saveToHistory = async (vincitori, puntiVincitore, roundsVincitore) => {
    // ✅ FIX #9: Calcola durata partita (usa timestamp più vecchio dei giocatori)
    const now = Date.now();
    const oldestPlayerTime = Math.min(...giocatori.map(g => g.createdAt || now));
    const duration = now - oldestPlayerTime;

    const partita = {
      timestamp: now,
      data: new Date().toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }),
      vincitori: vincitori,
      puntiVincitore: puntiVincitore,
      roundsVincitore: roundsVincitore || 0,
      modalita: modalitaVittoria,
      nomeGioco: nomeGiocoCorrente || '', // ✅ NUOVO: Salva nome gioco

      // ✅ FIX #9: Aggiungi campi mancanti
      roundMode: roundMode, // Come si vincevano i round (max/min)
      punteggioObiettivo: punteggioObiettivo, // Target originale
      roundsObiettivo: roundsObiettivo, // Rounds target se mode='rounds'
      startTime: oldestPlayerTime, // Timestamp inizio (giocatore più vecchio)
      endTime: now, // Timestamp fine
      duration: duration, // Durata in millisecondi

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
    getRoundMode, // ✅ FIX #11: Esporta getter
    getGiocatori,
    isPartitaTerminata,
    getNomeGiocoCorrente, // ✅ NUOVO
    getPresetKeySelezionato, // ✅ NUOVO v1.3.3: Esponi getter preset key
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

  // ✅ FIX CRITICO #2: Tracking floating numbers per cleanup
  let activeFloatingNumbers = new Set();

  // ✅ FIX #8: Queue per notifiche round/bust per evitare sovrapposizioni
  let notificationQueue = [];
  let isShowingNotification = false;

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

  // ✅ FIX CRITICO #2: Cleanup completo dei floating numbers
  const cleanupFloatingNumbers = () => {
    activeFloatingNumbers.forEach(floatingNumber => {
      if (floatingNumber && floatingNumber.parentNode) {
        floatingNumber.parentNode.removeChild(floatingNumber);
      }
    });
    activeFloatingNumbers.clear();
  };

  // ✅ FIX CRITICO #2: Cleanup migliorato con verifica esistenza
  const cleanupButtonListeners = () => {
    currentButtonListeners.forEach(({ element, event, handler }) => {
      // Verifica che l'elemento esista ancora prima di rimuovere il listener
      if (element && element.parentNode) {
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

    const player = GameStateModule.getGiocatoreById(playerId);
    const playerName = player ? player.nome : 'giocatore';

    const btnMinus = document.createElement('button');
    btnMinus.textContent = '-1 🏆';
    btnMinus.className = 'btn-round-minus';
    btnMinus.title = 'Rimuovi 1 round';

    // ✅ FIX #19: Aria-label per accessibilità
    btnMinus.setAttribute('aria-label', `Rimuovi 1 round da ${playerName}`);

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

    // ✅ FIX #19: Aria-label per accessibilità
    btnPlus.setAttribute('aria-label', `Aggiungi 1 round vinto a ${playerName}`);

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
    
    // ✅ FIX: Header con nome e punteggio orizzontali
    const headerDiv = document.createElement('div');
    headerDiv.className = 'giocatore-header';
    
    const nomeDiv = document.createElement('div');
    nomeDiv.className = 'giocatore-nome';
    nomeDiv.textContent = giocatore.nome;
    
    const punteggioDiv = document.createElement('div');
    punteggioDiv.className = 'giocatore-punteggio';
    punteggioDiv.id = `punti-${giocatore.id}`;
    punteggioDiv.textContent = giocatore.punti;
    
    headerDiv.appendChild(nomeDiv);
    headerDiv.appendChild(punteggioDiv);
    
    // ✅ Rounds (se modalità rounds)
    let roundsDiv = null;
    if (isRoundsMode) {
      roundsDiv = document.createElement('div');
      roundsDiv.className = 'giocatore-rounds';
      roundsDiv.innerHTML = `
        <span class="giocatore-rounds-label">Rounds vinti:</span>
        <span class="giocatore-rounds-count" id="rounds-${giocatore.id}">${giocatore.rounds}</span>
      `;
    }
    
    // ✅ Pulsanti azioni
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'giocatore-actions';
    
    if (isRoundsMode) {
      const roundsControls = createRoundsControls(giocatore.id);
      roundsControls.style.gridColumn = '1 / -1';
      roundsControls.style.marginBottom = '8px';
      actionsDiv.appendChild(roundsControls);
    }
    
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

      // ✅ FIX #19: Aria-label per accessibilità
      button.setAttribute('aria-label', `Aggiungi ${btn.value > 0 ? '+' : ''}${btn.value} punti a ${giocatore.nome}`);

      // ✅ FIX #2 & #6: Registra listener con bust detection
      const handler = () => {
        const result = GameStateModule.updatePunteggio(giocatore.id, btn.value);

        // ✅ FIX #6: Mostra notifica BUST se modalità darts
        if (result === 'bust') {
          const player = GameStateModule.getGiocatoreById(giocatore.id);
          const attemptedScore = player.punti + btn.value;
          showBustNotification(player.nome, attemptedScore);
          return; // Non aggiornare UI se bust
        }

        if (result) {
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

      actionsDiv.appendChild(button);
    });
    
    const customBtn = document.createElement('button');
    customBtn.textContent = '± Personalizza';
    customBtn.className = 'btn-custom-score';
    customBtn.disabled = partitaTerminata;
    customBtn.style.gridColumn = '1 / -1';

    // ✅ FIX #19: Aria-label per accessibilità
    customBtn.setAttribute('aria-label', `Inserisci punteggio personalizzato per ${giocatore.nome}`);

    // ✅ FIX #2: Registra listener
    const customHandler = () => showModal(giocatore.id);
    registerListener(customBtn, 'click', customHandler);
    
    actionsDiv.appendChild(customBtn);
    
    // ✅ Assembla il box
    li.appendChild(headerDiv);
    if (roundsDiv) {
      li.appendChild(roundsDiv);
    }
    li.appendChild(actionsDiv);
    
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
    
    const animKey = `anim-rounds-${playerId}`;
    if (activeAnimations.has(animKey)) return;
    
    activeAnimations.add(animKey);
    
    const animClass = delta >= 0 ? 'anim-up' : 'anim-down';
    
    roundsElement.classList.remove('anim-up', 'anim-down');
    void roundsElement.offsetWidth;
    roundsElement.classList.add(animClass);
    
    const giocatore = GameStateModule.getGiocatoreById(playerId);
    if (giocatore) {
      roundsElement.textContent = giocatore.rounds;
    }
    
    const cleanup = () => {
      roundsElement.classList.remove(animClass);
      activeAnimations.delete(animKey);
    };
    
    roundsElement.addEventListener('animationend', cleanup, { once: true });
    setTimeout(cleanup, 500);
  };

  // ✅ FIX #8: Processa queue di notifiche FIFO
  const processNotificationQueue = () => {
    if (isShowingNotification || notificationQueue.length === 0) {
      return; // Already showing one, or queue is empty
    }

    isShowingNotification = true;
    const { type, data } = notificationQueue.shift();

    if (type === 'round_won') {
      _showRoundWonNotificationInternal(data);
    } else if (type === 'bust') {
      _showBustNotificationInternal(data);
    }
  };

  // ✅ FIX #11: Mostra notifica quando un round viene vinto (con queue)
  const showRoundWonNotification = (roundInfo) => {
    notificationQueue.push({ type: 'round_won', data: roundInfo });
    processNotificationQueue();
  };

  // ✅ FIX #11: Implementazione interna (chiamata dalla queue)
  const _showRoundWonNotificationInternal = (roundInfo) => {
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

    // ✅ FIX #8: Rimuovi dopo animazione e processa prossima notifica
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
      isShowingNotification = false;
      processNotificationQueue(); // Process next in queue
    }, 3000);
  };

  // ✅ FIX #6: Mostra notifica BUST per modalità darts (con queue)
  const showBustNotification = (playerName, attemptedScore) => {
    notificationQueue.push({ type: 'bust', data: { playerName, attemptedScore } });
    processNotificationQueue();
  };

  // ✅ FIX #6: Implementazione interna (chiamata dalla queue)
  const _showBustNotificationInternal = ({ playerName, attemptedScore }) => {
    const notification = document.createElement('div');
    notification.className = 'bust-notification';
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #f44336, #d32f2f);
      color: white;
      padding: 20px 30px;
      border-radius: 16px;
      font-size: 1.3em;
      font-weight: 700;
      box-shadow: 0 8px 24px rgba(244, 67, 54, 0.6);
      z-index: 9999;
      animation: bustShake 0.6s ease-out, slideOutTop 0.5s ease-in 1.5s;
      max-width: 90%;
      text-align: center;
    `;

    let bustReason = '';
    if (attemptedScore < 0) {
      bustReason = 'Sforamento!';
    } else if (attemptedScore === 1) {
      bustReason = 'Non puoi finire a 1!';
    }

    notification.innerHTML = `
      <div style="font-size: 2.5em; margin-bottom: 5px;">💥</div>
      <div style="font-size: 1.5em; margin-bottom: 8px;">BUST!</div>
      <div style="font-size: 0.85em; opacity: 0.95;">${bustReason}</div>
    `;

    // Aggiungi animazione shake se non esiste
    if (!document.querySelector('#bust-animation')) {
      const style = document.createElement('style');
      style.id = 'bust-animation';
      style.textContent = `
        @keyframes bustShake {
          0%, 100% { transform: translate(-50%, 0); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-55%, 0); }
          20%, 40%, 60%, 80% { transform: translate(-45%, 0); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // ✅ FIX #8: Rimuovi dopo 2 secondi e processa prossima notifica
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
      isShowingNotification = false;
      processNotificationQueue(); // Process next in queue
    }, 2000);
  };

  const animatePunteggio = (playerId, delta) => {
    const puntiElement = document.getElementById(`punti-${playerId}`);
    if (!puntiElement) return;

    const animKey = `anim-${playerId}`;
    if (activeAnimations.has(animKey)) return;

    activeAnimations.add(animKey);

    const animClass = delta >= 0 ? 'anim-up' : 'anim-down';

    puntiElement.classList.remove('anim-up', 'anim-down');
    void puntiElement.offsetWidth;
    puntiElement.classList.add(animClass);

    const giocatore = GameStateModule.getGiocatoreById(playerId);
    if (giocatore) {
      puntiElement.textContent = giocatore.punti;
    }

    const floatingNumber = document.createElement('span');
    floatingNumber.className = `floating-number ${delta >= 0 ? 'positive' : 'negative'}`;
    floatingNumber.textContent = delta >= 0 ? `+${delta}` : delta;

    const rect = puntiElement.getBoundingClientRect();
    floatingNumber.style.position = 'fixed';
    // ✅ FIX: Posizione centrata sopra il punteggio invece che a destra
    floatingNumber.style.left = `${rect.left + (rect.width / 2) - 20}px`;
    floatingNumber.style.top = `${rect.top - 10}px`;
    floatingNumber.style.zIndex = '1000';

    document.body.appendChild(floatingNumber);

    // ✅ FIX CRITICO #2: Traccia floating number per cleanup
    activeFloatingNumbers.add(floatingNumber);

    // ✅ FIX CRITICO #2: Cleanup garantito con doppio meccanismo
    let floatingRemoved = false;
    const removeFloating = () => {
      if (!floatingRemoved && floatingNumber && floatingNumber.parentNode) {
        floatingNumber.parentNode.removeChild(floatingNumber);
        activeFloatingNumbers.delete(floatingNumber);
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

    const result = GameStateModule.updatePunteggio(globalPlayerIdToUpdate, deltaPunti);

    // ✅ FIX #6: Mostra notifica BUST se modalità darts
    if (result === 'bust') {
      const player = GameStateModule.getGiocatoreById(globalPlayerIdToUpdate);
      const attemptedScore = player.punti + deltaPunti;
      showBustNotification(player.nome, attemptedScore);
      hideModal();
      return; // Non aggiornare UI se bust
    }

    if (result) {
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

    // ✅ FIX CRITICO #2: Cleanup completo prima del re-render
    cleanupButtonListeners();
    cleanupFloatingNumbers();

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
      
      // ✅ FIX #9: Mostra informazioni complete della partita
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
        } else if (partita.modalita === 'darts') {
          modalitaText = 'Darts';
        } else {
          modalitaText = 'Meno punti';
        }
        infoP.innerHTML = `Modalità: <strong>${modalitaText}</strong>`;
      }

      // ✅ FIX #9: Aggiungi informazioni dettagliate se disponibili
      const detailsP = document.createElement('p');
      let detailsText = '';

      if (partita.punteggioObiettivo) {
        detailsText += `Obiettivo: <strong>${partita.punteggioObiettivo}</strong> punti`;
      }

      if (partita.roundsObiettivo && partita.modalita === 'rounds') {
        if (detailsText) detailsText += ' • ';
        detailsText += `Best of <strong>${partita.roundsObiettivo}</strong> rounds`;
      }

      if (partita.duration) {
        const minutes = Math.floor(partita.duration / 60000);
        const seconds = Math.floor((partita.duration % 60000) / 1000);
        if (detailsText) detailsText += ' • ';
        detailsText += `Durata: <strong>${minutes}m ${seconds}s</strong>`;
      }

      if (detailsText) {
        detailsP.innerHTML = detailsText;
        detailsP.style.fontSize = '0.9em';
        detailsP.style.opacity = '0.8';
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
      if (detailsText) {
        details.appendChild(detailsP);
      }
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
    const isDark = document.body.classList.contains('dark-mode');

    // ✅ FIX #12: Sync dark mode to localStorage for cross-page consistency
    try {
      localStorage.setItem('darkMode', isDark.toString());
    } catch (error) {
      console.warn('[DarkMode] Cannot save to localStorage:', error);
    }

    updateDarkModeIcon();
    GameStateModule.saveCurrentState();
  };

  // ✅ FIX CRITICO #2: Cleanup globale completo
  const cleanupAll = () => {
    cleanupButtonListeners();
    cleanupFloatingNumbers();
    activeAnimations.clear();
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
    toggleDarkMode,
    // ✅ FIX CRITICO #2: Esponi cleanup per gestione memory leaks
    cleanupAll,
    cleanupFloatingNumbers,
    cleanupButtonListeners
  };
})();

// ✅ FIX CRITICO #2: Cleanup globale al beforeunload
window.addEventListener('beforeunload', () => {
  if (UIModule && UIModule.cleanupAll) {
    UIModule.cleanupAll();
  }
});

// -------------------------------------------------------------------
// 🎛️ SETTINGS MODULE
// -------------------------------------------------------------------
const SettingsModule = (() => {
  let presetSelectElement = null;
  let presetInfoElement = null;
  let presetDescriptionElement = null;

  const cacheElements = () => {
    presetSelectElement = document.getElementById('preset-gioco');
    presetInfoElement = document.getElementById('preset-info');
    presetDescriptionElement = document.getElementById('preset-description');
    
    populatePresetSelect();
    
    // ✅ FIX #10: Ripristina e valida selezione preset salvata
    const presetKey = GameStateModule.getPresetKeySelezionato();
    if (presetKey && presetSelectElement) {
      const presets = GameStateModule.getPresets();
      const preset = presets[presetKey];

      // ✅ FIX #10: Valida che il preset esista ancora
      if (!preset) {
        console.warn(`[Settings] Preset "${presetKey}" non trovato, reset a default`);
        // Reset preset selection
        presetSelectElement.value = '';
        if (presetInfoElement) {
          presetInfoElement.style.display = 'none';
        }
        // Non salvare lo stato ora per evitare di sovrascrivere altre impostazioni
        return;
      }

      presetSelectElement.value = presetKey;

      // Mostra info preset senza ri-applicarlo (evita loop)
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
    // ✅ FIX CRITICO #1: Gestione loader centralizzata con error handling
    const loader = document.getElementById('loader-overlay');
    let hasError = false;

    try {
      UIModule.cacheElements();
      UIModule.showLoader();

      const modal = document.getElementById('modal-overlay');
      if (modal) modal.style.display = 'none';

      // ✅ FIX #1: Init monetizzazione PRIMA di caricare lo stato del gioco
      try {
        // 1. Init billing PRIMA
        await BillingModule.init();

        // 2. Init ads solo se non premium
        if (!BillingModule.isPremium()) {
          await AdsModule.init();
        }

        // 3. Init Premium UI DOPO billing
        await PremiumUIModule.init();

      } catch (monetizationError) {
        console.error('Monetization init error:', monetizationError);
        // Non bloccare l'app se la monetizzazione fallisce
      }

      // Carica stato gioco
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

    } catch (error) {
      console.error('App init error:', error);
      hasError = true;

      // ✅ FIX #1: Mostra messaggio errore user-friendly
      if (loader) {
        const loaderText = loader.querySelector('p');
        if (loaderText) {
          loaderText.textContent = '⚠️ Errore caricamento. Ricarica la pagina.';
          loaderText.style.color = '#ff6b6b';
        }

        // Aggiungi bottone ricarica
        const reloadBtn = document.createElement('button');
        reloadBtn.textContent = '🔄 Ricarica';
        reloadBtn.style.cssText = 'margin-top: 20px; padding: 12px 24px; background: #4A148C; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;';
        reloadBtn.onclick = () => window.location.reload();
        loader.appendChild(reloadBtn);
      }

    } finally {
      // ✅ FIX #1: Nascondi loader SOLO se tutto è andato bene
      // Se c'è errore, mantieni visibile con messaggio
      if (!hasError) {
        UIModule.hideLoader();
      }
    }
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
