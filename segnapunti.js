let modalitaVittoria = 'max';
let punteggioObiettivo = 100;
let giocatori = [];
const STORAGE_KEY = 'segnapunti_stato';
const ASYNC_STORAGE_AVAILABLE = false; 

// 🚩 NUOVO: Traccia lo stato della partita per bloccare le modifiche una volta raggiunto l'obiettivo
let partitaTerminata = false; 

document.addEventListener('DOMContentLoaded', async function() {
  if (ASYNC_STORAGE_AVAILABLE) {
    await caricaStatoAsync(); 
  } else {
    caricaStato(); 
  }
  
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
      e.preventDefault(); 
      aggiungiGiocatore();
    }
  });
  
  document.getElementById('btn-aggiungi-giocatore').addEventListener('click', aggiungiGiocatore);
  document.getElementById('btn-nuova-partita').addEventListener('click', resetPartita);
  
  aggiornaListaGiocatori();
  controllaVittoria(); 
  
  // Listener per la Modalità Scura
  document.getElementById('toggle-dark-mode').addEventListener('click', toggleDarkMode);
});

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


// Funzione di salvataggio dello stato (LocalStorage - Legacy/Sync)
function salvaStato() {
  const stato = {
    giocatori: giocatori,
    modalitaVittoria: modalitaVittoria,
    punteggioObiettivo: punteggioObiettivo,
    darkMode: document.body.classList.contains('dark-mode'),
    // 🚩 NUOVO: Salva anche lo stato di partitaTerminata
    partitaTerminata: partitaTerminata 
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stato));
}

// Funzione di salvataggio dello stato (IndexedDB - Asincrona PLACEHOLDER)
async function salvaStatoAsync() {
    console.log("Saving state asynchronously (IndexedDB placeholder)...");
    salvaStato(); 
}

// Funzione di caricamento dello stato (LocalStorage - Legacy/Sync)
function caricaStato() {
  const statoSalvato = localStorage.getItem(STORAGE_KEY);
  if (statoSalvato) {
    const stato = JSON.parse(statoSalvato);
    giocatori = stato.giocatori || [];
    modalitaVittoria = stato.modalitaVittoria || 'max';
    punteggioObiettivo = stato.punteggioObiettivo || 100;
    // 🚩 NUOVO: Carica anche lo stato di partitaTerminata
    partitaTerminata = stato.partitaTerminata || false; 
    
    if (stato.darkMode) {
      document.body.classList.add('dark-mode');
    }
  }
}

// Funzione di caricamento dello stato (IndexedDB - Asincrona PLACEHOLDER)
async function caricaStatoAsync() {
    console.log("Loading state asynchronously (IndexedDB placeholder)...");
    caricaStato(); 
}


// Funzione di reset della partita
function resetPartita() {
  if (confirm("Sei sicuro di voler iniziare una nuova partita? Tutti i punteggi attuali verranno azzerati.")) {
    giocatori = giocatori.map(g => ({ nome: g.nome, punti: 0 }));
    // 🚩 NUOVO: Reset dello stato
    partitaTerminata = false;
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
  
  // 🚩 NUOVO: Gestione dello stato bloccato
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
  
  // Blocca/Sblocca il form di aggiunta giocatore
  const btnAggiungi = document.getElementById('btn-aggiungi-giocatore');
  const inputAggiungi = document.getElementById('nuovo-giocatore');
  if (isGameFinished) {
      btnAggiungi.disabled = true;
      inputAggiungi.disabled = true;
  } else {
      btnAggiungi.disabled = false;
      inputAggiungi.disabled = false;
  }
}

function aggiungiGiocatore() {
  // 🚩 NUOVO: Blocca se la partita è terminata
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
  // 🚩 NUOVO: Blocca se la partita è terminata
  if (partitaTerminata) return; 
  
  giocatori.splice(index, 1);
  (ASYNC_STORAGE_AVAILABLE ? salvaStatoAsync() : salvaStato());
  aggiornaListaGiocatori();
  controllaVittoria();
}

function modificaPunteggio(index, delta) {
  // 🚩 NUOVO: Blocca se la partita è terminata
  if (partitaTerminata) return; 

  giocatori[index].punti += delta;
  
  // Feedback visivo immediato (animazione) 
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
  // 🚩 NUOVO: Blocca se la partita è terminata
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

  // La logica di base per identificare chi è "in testa"
  if (modalitaVittoria === 'max') {
    const maxPunti = Math.max(...puntiMappa);
    // 🚩 NUOVO: L'highlight avviene solo se il punteggio MAX ha raggiunto l'obiettivo (o se la partita è già terminata)
    if (maxPunti >= punteggioObiettivo || partitaTerminata) {
      vincitori = giocatori.filter(g => g.punti === maxPunti);
    }
  } else {
    const minPunti = Math.min(...puntiMappa);
    // 🚩 NUOVO: L'highlight avviene solo se il punteggio MIN ha raggiunto l'obiettivo (o se la partita è già terminata)
    if (minPunti <= punteggioObiettivo || partitaTerminata) {
      vincitori = giocatori.filter(g => g.punti === minPunti);
    }
  }
  return vincitori.map(v => v.nome);
}

function controllaVittoria() {
  const winnerDiv = document.getElementById('winner-message');
  
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
    // 🚩 NUOVO: Aggiorna lo stato di blocco
    partitaTerminata = true;
    
    // Aggiorna l'UI
    aggiornaListaGiocatori(); 
    winnerDiv.style.display = 'block';
    winnerDiv.classList.add('finished'); // Aggiunge una classe per lo stile del messaggio
    winnerDiv.innerHTML = `
        <span class="fireworks">🎉</span>
        <div class="winner-text">
            <strong>PARTITA TERMINATA!</strong><br>
            Vince: ${vincitori.map(v => v.nome).join(', ')} (${vincitori[0].punti} punti)
        </div>
        <span class="fireworks">🎉</span>
    `;
    
    // Assicurati che lo stato sia salvato (partitaTerminata = true)
    (ASYNC_STORAGE_AVAILABLE ? salvaStatoAsync() : salvaStato());
    
  } else {
    // 🚩 NUOVO: Se non ci sono vincitori, assicurati che la partita non sia bloccata
    if (partitaTerminata) {
        partitaTerminata = false; // Rimuove il blocco se i punti sono stati modificati sotto l'obiettivo
        (ASYNC_STORAGE_AVAILABLE ? salvaStatoAsync() : salvaStato());
    }
    winnerDiv.style.display = 'none';
    winnerDiv.classList.remove('finished');
    aggiornaListaGiocatori(); // Aggiorna per rimuovere i pulsanti disabilitati
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
