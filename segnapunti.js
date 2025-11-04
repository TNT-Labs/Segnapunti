let modalitaVittoria = 'max';
let punteggioObiettivo = 100;
let giocatori = [];
let partitaTerminata = false; 

// 🚩 Costanti IndexedDB
const DB_NAME = 'SegnapuntiDB';
const DB_VERSION = 2; // INCREMENTATO per la nuova struttura
const STORE_NAME = 'stato_partita';
const HISTORY_STORE_NAME = 'storico_partite'; // NUOVO STORE
const STATE_KEY = 'current_state';

let db; // Variabile globale per il database

// -------------------------------------------------------------------
// 🚩 Funzioni Pubbliche per settings.html (salvano solo lo stato)
// -------------------------------------------------------------------

window.setModalitaVittoria = (value) => {
    modalitaVittoria = value;
    salvaStato(); 
};

window.setPunteggioObiettivo = (value) => {
    punteggioObiettivo = value;
    salvaStato(); 
};

window.resetPartita = resetPartita; // Espone la funzione reset
window.caricaStoricoPartite = caricaStoricoPartite; // Espone la funzione per storico.html

// -------------------------------------------------------------------
// 🚩 LOGICA ASINCRONA INDEXEDDB
// -------------------------------------------------------------------

/**
 * Inizializza il database IndexedDB.
 * @returns {Promise<IDBDatabase>} Il database aperto.
 */
function openDB() {
    return new Promise((resolve, reject) => {
        // Ritorna l'istanza esistente se già aperta
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            
            // 1. Store per lo stato corrente della partita
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
            
            // 2. Store per lo storico delle partite
            if (!db.objectStoreNames.contains(HISTORY_STORE_NAME)) {
                // Usiamo un timestamp come chiave unica
                db.createObjectStore(HISTORY_STORE_NAME, { keyPath: 'timestamp' }); 
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = (event) => {
            console.error("Errore IndexedDB:", event.target.errorCode);
            reject(new Error("Errore nell'apertura del database IndexedDB."));
        };
    });
}

/**
 * Carica lo stato della partita da IndexedDB. (Nessuna Modifica)
 */
async function caricaStato() {
    try {
        const database = await openDB();
        const transaction = database.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        
        const request = store.get(STATE_KEY);
        
        return new Promise((resolve) => {
            request.onsuccess = (event) => {
                const stato = event.target.result;
                if (stato && stato.data) {
                    giocatori = stato.data.giocatori || [];
                    modalitaVittoria = stato.data.modalitaVittoria || 'max';
                    punteggioObiettivo = stato.data.punteggioObiettivo || 100;
                    partitaTerminata = stato.data.partitaTerminata || false;
                    
                    if (stato.data.darkMode) {
                        document.body.classList.add('dark-mode');
                    }
                } 
                resolve();
            };
            request.onerror = () => {
                resolve(); 
            };
        });
    } catch (e) {
        console.error("Impossibile caricare lo stato:", e);
    }
}

/**
 * Salva lo stato della partita su IndexedDB. (Nessuna Modifica)
 */
function salvaStato() {
    openDB().then(database => {
        const stato = {
            id: STATE_KEY, 
            data: {
                giocatori: giocatori,
                modalitaVittoria: modalitaVittoria,
                punteggioObiettivo: punteggioObiettivo,
                darkMode: document.body.classList.contains('dark-mode'),
                partitaTerminata: partitaTerminata 
            }
        };

        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const request = store.put(stato); 

        request.onerror = (event) => {
            console.error("[IndexedDB] Errore nel salvataggio dello stato:", event.target.error);
        };
    }).catch(e => {
        console.error("Impossibile salvare lo stato:", e);
    });
}

/**
 * 🚩 NUOVA FUNZIONE: Salva i dettagli della partita nello storico.
 */
async function salvaStoricoPartita(vincitoriNomi, puntiVincitore) {
    try {
        const database = await openDB();
        const partitaTerminataData = {
            timestamp: Date.now(), // Chiave unica per l'ordinamento
            dataOra: new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            modalitaVittoria: modalitaVittoria === 'max' ? 'Max Punti' : 'Min Punti',
            punteggioObiettivo: punteggioObiettivo,
            // Copia profonda dei dati dei giocatori
            giocatori: giocatori.map(g => ({ nome: g.nome, punti: g.punti })), 
            vincitori: vincitoriNomi,
            puntiVincitore: puntiVincitore
        };

        const transaction = database.transaction([HISTORY_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(HISTORY_STORE_NAME);
        
        const request = store.add(partitaTerminataData);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                console.log("[IndexedDB] Partita storicizzata.");
                resolve();
            };
            request.onerror = (event) => {
                console.error("[IndexedDB] Errore salvataggio storico:", event.target.error);
                reject(event.target.error);
            };
        });
    } catch (e) {
        console.error("Impossibile salvare lo storico:", e);
    }
}

