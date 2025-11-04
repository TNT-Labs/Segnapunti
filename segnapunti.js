let modalitaVittoria = 'max';
let punteggioObiettivo = 100;
let giocatori = [];
let partitaTerminata = false; 

// 🚩 Costanti IndexedDB
const DB_NAME = 'SegnapuntiDB';
const DB_VERSION = 2; 
const STORE_NAME = 'stato_partita';
const HISTORY_STORE_NAME = 'storico_partite'; 
const STATE_KEY = 'current_state';

let db; 

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

window.resetPartita = resetPartita; 
window.caricaStoricoPartite = caricaStoricoPartite; 

// -------------------------------------------------------------------
// 🚩 LOGICA ASINCRONA INDEXEDDB (Invariata)
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

async function caricaStato() { /* ... (Logica Invariata) ... */ }
function salvaStato() { /* ... (Logica Invariata) ... */ }
async function salvaStoricoPartita(vincitoriNomi, puntiVincitore) { /* ... (Logica Invariata) ... */ }
async function caricaStoricoPartite() { /* ... (Logica Invariata) ... */ }


// -------------------------------------------------------------------
// 🚩 LOGICA DOMContentLoaded (AGGIORNATA)
// -------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async function() {
  await caricaStato(); 
  await requestPersistentStorage();

  if (document.getElementById('giocatori-lista-partita')) {
      // LOGICA PER index.html (Pagina Partita)
      aggiornaListaGiocatoriPartita(); // Nuova funzione di rendering
      controllaVittoria(); 
      
  } else if (document.getElementById('impostazioni-partita')) {
      // LOGICA PER settings.html (Pagina Impostazioni)
      
      document.getElementById('modalita-vittoria').value = modalitaVittoria;
      document.getElementById('punteggio-obiettivo').value = punteggioObiettivo;
      
      // Event Listeners per le impostazioni
      document.getElementById('modalita-vittoria').addEventListener('change', function() {
          setModalitaVittoria(this.value);
      });
      document.getElementById('punteggio-obiettivo').addEventListener('input', function() {
          const val = parseInt(this.value, 10);
          setPunteggioObiettivo(val > 0 ? val : 1);
      });
      document.getElementById('btn-nuova-partita').addEventListener('click', resetPartita);
      
      // 🚩 NUOVO: Event Listeners per Aggiunta Giocatori
      const nuovoGiocatoreInput = document.getElementById('nuovo-giocatore');
      nuovoGiocatoreInput.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
              e.preventDefault(); 
              aggiungiGiocatore();
          }
      });
      document.getElementById('btn-aggiungi-giocatore').addEventListener('click', aggiungiGiocatore);
      
      // Rendering della lista in Settings (solo per rimozione)
      aggiornaListaGiocatoriSettings(); 

  } else if (document.getElementById('storico-lista')) { 
      // LOGICA PER storico.html 
      renderStoricoPartite();
  }
  
  // La modalità scura è su tutte le pagine
  const toggleDarkModeBtn = document.getElementById('toggle-dark-mode');
  if(toggleDarkModeBtn) {
    toggleDarkModeBtn.addEventListener('click', toggleDarkMode);
  }
});

// -------------------------------------------------------------------
// 🚩 FUNZIONI CORE 
// -------------------------------------------------------------------

// ... (requestPersistentStorage, resetPartita, aggiungiGiocatore, rimuoviGiocatore restano invariate) ...
async function requestPersistentStorage() { /* ... (Logica Invariata) ... */ }

// Funzione di reset della partita (Invariata)
function resetPartita() {
  if (confirm("Sei sicuro di voler iniziare una nuova partita? Tutti i punteggi attuali verranno azzerati.")) {
    giocatori = giocatori.map(g => ({ nome: g.nome, punti: 0 }));
    partitaTerminata = false;
    salvaStato(); 
    
    // Forziamo il reindirizzamento se siamo in settings.html
    if (document.getElementById('impostazioni-partita')) {
        window.location.href = 'index.html';
    } else {
        aggiornaListaGiocatoriPartita(); // Aggiorna solo la partita
        controllaVittoria();
    }
  }
}

