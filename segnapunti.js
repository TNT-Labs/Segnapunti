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
// Funzioni per l'API 
// -------------------------------------------------------------------

function resetPartita() {
    if (!confirm('Sei sicuro di voler iniziare una nuova partita? Tutti i punteggi attuali saranno azzerati.')) {
        return;
    }
    
    // Azzeramento dei punti per i giocatori esistenti
    giocatori.forEach(giocatore => {
        giocatore.punti = 0;
    });
    
    partitaTerminata = false;
    salvaStato();
    window.location.href = 'index.html';
}

window.setModalitaVittoria = (value) => {
    modalitaVittoria = value;
    salvaStato(); 
};

window.setPunteggioObiettivo = (value) => {
    const punti = parseInt(value, 10);
    if (isNaN(punti) || punti <= 0) {
        alert('Il punteggio obiettivo deve essere un numero positivo.');
        const input = document.getElementById('punteggio-obiettivo');
        if (input) input.value = punteggioObiettivo;
        return;
    }
    punteggioObiettivo = punti;
    salvaStato(); 
};

window.resetPartita = resetPartita; 
window.caricaStoricoPartite = caricaStoricoPartite; 

// -------------------------------------------------------------------
// LOGICA ASINCRONA INDEXEDDB 
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
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(STATE_KEY);

            transaction.onerror = () => {
                console.error('Errore durante il caricamento dello stato');
                resolve();
            };

            request.onsuccess = (event) => {
                const state = event.target.result;
                if (state) {
                    modalitaVittoria = state.modalitaVittoria || 'max';
                    punteggioObiettivo = state.punteggioObiettivo || 100;
                    giocatori = state.giocatori || [];
                    partitaTerminata = state.partitaTerminata || false;
                    
                    if (state.darkMode) {
                        document.body.classList.add('dark-mode');
                    }
                }
                resolve();
            };
            
            request.onerror = () => {
                console.error('Errore nella richiesta di caricamento');
                resolve();
            };
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
            const request = store.put(stato);
            
            transaction.onerror = () => {
                console.error('Errore durante il salvataggio dello stato');
            };
            
            request.onerror = () => {
                console.error('Errore nella richiesta di salvataggio');
            };
        }).catch(error => {
            console.error('Errore apertura DB per salvataggio:', error);
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

        const request = store.add(partita);
        
        transaction.onerror = () => {
            console.error('Errore durante il salvataggio dello storico');
        };
        
        request.onerror = () => {
            console.error('Errore nella richiesta di salvataggio storico');
        };
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
}

async function requestPersistentStorage() {
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
}

// -------------------------------------------------------------------
// LOGICA MODALE PUNTI PERSONALIZZATI 
// -------------------------------------------------------------------

function mostraModalPunteggio(index) {
  if (partitaTerminata) return; 
  
  if (index < 0 || index >= giocatori.length) return;
  
  globalPlayerIndexToUpdate = index;
  
  const modal = document.getElementById('modal-overlay');
  const nomeGiocatore = document.getElementById('modal-title-player-name');
  const input = document.getElementById('punteggio-input-custom');
  
  if (modal && nomeGiocatore && input) {
      nomeGiocatore.textContent = `Aggiungi Punti a ${giocatori[index].nome}`;
      input.value = '';
      modal.style.display = 'flex';
      
      setTimeout(() => input.focus(), 100);
  }
}

function nascondiModalPunteggio() {
    const modal = document.getElementById('modal-overlay');
    if (modal) {
        modal.style.display = 'none';
    }
    globalPlayerIndexToUpdate = -1;
    
    const input = document.getElementById('punteggio-input-custom');
    if (input) input.value = '';
}

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
    
    animaPunteggio(globalPlayerIndexToUpdate, deltaPunti);

    salvaStato(); 
    renderGiocatoriPartita(); 
    controllaVittoria();
    nascondiModalPunteggio();
}

