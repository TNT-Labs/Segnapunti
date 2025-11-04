let modalitaVittoria = 'max';
let punteggioObiettivo = 100;
let giocatori = [];
let partitaTerminata = false; 

// Stato per il giocatore selezionato nel modale
let globalPlayerIndexToUpdate = -1; 

// Costanti IndexedDB
const DB_NAME = 'SegnapuntiDB';
const DB_VERSION = 2; 
const STORE_NAME = 'stato_partita';
const HISTORY_STORE_NAME = 'storico_partite'; 
const STATE_KEY = 'current_state';

let db; 

// -------------------------------------------------------------------
// Funzioni per l'API (Invariate)
// -------------------------------------------------------------------

window.setModalitaVittoria = (value) => {
    modalitaVittoria = value;
    salvaStato(); 
};

window.setPunteggioObiettivo = (value) => {
    punteggioObiettivo = value;
    salvaStato(); 
};

window.resetPartita = resetPartita; 
window.caricaStoricoPartite = caricaStoricoPartite; 

// -------------------------------------------------------------------
// LOGICA ASINCRONA INDEXEDDB (Invariata)
// -------------------------------------------------------------------
function openDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

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
            reject(new Error("Errore nell'apertura del database IndexedDB."));
        };
    });
}

async function caricaStato() {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(STATE_KEY);

            request.onsuccess = (event) => {
                const state = event.target.result;
                if (state) {
                    modalitaVittoria = state.modalitaVittoria;
                    punteggioObiettivo = state.punteggioObiettivo;
                    giocatori = state.giocatori;
                    partitaTerminata = state.partitaTerminata || false;
                    
                    if (state.darkMode) {
                        document.body.classList.add('dark-mode');
                    }
                }
                resolve();
            };
            request.onerror = () => resolve(); // Continua anche in caso di errore
        });
    } catch (error) {
        console.error("Errore nel caricamento dello stato:", error);
    }
}

function salvaStato() {
    try {
        const darkMode = document.body.classList.contains('dark-mode');
        const stato = {
            id: STATE_KEY,
            modalitaVittoria,
            punteggioObiettivo,
            giocatori,
            partitaTerminata,
            darkMode
        };

        openDB().then(db => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            store.put(stato);
        });
    } catch (error) {
        console.error("Errore nel salvataggio dello stato:", error);
    }
}

async function salvaStoricoPartita(vincitoriNomi, puntiVincitore) {
    try {
        const db = await openDB();
        const transaction = db.transaction([HISTORY_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(HISTORY_STORE_NAME);
        
        const partita = {
            timestamp: Date.now(),
            data: new Date().toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }),
            vincitori: vincitoriNomi,
            puntiVincitore: puntiVincitore,
            modalita: modalitaVittoria,
            giocatori: giocatori.map(g => ({ nome: g.nome, punti: g.punti }))
        };

        store.add(partita);
    } catch (error) {
        console.error("Errore nel salvataggio dello storico:", error);
    }
}

async function caricaStoricoPartite() {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const transaction = db.transaction([HISTORY_STORE_NAME], 'readonly');
            const store = transaction.objectStore(HISTORY_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = (event) => {
                // Ordina per timestamp decrescente (la più recente prima)
                const storico = event.target.result.sort((a, b) => b.timestamp - a.timestamp);
                resolve(storico);
            };
            request.onerror = () => resolve([]);
        });
    } catch (error) {
        console.error("Errore nel caricamento dello storico:", error);
        return [];
    }
}

async function requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        if (!isPersisted) {
            await navigator.storage.persist();
        }
    }
}

// -------------------------------------------------------------------
// LOGICA MODALE PUNTI PERSONALIZZATI 
// -------------------------------------------------------------------

/**
 * Mostra il modale per l'inserimento punti avanzato.
 */
function mostraModalPunteggio(index) {
  if (partitaTerminata) return; 
  globalPlayerIndexToUpdate = index;
  
  const modal = document.getElementById('modal-overlay');
  const nomeGiocatore = document.getElementById('modal-title-player-name');
  const input = document.getElementById('punteggio-input-custom');
  
  if (modal && nomeGiocatore && input) {
      nomeGiocatore.textContent = `Aggiungi Punti a ${giocatori[index].nome}`;
      input.value = '';
      modal.style.display = 'flex';
      input.focus();
  }
}