// 🚩 AGGIUNTO: Funzione per l'aggiunta di giocatori (Chiamata da settings.html)
function aggiungiGiocatore() {
  if (partitaTerminata) return; 

  const nomeInput = document.getElementById('nuovo-giocatore');
  const nome = nomeInput.value.trim();
  if (nome) {
    giocatori.push({ nome: nome, punti: 0 });
    nomeInput.value = '';
    salvaStato(); 
    
    // Se siamo su settings.html, aggiorniamo la lista in settings
    if (document.getElementById('giocatori-lista-settings')) {
        aggiornaListaGiocatoriSettings();
    }
    // Se la partita è aperta in un altro tab, non possiamo aggiornarla direttamente.
    // L'utente dovrà ricaricarla. Ci limitiamo ad aggiornare la pagina corrente.
  }
}

// 🚩 AGGIORNATO: Funzione per la rimozione di giocatori (Chiamata da settings.html)
function rimuoviGiocatore(index) {
  giocatori.splice(index, 1);
  salvaStato(); 
  
  // Aggiorna entrambe le liste (se presenti)
  if (document.getElementById('giocatori-lista-settings')) {
    aggiornaListaGiocatoriSettings();
  }
  if (document.getElementById('giocatori-lista-partita')) {
    aggiornaListaGiocatoriPartita();
  }

  // Controlla la vittoria perché un vincitore potrebbe essere rimosso
  controllaVittoria();
}

// ... (modificaPunteggio e chiediPunteggioPersonalizzato restano invariate, ma aggiornano solo lista partita) ...

function modificaPunteggio(index, delta) {
  if (partitaTerminata) return; 

  giocatori[index].punti += delta;
  
  // Animazione e update del punteggio sulla pagina index.html
  const puntiElement = document.getElementById(`punti-${index}`);
  if (puntiElement) {
    puntiElement.classList.add(delta > 0 ? 'anim-up' : 'anim-down');
    puntiElement.addEventListener('animationend', () => {
      puntiElement.classList.remove('anim-up', 'anim-down');
    }, { once: true });
    
    puntiElement.querySelector('strong').textContent = giocatori[index].punti;
  }

  salvaStato(); 
  aggiornaListaGiocatoriPartita(); // Aggiorna la lista di gioco (e i vincitori)
  controllaVittoria();
}

function chiediPunteggioPersonalizzato(index) { /* ... (Logica Invariata) ... */ }

function getVincitoriNomi() { /* ... (Logica Invariata) ... */ }

// 🚩 NUOVO: Funzione per renderizzare la lista in index.html (Partita)
function aggiornaListaGiocatoriPartita() {
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
    // ... (Logica di rendering con pulsanti +1, -1, +5, -5, ±) ...
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
        </div>
      </div>
    `;
    lista.appendChild(li);
  });
}

// 🚩 NUOVO: Funzione per renderizzare la lista in settings.html (Gestione)
function aggiornaListaGiocatoriSettings() {
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
  
  if (giocatori.length === 0) { /* ... (Logica Invariata) ... */ }
  
  const puntiMappa = giocatori.map(g => g.punti);
  const maxPunti = Math.max(...puntiMappa);
  
  let isGameOver = false;
  
  if (maxPunti >= punteggioObiettivo) {
    isGameOver = true;
  }
  
  if (isGameOver) {
    if (!partitaTerminata) { 
        const vincitoriNomi = getVincitoriNomi(); 
        const puntiVincitore = (modalitaVittoria === 'max') ? Math.max(...puntiMappa) : Math.min(...puntiMappa);
        await salvaStoricoPartita(vincitoriNomi, puntiVincitore);
        partitaTerminata = true;
        salvaStato(); 
    }
    
    aggiornaListaGiocatoriPartita(); 
    winnerDiv.style.display = 'block';
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
    aggiornaListaGiocatoriPartita(); 
  }
}

function renderStoricoPartite() { /* ... (Logica Invariata) ... */ }

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  salvaStato(); 
}

// Espone le funzioni al Global Scope per l'uso negli onclick
window.aggiungiGiocatore = aggiungiGiocatore;
window.rimuoviGiocatore = rimuoviGiocatore;
window.modificaPunteggio = modificaPunteggio;
window.chiediPunteggioPersonalizzato = chiediPunteggioPersonalizzato;
window.getVincitoriNomi = getVincitoriNomi;
