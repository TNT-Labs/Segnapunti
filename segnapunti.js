let modalitaVittoria = 'max';
let punteggioObiettivo = 101;
let giocatori = [];
let partitaTerminata = false; 

// 🚩 Costanti IndexedDB
const DB_NAME = 'SegnapuntiDB';
const DB_VERSION = 1;
const STORE_NAME = 'stato_partita';
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

// -------------------------------------------------------------------
// 🚩 LOGICA ASINCRONA INDEXEDDB
// -------------------------------------------------------------------

/**
 * Inizializza il database IndexedDB.
 * @returns {Promise<IDBDatabase>} Il database aperto.
 */
function openDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            // Crea l'object store se non esiste (o in caso di aggiornamento versione)
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
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
 * Carica lo stato della partita da IndexedDB.
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
                    // Applica lo stato caricato
                    giocatori = stato.data.giocatori || [];
                    modalitaVittoria = stato.data.modalitaVittoria || 'max';
                    punteggioObiettivo = stato.data.punteggioObiettivo || 100;
                    partitaTerminata = stato.data.partitaTerminata || false;
                    
                    if (stato.data.darkMode) {
                        document.body.classList.add('dark-mode');
                    }
                    console.log("[IndexedDB] Stato caricato con successo.");
                } else {
                    console.log("[IndexedDB] Nessuno stato salvato trovato. Uso i valori di default.");
                }
                resolve();
            };
            request.onerror = () => {
                console.error("[IndexedDB] Errore nel caricamento dello stato.");
                resolve(); // Non bloccare l'app in caso di errore di caricamento
            };
        });
    } catch (e) {
        console.error("Impossibile caricare lo stato (IndexedDB non disponibile):", e);
    }
}

/**
 * Salva lo stato della partita su IndexedDB.
 */
function salvaStato() {
    openDB().then(database => {
        const stato = {
            id: STATE_KEY, // Chiave fissa per sovrascrivere il singolo stato
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
        
        const request = store.put(stato); // put() sovrascrive se la chiave esiste

        request.onerror = (event) => {
            console.error("[IndexedDB] Errore nel salvataggio dello stato:", event.target.error);
        };
    }).catch(e => {
        console.error("Impossibile salvare lo stato:", e);
    });
}

// -------------------------------------------------------------------
// 🚩 LOGICA DOMContentLoaded (Inizializzazione)
// -------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async function() {
  await caricaStato(); // Caricamento Asincrono (IndexedDB)
  await requestPersistentStorage();

  // Gestione specifica in base alla pagina
  if (document.getElementById('giocatori-lista')) {
      // LOGICA PER index.html (Pagina Partita)
      
      const nuovoGiocatoreInput = document.getElementById('nuovo-giocatore');
      
      nuovoGiocatoreInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault(); 
          aggiungiGiocatore();
        }
      });
      
      document.getElementById('btn-aggiungi-giocatore').addEventListener('click', aggiungiGiocatore);
      
      aggiornaListaGiocatori();
      controllaVittoria(); 
      
  } else if (document.getElementById('impostazioni-partita')) {
      // LOGICA PER settings.html (Pagina Impostazioni)
      
      document.getElementById('modalita-vittoria').value = modalitaVittoria;
      document.getElementById('punteggio-obiettivo').value = punteggioObiettivo;
  }
  
  document.getElementById('toggle-dark-mode').addEventListener('click', toggleDarkMode);
});

// -------------------------------------------------------------------
// 🚩 FUNZIONI CORE
// -------------------------------------------------------------------

/**
 * Richiede lo storage persistente al browser.
 */
async function requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        if (isPersisted) {
            return true;
        }
        
        const granted = await navigator.storage.persist();
        if (granted) {
            return true;
        } else {
            console.warn("Storage persistente negato. I dati potrebbero essere cancellati.");
            return false;
        }
    }
    return false;
}

// Funzione di reset della partita
function resetPartita() {
  if (confirm("Sei sicuro di voler iniziare una nuova partita? Tutti i punteggi attuali verranno azzerati.")) {
    giocatori = giocatori.map(g => ({ nome: g.nome, punti: 0 }));
    partitaTerminata = false;
    salvaStato(); // Salva lo stato resettato
    
    // Forziamo il reindirizzamento se siamo in settings.html
    if (document.getElementById('impostazioni-partita')) {
        window.location.href = 'index.html';
    } else {
        aggiornaListaGiocatori();
        controllaVittoria();
    }
  }
}

function aggiornaListaGiocatori() {
  const lista = document.getElementById('giocatori-lista');
  if (!lista) return;
  
  lista.innerHTML = '';
  const vincitoriNomi = getVincitoriNomi();
  
  if (giocatori.length === 0) {
      lista.innerHTML = '<p class="empty-state">Nessun giocatore. Aggiungi i partecipanti qui sopra per iniziare!</p>';
  }
  
  const isGameFinished = partitaTerminata;

  giocatori.forEach((g, i) => {
    const li = document.createElement('li');
    li.className = `giocatore-item ${vincitoriNomi.includes(g.nome) ? 'winner-highlight' : ''} ${isGameFinished ? 'game-over' : ''}`;
    
    li.innerHTML = `
      <span class="giocatore-nome">${g.nome}</span>
      <div class="punti-e-controlli">
        <span class="giocatore-punti" id="punti-${i}"><strong>${g.punti}</strong> Punti</span>
        <div class="punteggio-controls">
          <button title="Aggiungi 1 punto" onclick="modificaPunteggio(${i}, 1)" ${isGameFinished ? 'disabled' : ''}>+1</button>
          <button title="Rimuovi 1 punto" onclick="modificaPunteggio(${i}, -1)" ${isGameFinished ? 'disabled' : ''}>-1</button>
          <button title="Aggiungi 5 punti" onclick="modificaPunteggio(${i}, 5)" ${isGameFinished ? 'disabled' : ''}>+5</button>
          <button title="Rimuovi 5 punti" onclick="modificaPunteggio(${i}, -5)" ${isGameFinished ? 'disabled' : ''}>-5</button>
          <button title="Aggiungi Punti Personalizzati" onclick="chiediPunteggioPersonalizzato(${i})" class="btn-custom-score" ${isGameFinished ? 'disabled' : ''}>±</button>
          <button title="Rimuovi giocatore" onclick="rimuoviGiocatore(${i})" class="btn-rimuovi" ${isGameFinished ? 'disabled' : ''}>🗑️</button>
        </div>
      </div>
    `;
    lista.appendChild(li);
  });
  
  const btnAggiungi = document.getElementById('btn-aggiungi-giocatore');
  const inputAggiungi = document.getElementById('nuovo-giocatore');
  if (btnAggiungi) btnAggiungi.disabled = isGameFinished;
  if (inputAggiungi) inputAggiungi.disabled = isGameFinished;
}

