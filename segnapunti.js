let modalitaVittoria = 'max';
let punteggioObiettivo = 100;
let giocatori = [];

document.addEventListener('DOMContentLoaded', function() {
  // Inizializza i valori dalle impostazioni HTML
  modalitaVittoria = document.getElementById('modalita-vittoria').value;
  punteggioObiettivo = parseInt(document.getElementById('punteggio-obiettivo').value, 10);
  
  document.getElementById('modalita-vittoria').addEventListener('change', function() {
    modalitaVittoria = this.value;
    controllaVittoria();
  });
  
  // Event listener corretto per 'input'
  document.getElementById('punteggio-obiettivo').addEventListener('input', function() {
    const val = parseInt(this.value, 10);
    punteggioObiettivo = val > 0 ? val : 1; // Assicura che sia almeno 1
    controllaVittoria();
  });
  
  document.getElementById('nuovo-giocatore').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault(); // Impedisce l'invio del form se fosse in un form
      aggiungiGiocatore();
    }
  });
  
  // Aggiunto listener per il pulsante 'Aggiungi Giocatore'
  document.getElementById('btn-aggiungi-giocatore').addEventListener('click', aggiungiGiocatore);
  
  aggiornaListaGiocatori();
  controllaVittoria(); // Controlla la vittoria anche all'avvio
});

function aggiornaListaGiocatori() {
  const lista = document.getElementById('giocatori-lista');
  lista.innerHTML = '';
  
  // Determina se c'è un vincitore per evidenziarlo
  const vincitoriNomi = getVincitoriNomi();
  
  giocatori.forEach((g, i) => {
    const li = document.createElement('li');
    // Aggiunto 'winner-highlight' se il giocatore è un vincitore
    li.className = `giocatore-item ${vincitoriNomi.includes(g.nome) ? 'winner-highlight' : ''}`;
    
    // Controlli di punteggio più compatti
    li.innerHTML = `
      <span class="giocatore-nome">${g.nome}</span>
      <div class="punti-e-controlli">
        <span class="giocatore-punti"><strong>${g.punti}</strong> Punti</span>
        <div class="punteggio-controls">
          <button title="Aggiungi 1 punto" onclick="modificaPunteggio(${i}, 1)">+1</button>
          <button title="Rimuovi 1 punto" onclick="modificaPunteggio(${i}, -1)">-1</button>
          <button title="Aggiungi 5 punti" onclick="modificaPunteggio(${i}, 5)">+5</button>
          <button title="Rimuovi 5 punti" onclick="modificaPunteggio(${i}, -5)">-5</button>
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
    aggiornaListaGiocatori();
    // Non è necessario controllare la vittoria qui, dato che il punteggio è 0
  }
}

function rimuoviGiocatore(index) {
  giocatori.splice(index, 1);
  aggiornaListaGiocatori();
  controllaVittoria();
}

function modificaPunteggio(index, delta) {
  giocatori[index].punti += delta;
  aggiornaListaGiocatori();
  controllaVittoria();
}

// Funzione di supporto per ottenere i nomi dei vincitori
function getVincitoriNomi() {
  if (giocatori.length === 0) {
    return [];
  }
  
  const puntiMappa = giocatori.map(g => g.punti);
  let vincitori = [];

  if (modalitaVittoria === 'max') {
    const maxPunti = Math.max(...puntiMappa);
    if (maxPunti >= punteggioObiettivo) {
      vincitori = giocatori.filter(g => g.punti === maxPunti);
    }
  } else { // modalitaVittoria === 'min'
    const minPunti = Math.min(...puntiMappa);
    if (minPunti <= punteggioObiettivo) {
      vincitori = giocatori.filter(g => g.punti === minPunti);
    }
  }
  return vincitori.map(v => v.nome);
}

// Funzione principale per il controllo della vittoria e l'aggiornamento del messaggio
function controllaVittoria() {
  const winnerDiv = document.getElementById('winner-message');
  
  if (giocatori.length === 0) {
    winnerDiv.style.display = 'none';
    aggiornaListaGiocatori(); // Aggiorna per rimuovere eventuali highlight
    return; // BUG FIX: Ritorna se non ci sono giocatori
  }
  
  const puntiMappa = giocatori.map(g => g.punti);
  let vincitori = [];
  
  if (modalitaVittoria === 'max') {
    const maxPunti = Math.max(...puntiMappa);
    if (maxPunti >= punteggioObiettivo) {
      vincitori = giocatori.filter(g => g.punti === maxPunti);
    }
  } else { // modalitaVittoria === 'min'
    const minPunti = Math.min(...puntiMappa);
    if (minPunti <= punteggioObiettivo) {
      vincitori = giocatori.filter(g => g.punti === minPunti);
    }
  }
  
  if (vincitori.length > 0) {
    // BUG FIX: Aggiorna la lista *prima* di mostrare il vincitore
    // in modo che l'highlight venga applicato
    aggiornaListaGiocatori(); 
    winnerDiv.style.display = 'block';
    winnerDiv.textContent = `🎉 Partita terminata! Vince: ${vincitori.map(v => v.nome).join(', ')} (${vincitori[0].punti} punti)`;
  } else {
    winnerDiv.style.display = 'none';
    aggiornaListaGiocatori(); // Aggiorna per rimuovere eventuali highlight se le condizioni non sono più soddisfatte
  }
}

// Rende le funzioni disponibili a livello globale per l'HTML
window.aggiungiGiocatore = aggiungiGiocatore;
window.rimuoviGiocatore = rimuoviGiocatore;
window.modificaPunteggio = modificaPunteggio;
window.controllaVittoria = controllaVittoria;
