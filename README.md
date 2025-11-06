# Segnapunti Carte – Progressive Web App

Segnapunti Carte è una web app moderna e leggera per gestire i punteggi dei giochi di carte, ottimizzata per dispositivi mobili e desktop, installabile come PWA (Progressive Web App).

## 🎯 Funzionalità Principali

### Gestione Partita
- ✅ Aggiungi e rimuovi giocatori dinamicamente
- ✅ Modifica i punteggi con pulsanti rapidi (+1, -1, +5, -5)
- ✅ Punteggio personalizzato avanzato con modale dedicata
- ✅ Pulsanti rapidi nel modale: ±10, ±20, ±50
- ✅ Ordinamento automatico giocatori per punteggio
- ✅ Animazioni visive per feedback immediato

### Modalità di Gioco
- 🏆 **Modalità Max**: Vince chi fa **più** punti
- 🎯 **Modalità Min**: Vince chi fa **meno** punti
- 📊 Punteggio obiettivo personalizzabile
- 🎉 Evidenziazione automatica del leader
- 🏁 Termine partita con salvataggio automatico

### Storico e Dati
- 📜 Storico completo di tutte le partite giocate
- 💾 Salvataggio automatico con IndexedDB
- 🔄 Persistenza dati anche offline
- 📱 Storage persistente del browser

### Interfaccia e Design
- 🌓 Modalità Scura/Chiara con toggle
- 📱 Design responsive ottimizzato per mobile
- 🎨 Interfaccia moderna con font Inter
- ⚡ Animazioni fluide e feedback visivi
- 🔒 Header fisso per accesso rapido alle funzioni

## 🚀 Come Usare

### Installazione Locale
1. Scarica tutti i file nella stessa cartella
2. Apri `index.html` con un browser moderno
3. Per installare come PWA, clicca su "Aggiungi a schermata Home" dal menu del browser

### Installazione da GitHub Pages
Visita direttamente: `https://tnt-labs.github.io/Segnapunti/`

### Primo Utilizzo
1. Clicca sull'icona ⚙️ (Impostazioni) in alto a destra
2. Aggiungi i giocatori uno alla volta
3. Configura la modalità di vittoria e il punteggio obiettivo
4. Torna alla partita con il pulsante "◀️ Partita"
5. Usa i pulsanti per modificare i punteggi

### Durante la Partita
- **+1/-1**: Modifica rapida di 1 punto
- **+5/-5**: Modifica rapida di 5 punti (solo desktop/tablet)
- **± (Plus/Minus)**: Apri modale per punteggi personalizzati
- **ESC**: Chiudi la modale senza applicare

### Navigazione
- 🃏 **Punteggi Attuali**: Pagina principale della partita
- ⚙️ **Impostazioni**: Gestione giocatori e configurazione
- 📜 **Storico**: Visualizza tutte le partite passate
- 🌙/☀️ **Toggle Dark Mode**: Cambia tema

## 🛠️ Personalizzazione

### Colori e Stile
Modifica le variabili CSS in `segnapunti.css`:
```css
:root {
  --colore-primario: #2a4d69;
  --colore-secondario: #4b86b4;
  --colore-sfondo: #f4f6fb;
  /* ... altre variabili ... */
}
```

### Manifest e Icone
Personalizza nome e icone in `manifest.json`:
```json
{
  "name": "Il Tuo Nome App",
  "short_name": "Nome Breve",
  "icons": [ /* ... tue icone ... */ ]
}
```

### Service Worker
Modifica la cache e la strategia in `service-worker.js`:
```javascript
const CACHE_NAME = 'tuo-cache-v1.0.0';
const ASSETS_TO_CACHE = [ /* ... tuoi assets ... */ ];
```

## 📋 Requisiti Tecnici

### Browser Supportati
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

### Funzionalità Richieste
- IndexedDB (per salvataggio dati)
- Service Worker (per PWA e offline)
- ES6+ JavaScript
- CSS Grid e Flexbox

### Per PWA Completa
- HTTPS obbligatorio (eccetto localhost)
- Manifest.json configurato
- Service Worker registrato
- Icone nelle dimensioni richieste

## 🔧 Struttura File

```
Segnapunti/
│
├── index.html              # Pagina principale partita
├── settings.html           # Pagina impostazioni
├── storico.html           # Pagina storico partite
├── segnapunti.js          # Logica JavaScript
├── segnapunti.css         # Stili CSS
├── manifest.json          # Manifest PWA
├── service-worker.js      # Service Worker per offline
├── README.md              # Questa documentazione
│
└── icon-*.png            # Icone varie dimensioni
    ├── icon-72x72.png
    ├── icon-96x96.png
    ├── icon-128x128.png
    ├── icon-144x144.png
    ├── icon-152x152.png
    ├── icon-192.png
    ├── icon-384x384.png
    └── icon-512.png
```