/**
 * Nasconde il modale.
 */
function nascondiModalPunteggio() {
    const modal = document.getElementById('modal-overlay');
    if (modal) modal.style.display = 'none';
    globalPlayerIndexToUpdate = -1;
}

/**
 * Applica il punteggio inserito dall'input o dai pulsanti rapidi.
 * @param {number | null} punti - Punti da aggiungere (dai pulsanti rapidi) o null (dall'input field).
 */
function applicaPunteggioPersonalizzato(punti = null) {
    if (globalPlayerIndexToUpdate === -1 || partitaTerminata) {
        nascondiModalPunteggio();
        return;
    }
    
    let deltaPunti = 0;

    if (punti !== null && typeof punti === 'number') {
        deltaPunti = punti;
    } else {
        const inputElement = document.getElementById('punteggio-input-custom');
        let val = parseInt(inputElement.value, 10);
        
        if (isNaN(val) || inputElement.value.trim() === '') {
            alert("Devi inserire un punteggio numerico valido.");
            inputElement.focus();
            return;
        }
        deltaPunti = val;
    }
    
    giocatori[globalPlayerIndexToUpdate].punti += deltaPunti;
    
    // Animazione e update del punteggio
    const puntiElement = document.getElementById(`punti-${globalPlayerIndexToUpdate}`);
    if (puntiElement) {
        const animClass = deltaPunti >= 0 ? 'anim-up' : 'anim-down';
        puntiElement.classList.add(animClass);
        puntiElement.addEventListener('animationend', () => {
            puntiElement.classList.remove(animClass);
        }, { once: true });
        puntiElement.querySelector('strong').textContent = giocatori[globalPlayerIndexToUpdate].punti; 
    }

    salvaStato(); 
    renderGiocatoriPartita(); 
    controllaVittoria();
    nascondiModalPunteggio();
}