// FIX: Funzione separata per animazione con cleanup e floating number
function animaPunteggio(index, delta) {
    const puntiElement = document.getElementById(`punti-${index}`);
    if (!puntiElement) return;
    
    const strongElement = puntiElement.querySelector('strong');
    if (!strongElement) return;
    
    const animClass = delta >= 0 ? 'anim-up' : 'anim-down';
    
    // Rimuovi eventuali animazioni precedenti
    puntiElement.classList.remove('anim-up', 'anim-down');
    
    // Trigger reflow per riavviare l'animazione
    void puntiElement.offsetWidth;
    
    puntiElement.classList.add(animClass);
    strongElement.textContent = giocatori[index].punti;
    
    // Crea elemento floating number
    const floatingNumber = document.createElement('span');
    floatingNumber.className = `floating-number ${delta >= 0 ? 'positive' : 'negative'}`;
    floatingNumber.textContent = delta >= 0 ? `+${delta}` : delta;
    
    // Posiziona il numero vicino al punteggio
    const rect = strongElement.getBoundingClientRect();
    floatingNumber.style.position = 'fixed';
    floatingNumber.style.left = `${rect.right + 10}px`;
    floatingNumber.style.top = `${rect.top}px`;
    
    document.body.appendChild(floatingNumber);
    
    // Rimuovi il floating number dopo l'animazione
    setTimeout(() => {
        if (floatingNumber.parentNode) {
            floatingNumber.parentNode.removeChild(floatingNumber);
        }
    }, 1200);
    
    // FIX: Cleanup listener con timeout
    const cleanup = () => {
        puntiElement.classList.remove(animClass);
    };
    
    puntiElement.addEventListener('animationend', cleanup, { once: true });
    
    // Fallback nel caso animationend non venga triggerato
    setTimeout(cleanup, 500);
}

// -------------------------------------------------------------------
// LOGICA DOMContentLoaded
// -------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async function() {
  
  const loader = document.getElementById('loader-overlay');
  if (loader) loader.style.display = 'flex'; 
  
  const modal = document.getElementById('modal-overlay');
  if (modal) modal.style.display = 'none';

  await caricaStato(); 
  await requestPersistentStorage();

  updateDarkModeIcon(); 

  if (document.getElementById('giocatori-lista-partita')) {
      renderGiocatoriPartita(); 
      controllaVittoria(); 

      const btnAnnulla = document.getElementById('btn-modal-annulla');
      if (btnAnnulla) btnAnnulla.addEventListener('click', nascondiModalPunteggio);

      const modalForm = document.getElementById('modal-input-form');
      if (modalForm) modalForm.addEventListener('submit', function(e) {
          e.preventDefault();
          applicaPunteggioPersonalizzato();
      });

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
              element.addEventListener('click', () => applicaPunteggioPersonalizzato(btn.value));
          }
      });
      
      document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
              nascondiModalPunteggio();
          }
      });
      
      const btnRicomincia = document.getElementById('btn-ricomincia-partita');
      if (btnRicomincia) {
          btnRicomincia.addEventListener('click', resetPartita);
      }
      
  } else if (document.getElementById('impostazioni-partita')) {
      const modalitaVittoriaSelect = document.getElementById('modalita-vittoria');
      if(modalitaVittoriaSelect) modalitaVittoriaSelect.value = modalitaVittoria;
      
      const punteggioObiettivoInput = document.getElementById('punteggio-obiettivo');
      if(punteggioObiettivoInput) punteggioObiettivoInput.value = punteggioObiettivo;
      
      if(modalitaVittoriaSelect) {
          modalitaVittoriaSelect.addEventListener('change', (e) => setModalitaVittoria(e.target.value));
      }
      if(punteggioObiettivoInput) {
          punteggioObiettivoInput.addEventListener('change', (e) => {
              setPunteggioObiettivo(parseInt(e.target.value, 10));
          });
          punteggioObiettivoInput.addEventListener('blur', (e) => {
              const val = parseInt(e.target.value, 10);
              if (isNaN(val) || val <= 0) {
                  e.target.value = punteggioObiettivo;
                  alert('Il punteggio obiettivo deve essere un numero positivo.');
              }
          });
      }
      
      const btnNuovaPartita = document.getElementById('btn-nuova-partita');
      if (btnNuovaPartita) btnNuovaPartita.addEventListener('click', resetPartita);
      
      const btnAggiungi = document.getElementById('btn-aggiungi-giocatore');
      if (btnAggiungi) btnAggiungi.addEventListener('click', aggiungiGiocatore);
      
      const nomeInput = document.getElementById('nuovo-giocatore');
      if (nomeInput) {
          nomeInput.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                  e.preventDefault();
                  aggiungiGiocatore();
              }
          });
      }
      
      renderGiocatoriSettings(); 
      
  } else if (document.getElementById('storico-lista')) {
      await renderStoricoPartite();
  }
  
  if (loader) {
      setTimeout(() => {
          loader.style.display = 'none';
      }, 100);
  }
});