## 🐛 Bug Fix e Miglioramenti (v1.0.7)

### Bug Risolti
- ✅ Modale che si apriva automaticamente all'avvio
- ✅ Ordine giocatori desincronizzato dopo ordinamento
- ✅ Dark mode icon non aggiornata al caricamento
- ✅ Race condition con il loader
- ✅ Memory leak negli event listener delle animazioni
- ✅ Gestione errori IndexedDB mancante
- ✅ Encoding emoji corrotto nei file HTML

### Miglioramenti Sicurezza
- ✅ Prevenzione XSS con creazione DOM invece di innerHTML
- ✅ Validazione input per caratteri speciali
- ✅ Conferme utente per azioni distruttive
- ✅ Validazione punteggio obiettivo (solo valori positivi)

### Miglioramenti UX
- ✅ Chiusura modale con tasto ESC
- ✅ Focus migliorato su iOS
- ✅ Validazione real-time del punteggio obiettivo
- ✅ Cleanup automatico delle animazioni
- ✅ Feedback visivi per tutte le azioni

## 💡 Consigli per l'Uso

### Giochi Consigliati
- 🃏 **Scala 40**: Modalità Max, Obiettivo 500
- 🎴 **Burraco**: Modalità Max, Obiettivo 2000
- 🂡 **Briscola**: Modalità Max, Obiettivo 120
- 🎲 **Pinnacola**: Modalità Max, Obiettivo 1500
- 🃏 **Poker**: Modalità Max, personalizzabile

### Best Practice
1. Aggiungi tutti i giocatori prima di iniziare
2. Configura modalità e obiettivo in base al gioco
3. Usa i pulsanti rapidi per modifiche frequenti
4. Usa il modale ± per punteggi complessi
5. Controlla lo storico per rivedere le partite passate

## 🔄 Sviluppo Futuro

### Roadmap
- [ ] Export/Import dati partite (CSV/JSON)
- [ ] Grafici e statistiche avanzate
- [ ] Modalità multiplayer sincronizzato
- [ ] Temi personalizzabili aggiuntivi
- [ ] Supporto per più lingue
- [ ] Widget punteggio veloce
- [ ] Timer per turni
- [ ] Note per giocatore

## 📱 Compatibilità Dispositivi

### Mobile
- ✅ Smartphone Android (Chrome, Firefox, Samsung Internet)
- ✅ iPhone (Safari, Chrome)
- ✅ Tablet Android
- ✅ iPad

### Desktop
- ✅ Windows (Chrome, Edge, Firefox)
- ✅ macOS (Safari, Chrome, Firefox)
- ✅ Linux (Chrome, Firefox)

### Installazione PWA
- Android: Menu browser → "Aggiungi a schermata Home"
- iOS: Safari → Condividi → "Aggiungi a Home"
- Desktop: Icona installazione nella barra degli indirizzi

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Sei libero di:
- Usare il codice per progetti personali e commerciali
- Modificare e personalizzare l'applicazione
- Distribuire versioni modificate
- Contribuire con miglioramenti

## 👨‍💻 Credits

**Creato da Tnt-Labs © 2025**

### Tecnologie Utilizzate
- Vanilla JavaScript (ES6+)
- CSS3 con Custom Properties
- IndexedDB API
- Service Worker API
- Web App Manifest
- Google Fonts (Inter)

### Ringraziamenti
- Community PWA per le best practice
- MDN Web Docs per la documentazione
- Font Inter by Rasmus Andersson

## 🆘 Supporto e Contributi

### Hai Trovato un Bug?
Apri una issue su GitHub con:
- Descrizione del problema
- Passi per riprodurlo
- Browser e dispositivo utilizzato
- Screenshot se possibile

### Vuoi Contribuire?
1. Fork del repository
2. Crea un branch per la tua feature
3. Commit delle modifiche
4. Push al branch
5. Apri una Pull Request

### Contatti
- GitHub: [Tnt-Labs](https://github.com/tnt-labs)
- Issues: [Segnapunti Issues](https://github.com/tnt-labs/Segnapunti/issues)

---

**Versione**: 1.0.7  
**Ultimo Aggiornamento**: Gennaio 2025  
**Stato**: Stabile e Production-Ready ✅