// -------------------------------------------------------------------
// LOGICA DOMContentLoaded (AGGIORNATA con chiamata a updateDarkModeIcon)
// -------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async function() {
  
  // Mostra il loader immediatamente
  const loader = document.getElementById('loader-overlay');
  if (loader) loader.style.display = 'flex'; 

  await caricaStato(); 
  await requestPersistentStorage();

  // 🚩 CORREZIONE DARK MODE: Chiama l'update dopo il caricamento dello stato
  updateDarkModeIcon(); 

  // Nasconde il loader dopo il caricamento dello stato
  if (loader) loader.style.display = 'none'; 

  if (document.getElementById('giocatori-lista-partita')) {
      // LOGICA PER index.html (Pagina Partita)
      renderGiocatoriPartita(); 
      controllaVittoria(); 

      // Setup Modal Handlers
      const btnAnnulla = document.getElementById('btn-modal-annulla');
      if (btnAnnulla) btnAnnulla.addEventListener('click', nascondiModalPunteggio);

      const modalForm = document.getElementById('modal-input-form');
      if (modalForm) modalForm.addEventListener('submit', function(e) {
          e.preventDefault();
          applicaPunteggioPersonalizzato();
      });

      // Quick score buttons
      const quickPlus10 = document.getElementById('btn-quick-plus10');
      if (quickPlus10) quickPlus10.addEventListener('click', () => applicaPunteggioPersonalizzato(10));
      
      const quickMinus10 = document.getElementById('btn-quick-minus10');
      if (quickMinus10) quickMinus10.addEventListener('click', () => applicaPunteggioPersonalizzato(-10));
      
      const quickPlus20 = document.getElementById('btn-quick-plus20');
      if (quickPlus20) quickPlus20.addEventListener('click', () => applicaPunteggioPersonalizzato(20));
      
      const quickMinus20 = document.getElementById('btn-quick-minus20');
      if (quickMinus20) quickMinus20.addEventListener('click', () => applicaPunteggioPersonalizzato(-20));
      
      const quickPlus50 = document.getElementById('btn-quick-plus50');
      if (quickPlus50) quickPlus50.addEventListener('click', () => applicaPunteggioPersonalizzato(50));
      
      const quickMinus50 = document.getElementById('btn-quick-minus50');
      if (quickMinus50) quickMinus50.addEventListener('click', () => applicaPunteggioPersonalizzato(-50));
      
  } else if (document.getElementById('impostazioni-partita')) {
      // LOGICA PER settings.html
      
      const modalitaVittoriaSelect = document.getElementById('modalita-vittoria');
      if(modalitaVittoriaSelect) modalitaVittoriaSelect.value = modalitaVittoria;
      
      const punteggioObiettivoInput = document.getElementById('punteggio-obiettivo');
      if(punteggioObiettivoInput) punteggioObiettivoInput.value = punteggioObiettivo;
      
      // Event Listeners per le impostazioni
      if(modalitaVittoriaSelect) modalitaVittoriaSelect.addEventListener('change', function() {
          setModalitaVittoria(this.value);
      });
      if(punteggioObiettivoInput) punteggioObiettivoInput.addEventListener('input', function() {
          const val = parseInt(this.value, 10);
          setPunteggioObiettivo(val > 0 ? val : 1);
      });
      const btnNuovaPartita = document.getElementById('btn-nuova-partita');
      if(btnNuovaPartita) btnNuovaPartita.addEventListener('click', resetPartita);
      
      // Event Listeners per Aggiunta Giocatori
      const nuovoGiocatoreInput = document.getElementById('nuovo-giocatore');
      if(nuovoGiocatoreInput) nuovoGiocatoreInput.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
              e.preventDefault(); 
              aggiungiGiocatore();
          }
      });
      const btnAggiungiGiocatore = document.getElementById('btn-aggiungi-giocatore');
      if(btnAggiungiGiocatore) btnAggiungiGiocatore.addEventListener('click', aggiungiGiocatore);
      
      // Rendering della lista in Settings (solo per rimozione)
      renderGiocatoriSettings(); 

  } else if (document.getElementById('storico-lista')) { 
      // LOGICA PER storico.html 
      renderStoricoPartite();
  }
  
  // La modalità scura è su tutte le pagine
  const toggleDarkModeBtn = document.getElementById('toggle-dark-mode');
  if(toggleDarkModeBtn) {
    // 🚩 CORREZIONE DARK MODE: Usa la funzione toggleDarkMode (che ora aggiorna anche l'icona)
    toggleDarkModeBtn.addEventListener('click', toggleDarkMode); 
  }
});

// -------------------------------------------------------------------
// FUNZIONI CORE 
// -------------------------------------------------------------------

function resetPartita() {
  if (confirm("Sei sicuro di voler iniziare una nuova partita? Tutti i punteggi attuali verranno azzerati.")) {
    giocatori = giocatori.map(g => ({ nome: g.nome, punti: 0 }));
    partitaTerminata = false;
    salvaStato(); 
    
    // Forziamo il reindirizzamento se siamo in settings.html
    if (document.getElementById('impostazioni-partita')) {
        window.location.href = 'index.html';
    } else {
        renderGiocatoriPartita(); 
        controllaVittoria();
    }
  }
}

function aggiungiGiocatore() {
  const nomeInput = document.getElementById('nuovo-giocatore');
  const nome = nomeInput ? nomeInput.value.trim() : '';

  if (nome) {
    // 🚩 CORREZIONE TYPO: g.gome -> g.nome
    const nomeNormalizzato = nome.replace(/\s+/g, ' ').toLowerCase();

    if (giocatori.some(g => g.nome.replace(/\s+/g, ' ').toLowerCase() === nomeNormalizzato)) { 
        alert("Questo nome esiste già!");
        if (nomeInput) nomeInput.value = ''; 
        return;
    }

    // Aggiunge il giocatore all'array in memoria
    giocatori.push({ nome: nome, punti: 0 });
    
    if (nomeInput) nomeInput.value = ''; // Pulisce l'input DOPO l'aggiunta

    salvaStato(); 
    
    // Aggiorniamo la lista in settings (se siamo lì)
    if (document.getElementById('giocatori-lista-settings')) {
        renderGiocatoriSettings();
    }
  }
}