/**
 * 🚩 NUOVA FUNZIONE: Carica lo storico completo delle partite.
 */
async function caricaStoricoPartite() {
    try {
        const database = await openDB();
        const transaction = database.transaction([HISTORY_STORE_NAME], 'readonly');
        const store = transaction.objectStore(HISTORY_STORE_NAME);
        
        const request = store.getAll();

        return new Promise((resolve) => {
            request.onsuccess = (event) => {
                // Ordina per timestamp (più recente in cima)
                const storico = event.target.result.sort((a, b) => b.timestamp - a.timestamp);
                resolve(storico);
            };
            request.onerror = (event) => {
                console.error("[IndexedDB] Errore nel caricamento dello storico:", event.target.error);
                resolve([]);
            };
        });
    } catch (e) {
        console.error("Impossibile caricare lo storico:", e);
        return [];
    }
}

// -------------------------------------------------------------------
// 🚩 LOGICA DOMContentLoaded (Nessuna Modifica)
// -------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async function() {
  await caricaStato(); 
  await requestPersistentStorage();

  if (document.getElementById('giocatori-lista')) {
      
      const nuovoGiocatoreInput = document.getElementById('nuovo-giocatore');
      
      nuovoGiocatoreInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault(); 
          aggiungiGiocatore();
        }
      });
      
      document.getElementById('btn-aggiungi-giocatore').addEventListener('click', aggiungiGiocatore);
      
      aggiornaListaGiocatori();
      controllaVittoria(); // Chiamata iniziale (che è ora async)
      
  } else if (document.getElementById('impostazioni-partita')) {
      
      document.getElementById('modalita-vittoria').value = modalitaVittoria;
      document.getElementById('punteggio-obiettivo').value = punteggioObiettivo;

  } else if (document.getElementById('storico-lista')) { 
      // LOGICA PER storico.html (Nuova Pagina)
      renderStoricoPartite();
  }
  
  document.getElementById('toggle-dark-mode').addEventListener('click', toggleDarkMode);
});

// -------------------------------------------------------------------
// 🚩 FUNZIONI CORE (Aggiornate)
// -------------------------------------------------------------------

// ... (requestPersistentStorage e resetPartita restano invariate) ...

async function controllaVittoria() {
  const winnerDiv = document.getElementById('winner-message');
  if (!winnerDiv) return;
  
  if (giocatori.length === 0) {
    partitaTerminata = false;
    winnerDiv.style.display = 'none';
    aggiornaListaGiocatori();
    salvaStato();
    return;
  }
  
  const puntiMappa = giocatori.map(g => g.punti);
  const maxPunti = Math.max(...puntiMappa);
  
  let isGameOver = false;
  
  if (maxPunti >= punteggioObiettivo) {
    isGameOver = true;
  }
  
  if (isGameOver) {
    // 🚩 NUOVO: Storicizza solo se la partita è appena terminata
    if (!partitaTerminata) { 
        
        // Trova i vincitori e i loro punti prima di salvare
        const vincitoriNomi = getVincitoriNomi(); 
        const puntiVincitore = (modalitaVittoria === 'max') 
                                ? Math.max(...puntiMappa) 
                                : Math.min(...puntiMappa);
        
        // Storicizza la partita (funzione asincrona)
        await salvaStoricoPartita(vincitoriNomi, puntiVincitore);

        partitaTerminata = true;
        salvaStato(); // Salva lo stato "partita terminata"
    }
    
    // UI Update
    aggiornaListaGiocatori(); 
    winnerDiv.style.display = 'block';
    winnerDiv.classList.add('finished'); 
    
    // Trova il punteggio del vincitore per la visualizzazione corretta
    const puntiVincitore = (modalitaVittoria === 'max') 
                            ? Math.max(...puntiMappa) 
                            : Math.min(...puntiMappa);
    const vincitoriNomi = getVincitoriNomi(); // Ri-ottieni per la UI
                            
    winnerDiv.innerHTML = `
        <span class="fireworks">🎉</span>
        <div class="winner-text">
            <strong>PARTITA TERMINATA!</strong><br>
            Vince: ${vincitoriNomi.join(', ')} (${puntiVincitore} punti)
        </div>
        <span class="fireworks">🎉</span>
    `;
    
  } else {
    if (partitaTerminata) {
        partitaTerminata = false; 
        salvaStato();
    }
    winnerDiv.style.display = 'none';
    winnerDiv.classList.remove('finished');
    aggiornaListaGiocatori(); 
  }
}