// -------------------------------------------------------------------
// LOGICA AGGIUNTA/RIMOZIONE GIOCATORI E PUNTI 
// -------------------------------------------------------------------
function aggiungiGiocatore() {
    const nomeInput = document.getElementById('nuovo-giocatore');
    const nome = (nomeInput ? nomeInput.value.trim() : '').slice(0, 30);
    
    if (nome === '') {
        alert("Inserisci un nome valido.");
        return;
    }

    if (nome.match(/[<>]/)) {
        alert("Il nome non può contenere caratteri speciali come < o >");
        return;
    }

    const nomeNormalizzato = nome.replace(/\s+/g, ' ').toLowerCase();
    if (giocatori.some(g => g.nome.replace(/\s+/g, ' ').toLowerCase() === nomeNormalizzato)) {
        alert("Questo nome esiste già!");
        if (nomeInput) nomeInput.value = '';
        return;
    }

    giocatori.push({ nome: nome, punti: 0 });
    if (nomeInput) nomeInput.value = '';

    salvaStato(); 

    if (document.getElementById('giocatori-lista-settings')) {
        renderGiocatoriSettings();
    }
}

function rimuoviGiocatore(index) {
    if (!confirm(`Sei sicuro di voler rimuovere ${giocatori[index].nome}?`)) {
        return;
    }
    
    giocatori.splice(index, 1);
    salvaStato(); 

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
    animaPunteggio(index, delta);

    salvaStato();
    renderGiocatoriPartita();
    controllaVittoria();
}

// -------------------------------------------------------------------
// LOGICA VITTORIA E RENDERING
// -------------------------------------------------------------------
function getVincitoriNomi() {
    if (giocatori.length === 0) return [];

    const puntiMappa = giocatori.map(g => g.punti);
    let vincitori = [];

    if (modalitaVittoria === 'max') {
        const maxPunti = Math.max(...puntiMappa);
        vincitori = giocatori.filter(g => g.punti >= punteggioObiettivo && g.punti === maxPunti);
        if (vincitori.length === 0 && Math.max(...puntiMappa) < punteggioObiettivo) {
             return [];
        }
    } else {
        const minPunti = Math.min(...puntiMappa);
        vincitori = giocatori.filter(g => g.punti === minPunti);
        
        const maxPuntiAttuali = Math.max(...puntiMappa);
        if (maxPuntiAttuali < punteggioObiettivo) {
             return [];
        } 
    }

    return vincitori.map(g => g.nome);
}

