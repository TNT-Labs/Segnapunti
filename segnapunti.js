let modalitaVittoria = 'max';
let punteggioObiettivo = 100;
let giocatori = [];
const STORAGE_KEY = 'segnapunti_stato';
// Variabile per gestire il futuro passaggio a IndexedDB (mantiene l'MVP funzionante su LocalStorage per ora)
const ASYNC_STORAGE_AVAILABLE = false; 

document.addEventListener('DOMContentLoaded', async function() {
  if (ASYNC_STORAGE_AVAILABLE) {
    // PASSAGGIO MMP: Sostituire con l'implementazione IndexedDB
    await caricaStatoAsync(); 
  } else {
    caricaStato(); // Carica lo stato salvato (o i default) da LocalStorage
  }
  
  // CRITICAL: Richiedi lo stato persistente all'avvio per mitigare la perdita di dati (Sezione I.2)
  await requestPersistentStorage();

  // Inizializza i valori UI con i dati caricati
  document.getElementById('modalita-vittoria').value = modalitaVittoria;
  document.getElementById('punteggio-obiettivo').value = punteggioObiettivo;

  // Event Listeners per le impostazioni
  document.getElementById('modalita-vittoria').addEventListener('change', function() {
    modalitaVittoria = this.value;
    (ASYNC_STORAGE_AVAILABLE ? salvaStatoAsync() : salvaStato());
    controllaVittoria();
  });
  
  document.getElementById('punteggio-obiettivo').addEventListener('input', function() {
    const val = parseInt(this.value, 10);
    punteggioObiettivo = val > 0 ? val : 1;
    (ASYNC_STORAGE_AVAILABLE ? salvaStatoAsync() : salvaStato());
    controllaVittoria();
  });
  
  // Event Listeners per i giocatori
  const nuovoGiocatoreInput = document.getElementById('nuovo-giocatore');
  
  nuovoGiocatoreInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault(); // Evita comportamenti indesiderati con 'Enter'
      aggiungiGiocatore();
    }
  });
  
  document.getElementById('btn-aggiungi-giocatore').addEventListener('click', aggiungiGiocatore);
  document.getElementById('btn-nuova-partita').addEventListener('click', resetPartita);
  
  aggiornaListaGiocatori();
  controllaVittoria(); // Chiamata critica all'avvio per verificare il vincitore
  
  // Listener per la Modalità Scura
  document.getElementById('toggle-dark-mode').addEventListener('click', toggleDarkMode);
});

