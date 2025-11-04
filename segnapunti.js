let modalitaVittoria = 'max';
let punteggioObiettivo = 100;
let giocatori = [];

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('modalita-vittoria').addEventListener('change', function() {
    modalitaVittoria = this.value;
    controllaVittoria();
  });
  document.getElementById('punteggio-obiettivo').addEventListener('input', function() {
    punteggioObiettivo = parseInt(this.value, 10);
    controllaVittoria();
  });
  document.getElementById('nuovo-giocatore').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') aggiungiGiocatore();
  });
  aggiornaListaGiocatori();
});

function aggiornaListaGiocatori() {
  const lista = document.getElementById('giocatori-lista');
  lista.innerHTML = '';
  giocatori.forEach((g, i) => {
    const li = document.createElement('li');
    li.className = 'giocatore-item';
    li.innerHTML = `
      <span class="giocatore-nome">${g.nome}</span>
      <span>Punti: <strong>${g.punti}</strong></span>
      <div class="punteggio-controls">
        <button onclick="modificaPunteggio(${i}, 1)">+1</button>
        <button onclick="modificaPunteggio(${i}, -1)">-1</button>
        <button onclick="modificaPunteggio(${i}, 5)">+5</button>
        <button onclick="modificaPunteggio(${i}, -5)">-5</button>
        <button onclick="rimuoviGiocatore(${i})" style="background:#e57373;">🗑️</button>
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

function controllaVittoria() {
  let vincitori = [];
  if (giocatori.length === 0) {
    document.getElementById('winner-message').style.display = 'none';
    return;
  }
  if (modalitaVittoria === 'max') {
    let maxPunti = Math.max(...giocatori.map(g => g.punti));
    if (maxPunti >= punteggioObiettivo) {
      vincitori = giocatori.filter(g => g.punti === maxPunti);
    }
  } else {
    let minPunti = Math.min(...giocatori.map(g => g.punti));
    if (minPunti <= punteggioObiettivo) {
      vincitori = giocatori.filter(g => g.punti === minPunti);
    }
  }
  const winnerDiv = document.getElementById('winner-message');
  if (vincitori.length > 0) {
    winnerDiv.style.display = 'block';
    winnerDiv.textContent = `Partita terminata! Vince: ${vincitori.map(v => v.nome).join(', ')} (${vincitori[0].punti} punti)`;
  } else {
    winnerDiv.style.display = 'none';
  }
}

window.aggiungiGiocatore = aggiungiGiocatore;
window.rimuoviGiocatore = rimuoviGiocatore;
window.modificaPunteggio = modificaPunteggio;