function controllaVittoria() {
    const winnerDiv = document.getElementById('winner-message');
    const gameOverActions = document.getElementById('game-over-actions');
    if (!winnerDiv) return;

    if (giocatori.length === 0) {
        if (winnerDiv.textContent !== '') {
            winnerDiv.textContent = '';
        }
        if (gameOverActions) gameOverActions.style.display = 'none';
        partitaTerminata = false; 
        salvaStato();
        return;
    }
    
    const puntiMappa = giocatori.map(g => g.punti);
    const maxPunti = Math.max(...puntiMappa);
    const minPunti = Math.min(...puntiMappa);
    
    let vincitoriNomi = [];
    let puntiVincitore = 0;
    let deveTerminare = false;
    
    if (modalitaVittoria === 'max' && maxPunti >= punteggioObiettivo) {
        deveTerminare = true;
        vincitoriNomi = giocatori.filter(g => g.punti === maxPunti).map(g => g.nome);
        puntiVincitore = maxPunti;
    } else if (modalitaVittoria === 'min' && maxPunti >= punteggioObiettivo) {
        deveTerminare = true;
        vincitoriNomi = giocatori.filter(g => g.punti === minPunti).map(g => g.nome);
        puntiVincitore = minPunti;
    }

    if (deveTerminare) {
        if (!partitaTerminata) {
            salvaStoricoPartita(vincitoriNomi, puntiVincitore);
            partitaTerminata = true;
            salvaStato(); 
        }

        winnerDiv.textContent = '';
        const text1 = document.createTextNode('Partita Terminata! Il vincitore è: ');
        const strong = document.createElement('strong');
        strong.textContent = vincitoriNomi.join(', ');
        const text2 = document.createTextNode(` con ${puntiVincitore} punti!`);
        
        winnerDiv.appendChild(text1);
        winnerDiv.appendChild(strong);
        winnerDiv.appendChild(text2);
        winnerDiv.style.display = 'block';
        
        if (gameOverActions) gameOverActions.style.display = 'block';

        giocatori.forEach((g, i) => {
            const item = document.getElementById(`giocatore-${i}`);
            if (item) {
                item.classList.add('game-over');
                if (vincitoriNomi.includes(g.nome)) {
                    item.classList.add('winner-highlight');
                } else {
                    item.classList.remove('winner-highlight');
                }
            }
        });
        
    } else {
        winnerDiv.style.display = 'none';
        if (gameOverActions) gameOverActions.style.display = 'none';
        partitaTerminata = false;
        
        giocatori.forEach((g, i) => {
            const item = document.getElementById(`giocatore-${i}`);
            if (item) {
                 item.classList.remove('game-over');
                 
                 if (modalitaVittoria === 'max') {
                     if (g.punti === maxPunti && giocatori.length > 0) {
                         item.classList.add('winner-highlight');
                     } else {
                         item.classList.remove('winner-highlight');
                     }
                 } else {
                     if (g.punti === minPunti && giocatori.length > 0) {
                         item.classList.add('winner-highlight');
                     } else {
                         item.classList.remove('winner-highlight');
                     }
                 }
            }
        });
        salvaStato();
    }
    
    document.querySelectorAll('.punteggio-controls button').forEach(btn => {
        btn.disabled = partitaTerminata;
    });
}

function renderGiocatoriPartita() {
    const lista = document.getElementById('giocatori-lista-partita');
    if (!lista) return;

    const giocatoriConIndice = giocatori.map((g, idx) => ({ ...g, originalIndex: idx }));
    
    if (modalitaVittoria === 'max') {
        giocatoriConIndice.sort((a, b) => b.punti - a.punti);
    } else {
        giocatoriConIndice.sort((a, b) => a.punti - b.punti);
    }

    lista.innerHTML = '';
    if (giocatori.length === 0) {
        lista.innerHTML = '<p class="empty-state">Nessun giocatore in partita. Aggiungine uno dalle impostazioni (⚙️).</p>';
        return;
    }

    giocatoriConIndice.forEach((g) => {
        const i = g.originalIndex;

        const li = document.createElement('li');
        li.className = `giocatore-item ${partitaTerminata ? 'game-over' : ''}`;
        li.id = `giocatore-${i}`;

        const nomeSpan = document.createElement('span');
        nomeSpan.className = 'giocatore-nome';
        nomeSpan.textContent = g.nome;

        const puntiEControlli = document.createElement('div');
        puntiEControlli.className = 'punti-e-controlli';

        const puntiSpan = document.createElement('span');
        puntiSpan.className = 'giocatore-punti';
        puntiSpan.id = `punti-${i}`;
        
        const puntiStrong = document.createElement('strong');
        puntiStrong.textContent = g.punti;
        puntiSpan.appendChild(puntiStrong);
        puntiSpan.appendChild(document.createTextNode(' Punti'));

        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'punteggio-controls';

        const buttons = [
            { text: '+1', title: 'Aggiungi 1 punto', action: () => modificaPunteggio(i, 1) },
            { text: '-1', title: 'Rimuovi 1 punto', action: () => modificaPunteggio(i, -1) },
            { text: '+5', title: 'Aggiungi 5 punti', action: () => modificaPunteggio(i, 5) },
            { text: '-5', title: 'Rimuovi 5 punti', action: () => modificaPunteggio(i, -5) },
            { text: '+10', title: 'Aggiungi 10 punti', action: () => modificaPunteggio(i, 10) },
            { text: '-10', title: 'Rimuovi 10 punti', action: () => modificaPunteggio(i, -10) },
            { text: '±', title: 'Punteggio Personalizzato', action: () => mostraModalPunteggio(i), class: 'btn-custom-score' }
        ];

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.text;
            button.title = btn.title;
            if (btn.class) button.className = btn.class;
            button.addEventListener('click', btn.action);
            controlsDiv.appendChild(button);
        });

        puntiEControlli.appendChild(puntiSpan);
        puntiEControlli.appendChild(controlsDiv);

        li.appendChild(nomeSpan);
        li.appendChild(puntiEControlli);
        lista.appendChild(li);
    });
    
    controllaVittoria(); 
}

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
        li.className = 'giocatore-item';
        
        const nomeSpan = document.createElement('span');
        nomeSpan.className = 'giocatore-nome';
        nomeSpan.textContent = g.nome;
        
        const puntiEControlli = document.createElement('div');
        puntiEControlli.className = 'punti-e-controlli';
        
        const puntiSpan = document.createElement('span');
        puntiSpan.className = 'giocatore-punti';
        puntiSpan.textContent = `${g.punti} Punti`;
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'punteggio-controls';
        
        const btnRimuovi = document.createElement('button');
        btnRimuovi.className = 'btn-rimuovi';
        btnRimuovi.title = 'Rimuovi giocatore';
        btnRimuovi.textContent = '🗑️ Rimuovi';
        btnRimuovi.addEventListener('click', () => rimuoviGiocatore(i));
        
        controlsDiv.appendChild(btnRimuovi);
        puntiEControlli.appendChild(puntiSpan);
        puntiEControlli.appendChild(controlsDiv);
        
        li.appendChild(nomeSpan);
        li.appendChild(puntiEControlli);
        lista.appendChild(li);
    });
}