/**
 * Richiede lo storage persistente al browser. Cruciale per la stabilità MMP.
 * @returns {Promise<boolean>} Vero se la persistenza è garantita.
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
            // NOTA: Implementare qui una notifica all'utente se la persistenza è negata.
            return false;
        }
    }
    return false;
}


// Funzione di salvataggio dello stato (LocalStorage - Legacy/Sync)
function salvaStato() {
  const stato = {
    giocatori: giocatori,
    modalitaVittoria: modalitaVittoria,
    punteggioObiettivo: punteggioObiettivo,
    darkMode: document.body.classList.contains('dark-mode')
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stato));
}

// Funzione di salvataggio dello stato (IndexedDB - Asincrona PLACEHOLDER)
async function salvaStatoAsync() {
    // Logica IndexedDB qui per salvare lo stato in modo robusto
    console.log("Saving state asynchronously (IndexedDB placeholder)...");
    salvaStato(); // Fallback a LocalStorage finché l'implementazione IndexedDB non è completa
}

// Funzione di caricamento dello stato (LocalStorage - Legacy/Sync)
function caricaStato() {
  const statoSalvato = localStorage.getItem(STORAGE_KEY);
  if (statoSalvato) {
    const stato = JSON.parse(statoSalvato);
    giocatori = stato.giocatori || [];
    modalitaVittoria = stato.modalitaVittoria || 'max';
    punteggioObiettivo = stato.punteggioObiettivo || 100;
    
    if (stato.darkMode) {
      document.body.classList.add('dark-mode');
    }
  }
}

// Funzione di caricamento dello stato (IndexedDB - Asincrona PLACEHOLDER)
async function caricaStatoAsync() {
    // Logica IndexedDB qui per caricare lo stato
    console.log("Loading state asynchronously (IndexedDB placeholder)...");
    caricaStato(); // Fallback a LocalStorage finché l'implementazione IndexedDB non è completa
}


// Funzione di reset della partita
function resetPartita() {
  if (confirm("Sei sicuro di voler iniziare una nuova partita? Tutti i punteggi attuali verranno azzerati.")) {
    giocatori = giocatori.map(g => ({ nome: g.nome, punti: 0 }));
    (ASYNC_STORAGE_AVAILABLE ? salvaStatoAsync() : salvaStato());
    aggiornaListaGiocatori();
    controllaVittoria();
  }
}

function aggiornaListaGiocatori() {
  const lista = document.getElementById('giocatori-lista');
  lista.innerHTML = '';
  const vincitoriNomi = getVincitoriNomi();
  
  if (giocatori.length === 0) {
      lista.innerHTML = '<p class="empty-state">Nessun giocatore. Aggiungi i partecipanti qui sopra per iniziare!</p>';
  }

  giocatori.forEach((g, i) => {
    const li = document.createElement('li');
    // Aggiunto highlight del vincitore
    li.className = `giocatore-item ${vincitoriNomi.includes(g.nome) ? 'winner-highlight' : ''}`;
    
    // NOTA: I pulsanti richiedono uno stile in segnapunti.css per raggiungere il target minimo di 48x48px (DIP)
    li.innerHTML = `
      <span class="giocatore-nome">${g.nome}</span>
      <div class="punti-e-controlli">
        <span class="giocatore-punti" id="punti-${i}"><strong>${g.punti}</strong> Punti</span>
        <div class="punteggio-controls">
          <button title="Aggiungi 1 punto" onclick="modificaPunteggio(${i}, 1)">+1</button>
          <button title="Rimuovi 1 punto" onclick="modificaPunteggio(${i}, -1)">-1</button>
          <button title="Aggiungi 5 punti" onclick="modificaPunteggio(${i}, 5)">+5</button>
          <button title="Rimuovi 5 punti" onclick="modificaPunteggio(${i}, -5)">-5</button>
          <button title="Aggiungi Punti Personalizzati" onclick="chiediPunteggioPersonalizzato(${i})" class="btn-custom-score">±</button>
          <button title="Rimuovi giocatore" onclick="rimuoviGiocatore(${i})" class="btn-rimuovi">🗑️</button>
        </div>
      </div>
    `;
    lista.appendChild(li);
  });
}

function aggiungiGiocatore() {
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
  giocatori.splice(index, 1);
  (ASYNC_STORAGE_AVAILABLE ? salvaStatoAsync() : salvaStato());
  aggiornaListaGiocatori();
  controllaVittoria();
}

function modificaPunteggio(index, delta) {
  giocatori[index].punti += delta;
  
  // Feedback visivo immediato (animazione) - CRITICO per UX (Sezione II.2)
  const puntiElement = document.getElementById(`punti-${index}`);
  if (puntiElement) {
    puntiElement.classList.add(delta > 0 ? 'anim-up' : 'anim-down');
    // Rimuove la classe dopo l'animazione per permettere replay
    puntiElement.addEventListener('animationend', () => {
      puntiElement.classList.remove('anim-up', 'anim-down');
    }, { once: true });
    
    // Aggiorna immediatamente il testo per la reattività percepita
    puntiElement.querySelector('strong').textContent = giocatori[index].punti;
  }

  (ASYNC_STORAGE_AVAILABLE ? salvaStatoAsync() : salvaStato());
  aggiornaListaGiocatori();
  controllaVittoria();
}

function chiediPunteggioPersonalizzato(index) {
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
    if (maxPunti >= punteggioObiettivo) {
      vincitori = giocatori.filter(g => g.punti === maxPunti);
    }
  } else {
    const minPunti = Math.min(...puntiMappa);
    if (minPunti <= punteggioObiettivo) {
      vincitori = giocatori.filter(g => g.punti === minPunti);
    }
  }
  return vincitori.map(v => v.nome);
}

function controllaVittoria() {
  const winnerDiv = document.getElementById('winner-message');
  
  if (giocatori.length === 0) {
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
    aggiornaListaGiocatori(); 
    winnerDiv.style.display = 'block';
    winnerDiv.textContent = `🎉 Partita terminata! Vince: ${vincitori.map(v => v.nome).join(', ')} (${vincitori[0].punti} punti)`;
  } else {
    winnerDiv.style.display = 'none';
    aggiornaListaGiocatori();
  }
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  (ASYNC_STORAGE_AVAILABLE ? salvaStatoAsync() : salvaStato());
}

window.aggiungiGiocatore = aggiungiGiocatore;
window.rimuoviGiocatore = rimuoviGiocatore;
window.modificaPunteggio = modificaPunteggio;
window.chiediPunteggioPersonalizzato = chiediPunteggioPersonalizzato;