function rimuoviGiocatore(index) {
  giocatori.splice(index, 1);
  salvaStato(); 
  
  // Aggiorna entrambe le liste (se presenti)
  if (document.getElementById('giocatori-lista-settings')) {
    renderGiocatoriSettings();
  }
  if (document.getElementById('giocatori-lista-partita')) {
    renderGiocatoriPartita();
  }

  controllaVittoria();
}

function modificaPunteggio(index, delta) {
  if (partitaTerminata) return; 

  giocatori[index].punti += delta;
  
  // Animazione e update del punteggio sulla pagina index.html
  const puntiElement = document.getElementById(`punti-${index}`);
  if (puntiElement) {
    const animClass = delta > 0 ? 'anim-up' : 'anim-down';
    puntiElement.classList.add(animClass);
    puntiElement.addEventListener('animationend', () => {
      puntiElement.classList.remove(animClass);
    }, { once: true });
    
    puntiElement.querySelector('strong').textContent = giocatori[index].punti;
  }

  salvaStato(); 
  renderGiocatoriPartita(); 
  controllaVittoria();
}

function getVincitoriNomi() {
    if (giocatori.length === 0) return [];
    
    const puntiMappa = giocatori.map(g => g.punti);
    let vincitori = [];
    
    if (modalitaVittoria === 'max') {
        const maxPunti = Math.max(...puntiMappa);
        vincitori = giocatori.filter(g => g.punti === maxPunti);
    } else {
        const minPunti = Math.min(...puntiMappa);
        vincitori = giocatori.filter(g => g.punti === minPunti);
    }
    return vincitori.map(v => v.nome);
}


/**
 * Funzione per renderizzare la lista in index.html (Partita)
 */
function renderGiocatoriPartita() {
  const lista = document.getElementById('giocatori-lista-partita');
  if (!lista) return;
  
  lista.innerHTML = '';
  const vincitoriNomi = getVincitoriNomi();
  const isGameFinished = partitaTerminata;
  
  if (giocatori.length === 0) {
      lista.innerHTML = '<p class="empty-state">Nessun giocatore. Vai su ⚙️ Impostazioni per aggiungere i partecipanti!</p>';
  }

  giocatori.forEach((g, i) => {
    const li = document.createElement('li');
    li.className = `giocatore-item ${vincitoriNomi.includes(g.nome) ? 'winner-highlight' : ''} ${isGameFinished ? 'game-over' : ''}`;
    
    // I pulsanti +/- 5 sono stati aggiunti qui per desktop (nascosti in mobile via CSS)
    li.innerHTML = `
      <span class="giocatore-nome">${g.nome}</span>
      <div class="punti-e-controlli">
        <span class="giocatore-punti" id="punti-${i}"><strong>${g.punti}</strong> Punti</span>
        <div class="punteggio-controls">
          <button title="Aggiungi 1 punto" onclick="modificaPunteggio(${i}, 1)" ${isGameFinished ? 'disabled' : ''}>+1</button>
          <button title="Rimuovi 1 punto" onclick="modificaPunteggio(${i}, -1)" ${isGameFinished ? 'disabled' : ''}>-1</button>
          <button title="Aggiungi 5 punti" onclick="modificaPunteggio(${i}, 5)" ${isGameFinished ? 'disabled' : ''}>+5</button>
          <button title="Rimuovi 5 punti" onclick="modificaPunteggio(${i}, -5)" ${isGameFinished ? 'disabled' : ''}>-5</button>
          <button title="Aggiungi Punti Personalizzati" onclick="mostraModalPunteggio(${i})" class="btn-custom-score" ${isGameFinished ? 'disabled' : ''}>± Punti</button>
        </div>
      </div>
    `;
    lista.appendChild(li);
  });
}

/**
 * Funzione per renderizzare la lista in settings.html (Gestione)
 */