async function renderStoricoPartite() {
    const lista = document.getElementById('storico-lista');
    if (!lista) return;

    const storico = await caricaStoricoPartite();
    lista.innerHTML = '';

    if (storico.length === 0) {
        lista.innerHTML = '<p class="empty-state">Nessuna partita nello storico.</p>';
        return;
    }

    storico.forEach(partita => {
        const li = document.createElement('li');
        li.className = 'storico-item';

        const header = document.createElement('div');
        header.className = 'storico-header';
        
        const vincitoreSpan = document.createElement('span');
        vincitoreSpan.className = 'storico-vincitore';
        vincitoreSpan.textContent = `🏆 ${partita.vincitori.join(', ')} (${partita.puntiVincitore})`;
        
        const dataSpan = document.createElement('span');
        dataSpan.className = 'storico-data';
        dataSpan.textContent = partita.data;
        
        header.appendChild(vincitoreSpan);
        header.appendChild(dataSpan);

        const details = document.createElement('div');
        details.className = 'storico-details';
        
        const modalitaP = document.createElement('p');
        modalitaP.innerHTML = `Modalità: <strong>${partita.modalita === 'max' ? 'Più punti' : 'Meno punti'}</strong>`;
        
        const partecipantiP = document.createElement('p');
        partecipantiP.textContent = 'Partecipanti:';
        
        const giocatoriUl = document.createElement('ul');
        giocatoriUl.className = 'giocatori-list';
        
        partita.giocatori.forEach(g => {
            const giocatoreLi = document.createElement('li');
            giocatoreLi.textContent = `${g.nome}: ${g.punti}`;
            giocatoriUl.appendChild(giocatoreLi);
        });
        
        details.appendChild(modalitaP);
        details.appendChild(partecipantiP);
        details.appendChild(giocatoriUl);
        
        li.appendChild(header);
        li.appendChild(details);
        lista.appendChild(li);
    });
}

function updateDarkModeIcon() {
  const iconBtn = document.getElementById('toggle-dark-mode');
  if (iconBtn) {
    iconBtn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
  }
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  updateDarkModeIcon();
  salvaStato(); 
}

// Espone le funzioni al Global Scope
window.aggiungiGiocatore = aggiungiGiocatore;
window.rimuoviGiocatore = rimuoviGiocatore;
window.modificaPunteggio = modificaPunteggio;
window.mostraModalPunteggio = mostraModalPunteggio;
window.toggleDarkMode = toggleDarkMode;