function aggiungiGiocatore() {
  if (partitaTerminata) return; 

  const nomeInput = document.getElementById('nuovo-giocatore');
  const nome = nomeInput.value.trim();
  if (nome) {
    giocatori.push({ nome: nome, punti: 0 });
    nomeInput.value = '';
    salvaStato(); 
    aggiornaListaGiocatori();
  }
}

function rimuoviGiocatore(index) {
  if (partitaTerminata) return; 
  
  giocatori.splice(index, 1);
  salvaStato(); 
  aggiornaListaGiocatori();
  controllaVittoria();
}

function modificaPunteggio(index, delta) {
  if (partitaTerminata) return; 

  giocatori[index].punti += delta;
  
  const puntiElement = document.getElementById(`punti-${index}`);
  if (puntiElement) {
    puntiElement.classList.add(delta > 0 ? 'anim-up' : 'anim-down');
    puntiElement.addEventListener('animationend', () => {
      puntiElement.classList.remove('anim-up', 'anim-down');
    }, { once: true });
    
    puntiElement.querySelector('strong').textContent = giocatori[index].punti;
  }

  salvaStato(); 
  aggiornaListaGiocatori();
  controllaVittoria();
}

function chiediPunteggioPersonalizzato(index) {
  if (partitaTerminata) return; 
  
  const nomeGiocatore = giocatori[index].nome;
  const punteggioAttuale = giocatori[index].punti;
  
  let input = prompt(`Inserisci il DELTA (es. 15, -10) o il NUOVO PUNTEGGIO (preceduto da '=') per ${nomeGiocatore}:\nPunti attuali: ${punteggioAttuale}`);
  
  if (input === null || input.trim() === '') return;

  input = input.trim();
  let delta = 0;
  
  if (input.startsWith('=')) {
    let nuovoPunteggio = parseInt(input.substring(1), 10);
    if (!isNaN(nuovoPunteggio)) {
      delta = nuovoPunteggio - punteggioAttuale;
    } else {
      alert("Input non valido per l'impostazione del punteggio.");
      return;
    }
  } else {
    delta = parseInt(input, 10);
    if (isNaN(delta)) {
      alert("Input non valido per l'aggiunta di punti.");
      return;
    }
  }

  if (delta !== 0) {
    modificaPunteggio(index, delta);
  }
}

function getVincitoriNomi() {
  if (giocatori.length === 0) return [];
  
  const puntiMappa = giocatori.map(g => g.punti);
  let vincitori = [];

  if (modalitaVittoria === 'max') {
    const maxPunti = Math.max(...puntiMappa);
    if (maxPunti >= punteggioObiettivo || partitaTerminata) {
      vincitori = giocatori.filter(g => g.punti === maxPunti);
    }
  } else {
    const minPunti = Math.min(...puntiMappa);
    if (minPunti <= punteggioObiettivo || partitaTerminata) {
      vincitori = giocatori.filter(g => g.punti === minPunti);
    }
  }
  return vincitori.map(v => v.nome);
}

function controllaVittoria() {
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
  let vincitori = [];
  
  if (modalitaVittoria === 'max') {
    const maxPunti = Math.max(...puntiMappa);
    if (maxPunti >= punteggioObiettivo) {
      vincitori = giocatori.filter(g => g.punti === maxPunti);
    }
  } else {
    const minPunti = Math.min(...puntiMappa);
    if (minPunti <= punteggioObiettivo) {
      vincitori = giocatori.filter(g => g.punti === minPunti);
    }
  }
  
  if (vincitori.length > 0) {
    partitaTerminata = true;
    
    aggiornaListaGiocatori(); 
    winnerDiv.style.display = 'block';
    winnerDiv.classList.add('finished'); 
    winnerDiv.innerHTML = `
        <span class="fireworks">🎉</span>
        <div class="winner-text">
            <strong>PARTITA TERMINATA!</strong><br>
            Vince: ${vincitori.map(v => v.nome).join(', ')} (${vincitori[0].punti} punti)
        </div>
        <span class="fireworks">🎉</span>
    `;
    
    salvaStato(); 
    
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

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  salvaStato(); 
}

// Espone le funzioni solo sulla pagina index.html per la gestione UI
if (document.getElementById('giocatori-lista')) {
    window.aggiungiGiocatore = aggiungiGiocatore;
    window.rimuoviGiocatore = rimuoviGiocatore;
    window.modificaPunteggio = modificaPunteggio;
    window.chiediPunteggioPersonalizzato = chiediPunteggioPersonalizzato;
}