/**
 * 🚩 NUOVA FUNZIONE: Renderizza lo storico nella pagina dedicata.
 */
async function renderStoricoPartite() {
    const listaStorico = document.getElementById('storico-lista');
    if (!listaStorico) return;

    listaStorico.innerHTML = '<p class="loading-state">Caricamento storico...</p>';
    
    const storico = await caricaStoricoPartite();
    
    if (storico.length === 0) {
        listaStorico.innerHTML = '<p class="empty-state">Nessuna partita nello storico.</p>';
        return;
    }

    listaStorico.innerHTML = '';
    
    storico.forEach(partita => {
        const li = document.createElement('li');
        li.className = 'storico-item';
        
        const modalitaSimbolo = partita.modalitaVittoria === 'Min Punti' ? '🔻' : '🔺';
        
        // Formatta i giocatori: Nome (Punti)
        const giocatoriString = partita.giocatori.map(g => {
            let s = g.nome;
            if (partita.vincitori.includes(g.nome)) {
                s = `<strong>${g.nome}</strong> (${g.punti})`;
            } else {
                s = `${g.nome} (${g.punti})`;
            }
            return s;
        }).join(', ');
        
        li.innerHTML = `
            <div class="storico-header">
                <span class="storico-vincitore">${modalitaSimbolo} Vince: ${partita.vincitori.join(', ')} (${partita.puntiVincitore})</span>
                <span class="storico-data">${partita.dataOra}</span>
            </div>
            <div class="storico-details">
                <p><strong>Obiettivo:</strong> ${partita.punteggioObiettivo} (${partita.modalitaVittoria})</p>
                <p class="giocatori-list">${giocatoriString}</p>
            </div>
        `;
        listaStorico.appendChild(li);
    });
}


// ... (Tutte le altre funzioni come: requestPersistentStorage, resetPartita, aggiornaListaGiocatori, aggiungiGiocatore, rimuoviGiocatore, modificaPunteggio, chiediPunteggioPersonalizzato, getVincitoriNomi, toggleDarkMode rimangono invariate nella logica o usano la versione precedente che non conteneva chiamate dirette a localStorage/IndexedDB non necessarie) ...

// Funzione di reset della partita (Invariata nella logica di reindirizzamento)
function resetPartita() {
  if (confirm("Sei sicuro di voler iniziare una nuova partita? Tutti i punteggi attuali verranno azzerati.")) {
    giocatori = giocatori.map(g => ({ nome: g.nome, punti: 0 }));
    partitaTerminata = false;
    salvaStato(); 
    
    if (document.getElementById('impostazioni-partita')) {
        window.location.href = 'index.html';
    } else {
        aggiornaListaGiocatori();
        controllaVittoria();
    }
  }
}

// ... (altre funzioni) ...

// Espone le funzioni solo sulla pagina index.html per la gestione UI
if (document.getElementById('giocatori-lista')) {
    window.aggiungiGiocatore = aggiungiGiocatore;
    window.rimuoviGiocatore = rimuoviGiocatore;
    window.modificaPunteggio = modificaPunteggio;
    window.chiediPunteggioPersonalizzato = chiediPunteggioPersonalizzato;
}
