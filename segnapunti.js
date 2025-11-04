let modalitaVittoria = 'max';
let punteggioObiettivo = 100;
let giocatori = [];
const STORAGE_KEY = 'segnapunti_stato';
const ASYNC_STORAGE_AVAILABLE = false; 
let partitaTerminata = false; 

// Funzioni pubbliche esposte a settings.html
window.setModalitaVittoria = (value) => {
    modalitaVittoria = value;
    (ASYNC_STORAGE_AVAILABLE ? salvaStatoAsync() : salvaStato());
    // Non possiamo chiamare controllaVittoria da settings, deve avvenire sulla pagina di gioco
};

window.setPunteggioObiettivo = (value) => {
    punteggioObiettivo = value;
    (ASYNC_STORAGE_AVAILABLE ? salvaStatoAsync() : salvaStato());
    // Non possiamo chiamare controllaVittoria da settings, deve avvenire sulla pagina di gioco
};

window.resetPartita = resetPartita; // Espone la funzione reset


document.addEventListener('DOMContentLoaded', async function() {
  if (ASYNC_STORAGE_AVAILABLE) {
    await caricaStatoAsync(); 
  } else {
    caricaStato(); 
  }
  
  await requestPersistentStorage();

  // 🚩 NUOVO: Gestione specifica in base alla pagina
  if (document.getElementById('giocatori-lista')) {
      // LOGICA PER index.html (Pagina Partita)
      
      // Event Listeners per i giocatori
      const nuovoGiocatoreInput = document.getElementById('nuovo-giocatore');
      
      nuovoGiocatoreInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault(); 
          aggiungiGiocatore();
        }
      });
      
      document.getElementById('btn-aggiungi-giocatore').addEventListener('click', aggiungiGiocatore);
      
      // Inizializzazione UI Partita
      aggiornaListaGiocatori();
      controllaVittoria(); 
      
  } else if (document.getElementById('impostazioni-partita')) {
      // LOGICA PER settings.html (Pagina Impostazioni)
      
      // Inizializza i valori UI con i dati caricati
      document.getElementById('modalita-vittoria').value = modalitaVittoria;
      document.getElementById('punteggio-obiettivo').value = punteggioObiettivo;
  }
  
  // Listener per la Modalità Scura (presente su entrambe le pagine)
  document.getElementById('toggle-dark-mode').addEventListener('click', toggleDarkMode);
});

// [requestPersistentStorage, salvaStato, salvaStatoAsync, caricaStato, caricaStatoAsync] NON SONO MODIFICATI
// ... (mantenere le implementazioni precedenti di queste funzioni) ...

/**
 * Richiede lo storage persistente al browser. Cruciale per la stabilità MMP.
 */
async function requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        if (isPersisted) {
            console.log("Storage già persistente.");
            return true;
        }
        
        const granted = await navigator.storage.persist();
        if (granted) {
            console.log("Persistenza storage garantita.");
            return true;
        } else {
            console.warn("Storage persistente negato. I dati potrebbero essere cancellati (rischio su iOS).");
            return false;
        }
    }
    return false;
}

function salvaStato() {
  const stato = {
    giocatori: giocatori,
    modalitaVittoria: modalitaVittoria,
    punteggioObiettivo: punteggioObiettivo,
    darkMode: document.body.classList.contains('dark-mode'),
    partitaTerminata: partitaTerminata 
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stato));
}

async function salvaStatoAsync() {
    console.log("Saving state asynchronously (IndexedDB placeholder)...");
    salvaStato(); 
}

function caricaStato() {
  const statoSalvato = localStorage.getItem(STORAGE_KEY);
  if (statoSalvato) {
    const stato = JSON.parse(statoSalvato);
    giocatori = stato.giocatori || [];
    modalitaVittoria = stato.modalitaVittoria || 'max';
    punteggioObiettivo = stato.punteggioObiettivo || 100;
    partitaTerminata = stato.partitaTerminata || false; 
    
    if (stato.darkMode) {
      document.body.classList.add('dark-mode');
    }
  }
}

async function caricaStatoAsync() {
    console.log("Loading state asynchronously (IndexedDB placeholder)...");
    caricaStato(); 
}
// --------------------------------------------------------------------------

// Funzione di reset della partita (Ora esposta anche a settings.html)
function resetPartita() {
  if (confirm("Sei sicuro di voler iniziare una nuova partita? Tutti i punteggi attuali verranno azzerati.")) {
    giocatori = giocatori.map(g => ({ nome: g.nome, punti: 0 }));
    partitaTerminata = false;
    (ASYNC_STORAGE_AVAILABLE ? salvaStatoAsync() : salvaStato());
    // Se siamo su settings.html, reindirizza l'utente alla pagina di gioco
    if (document.getElementById('impostazioni-partita')) {
        window.location.href = 'index.html';
    } else {
        // Se siamo su index.html, aggiorna la lista
        aggiornaListaGiocatori();
        controllaVittoria();
    }
  }
}

function aggiornaListaGiocatori() {
  const lista = document.getElementById('giocatori-lista');
  if (!lista) return; // Non eseguire se non siamo nella pagina della lista
  
  lista.innerHTML = '';
  const vincitoriNomi = getVincitoriNomi();
  
  if (giocatori.length === 0) {
      lista.innerHTML = '<p class="empty-state">Nessun giocatore. Aggiungi i partecipanti qui sopra per iniziare!</p>';
  }
  
  const isGameFinished = partitaTerminata;

  giocatori.forEach((g, i) => {
    const li = document.createElement('li');
    li.className = `giocatore-item ${vincitoriNomi.includes(g.nome) ? 'winner-highlight' : ''} ${isGameFinished ? 'game-over' : ''}`;
    
    // ... (Il resto del codice di aggiornamento della lista rimane invariato) ...
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
  
  // Blocca/Sblocca il form di aggiunta giocatore
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
    (ASYNC_STORAGE_AVAILABLE ? salvaStatoAsync() : salvaStato());
    aggiornaListaGiocatori();
  }
}

function rimuoviGiocatore(index) {
  if (partitaTerminata) return; 
  
  giocatori.splice(index, 1);
  (ASYNC_STORAGE_AVAILABLE ? salvaStatoAsync() : salvaStato());
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

  (ASYNC_STORAGE_AVAILABLE ? salvaStatoAsync() : salvaStato());
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
  if (!winnerDiv) return; // Non eseguire se non siamo nella pagina di gioco
  
  if (giocatori.length === 0) {
    partitaTerminata = false;
    winnerDiv.style.display = 'none';
    aggiornaListaGiocatori();
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
    
    (ASYNC_STORAGE_AVAILABLE ? salvaStatoAsync() : salvaStato());
    
  } else {
    if (partitaTerminata) {
        partitaTerminata = false; 
        (ASYNC_STORAGE_AVAILABLE ? salvaStatoAsync() : salvaStato());
    }
    winnerDiv.style.display = 'none';
    winnerDiv.classList.remove('finished');
    aggiornaListaGiocatori(); 
  }
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  (ASYNC_STORAGE_AVAILABLE ? salvaStatoAsync() : salvaStato());
}

// Esponi le funzioni solo sulla pagina index.html per la gestione UI
if (document.getElementById('giocatori-lista')) {
    window.aggiungiGiocatore = aggiungiGiocatore;
    window.rimuoviGiocatore = rimuoviGiocatore;
    window.modificaPunteggio = modificaPunteggio;
    window.chiediPunteggioPersonalizzato = chiediPunteggioPersonalizzato;
}