function renderGiocatoriSettings() {
    const lista = document.getElementById('giocatori-lista-settings');
    if (!lista) return;

    lista.innerHTML = '';

    if (giocatori.length === 0) {
        lista.innerHTML = '<p class="empty-state">Nessun giocatore in lista.</p>';
        return;
    }
    
    giocatori.forEach((g, i) => {
        const li = document.createElement('li');
        li.className = `giocatore-item`;
        
        li.innerHTML = `
            <span class="giocatore-nome">${g.nome}</span>
            <div class="punti-e-controlli">
                <span class="giocatore-punti">${g.punti} Punti</span>
                <div class="punteggio-controls">
                    <button title="Rimuovi giocatore" onclick="rimuoviGiocatore(${i})" class="btn-rimuovi">🗑️ Rimuovi</button>
                </div>
            </div>
        `;
        lista.appendChild(li);
    });
}

async function controllaVittoria() {
  const winnerDiv = document.getElementById('winner-message');
  if (!winnerDiv) return;
  
  if (giocatori.length === 0) {
    if (winnerDiv) winnerDiv.style.display = 'none';
    return;
  }
  
  const puntiMappa = giocatori.map(g => g.punti);
  let isGameOver = false;
  
  // Condizione di vittoria: un giocatore supera l'obiettivo O la modalità è 'min' e uno scende sotto.
  if (modalitaVittoria === 'max') {
    const maxPunti = Math.max(...puntiMappa);
    if (maxPunti >= punteggioObiettivo) {
        isGameOver = true;
    }
  } else if (modalitaVittoria === 'min') {
    const minPunti = Math.min(...puntiMappa);
    if (minPunti <= punteggioObiettivo) { 
        isGameOver = true;
    }
  }
  
  if (isGameOver) {
    if (!partitaTerminata) { 
        const vincitoriNomi = getVincitoriNomi(); 
        const puntiVincitore = (modalitaVittoria === 'max') ? Math.max(...puntiMappa) : Math.min(...puntiMappa);
        await salvaStoricoPartita(vincitoriNomi, puntiVincitore);
        partitaTerminata = true;
        salvaStato(); 
    }
    
    renderGiocatoriPartita(); 
    winnerDiv.style.display = 'flex'; 
    winnerDiv.classList.add('finished'); 
    
    const puntiVincitore = (modalitaVittoria === 'max') ? Math.max(...puntiMappa) : Math.min(...puntiMappa);
    const vincitoriNomi = getVincitoriNomi(); 
                            
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
    renderGiocatoriPartita(); 
  }
}

async function renderStoricoPartite() {
    const lista = document.getElementById('storico-lista');
    if (!lista) return;

    lista.innerHTML = '<p style="text-align: center;">Caricamento storico...</p>';

    const storico = await caricaStoricoPartite();
    lista.innerHTML = '';

    if (storico.length === 0) {
        lista.innerHTML = '<p class="empty-state">Nessuna partita nello storico.</p>';
        return;
    }

    storico.forEach((partita) => {
        const li = document.createElement('li');
        li.className = 'storico-item';

        const giocatoriList = partita.giocatori.map(g => `<li>${g.nome}: ${g.punti}</li>`).join('');

        li.innerHTML = `
            <div class="storico-header">
                <span class="storico-vincitore">🏅 ${partita.vincitori.join(', ')} (${partita.puntiVincitore})</span>
                <span class="storico-data">${partita.data}</span>
            </div>
            <div class="storico-details">
                <p>Modalità: **${partita.modalita === 'max' ? 'Più punti' : 'Meno punti'}**</p>
                <p>Partecipanti:</p>
                <ul class="giocatori-list">${giocatoriList}</ul>
            </div>
        `;
        lista.appendChild(li);
    });
}

// 🚩 NUOVA FUNZIONE HELPER DARK MODE
function updateDarkModeIcon() {
  const iconBtn = document.getElementById('toggle-dark-mode');
  if (iconBtn) {
    iconBtn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
  }
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  updateDarkModeIcon(); // Aggiorna l'icona
  salvaStato(); 
}


// Espone le funzioni al Global Scope per l'uso negli onclick
window.aggiungiGiocatore = aggiungiGiocatore;
window.rimuoviGiocatore = rimuoviGiocatore;
window.modificaPunteggio = modificaPunteggio;
window.mostraModalPunteggio = mostraModalPunteggio;
window.getVincitoriNomi = getVincitoriNomi;
window.toggleDarkMode = toggleDarkMode; // Espone la funzione
