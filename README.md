# 🃏 Segnapunti - App per Gestione Punteggi

![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Segnapunti** è un'applicazione web progressiva (PWA) completa per gestire i punteggi di partite a carte, giochi da tavolo, sport e molto altro. Supporta modalità di gioco multiple, preset personalizzabili, statistiche avanzate e funzionalità premium.

---

## 📋 Indice

- [Caratteristiche](#-caratteristiche)
- [Demo e Screenshot](#-demo-e-screenshot)
- [Installazione](#-installazione)
- [Uso](#-uso)
- [Modalità di Gioco](#-modalità-di-gioco)
- [Architettura](#️-architettura)
- [Tecnologie Utilizzate](#-tecnologie-utilizzate)
- [Browser Supportati](#-browser-supportati)
- [Roadmap](#-roadmap)
- [Contribuire](#-contribuire)
- [Licenza](#-licenza)

---

## ✨ Caratteristiche

### 🎮 Funzionalità Core

- **Multi-Modalità Punteggio**
  - 🎯 **Max**: Vince chi raggiunge per primo il punteggio massimo
  - ⏱️ **Min**: Vince chi arriva a 0 o al punteggio minimo
  - 🔄 **Rounds**: Sistema a round multipli con vincitori per round
  - 🎯 **Darts**: Modalità specifica per freccette (501, 301)

- **Gestione Giocatori**
  - Aggiungi/Rimuovi giocatori dinamicamente (2-8 giocatori)
  - Modifica punteggi con pulsanti +/- personalizzabili
  - Validazione nomi anti-duplicati
  - Supporto emoji nei nomi 😎

- **Preset di Gioco**
  - 9+ preset predefiniti (Scala 40, Burraco, Scopa, Tennis, ecc.)
  - Creazione preset personalizzati illimitati (Premium)
  - Import/Export preset in JSON
  - Categorizzazione: Carte 🃏, Tavolo 🎲, Sport ⚽, Altri 🎯

- **Storico Partite**
  - Salvataggio automatico partite completate
  - Visualizzazione cronologica con dettagli completi
  - Ricerca e filtri per gioco/giocatore
  - Cancellazione singola o totale
  - Export PDF/CSV (Premium)

- **Statistiche Avanzate** (Premium)
  - 📊 Grafici interattivi (Chart.js)
  - 🏆 Win rate per giocatore
  - 📈 Evoluzione punteggi nel tempo
  - 🎯 Distribuzione modalità di gioco
  - 📅 Timeline partite giocate

- **Dark Mode** 🌙
  - Toggle istantaneo tra modalità chiara/scura
  - Risparmio batteria su schermi OLED
  - Preferenza salvata localmente

- **PWA (Progressive Web App)**
  - Installabile come app nativa (iOS/Android)
  - Funzionamento offline con Service Worker
  - Icone ottimizzate per home screen
  - Notifiche push (futuro)

### ✨ Premium Features

| Funzionalità | Free | Premium |
|--------------|------|---------|
| Partite Illimitate | ✅ | ✅ |
| Preset Predefiniti | ✅ | ✅ |
| Storico Partite | ✅ | ✅ |
| Dark Mode | ✅ | ✅ |
| Preset Personalizzati | 1 | Illimitati |
| Export PDF/CSV | ❌ | ✅ |
| Statistiche Avanzate | ❌ | ✅ |
| Nessuna Pubblicità | ❌ | ✅ |
| Temi Premium | ❌ | ✅ |
| Cloud Backup | ❌ | 🚧 Prossimamente |

**Prezzo Premium**: €2.99 (acquisto una tantum)

---

## 🚀 Installazione

### Opzione 1: Installazione Web (Consigliata)

1. Visita l'app tramite browser
2. Su **iOS Safari**: Tocca `Condividi` → `Aggiungi a Home`
3. Su **Android Chrome**: Tocca menu → `Installa App`
4. L'app sarà disponibile come icona sulla home screen!

### Opzione 2: Sviluppo Locale

Clona il repository:

```bash
git clone https://github.com/TNT-Labs/Segnapunti.git
cd Segnapunti
```

Opzioni per servire l'app:

**Con Python:**
```bash
python3 -m http.server 8000
# Apri http://localhost:8000
```

**Con Node.js (http-server):**
```bash
npm install -g http-server
http-server -p 8000
# Apri http://localhost:8000
```

**Con VS Code Live Server:**
1. Installa estensione "Live Server"
2. Click destro su `index.html` → "Open with Live Server"

---

## 📖 Uso

### Avviare una Nuova Partita

1. **Seleziona Gioco**
   - Scegli un preset predefinito dal menu a tendina
   - Oppure crea un preset personalizzato da tab "Preset"

2. **Aggiungi Giocatori**
   - Inserisci nome giocatore e clicca `+`
   - Aggiungi da 2 a 8 giocatori
   - Nomi emoji supportati: "Mario 🍄", "Luigi 👻"

3. **Gioca!**
   - Usa pulsanti `+` / `-` per aggiornare punteggi
   - Il gioco termina automaticamente al raggiungimento obiettivo
   - 🏆 Trofeo dorato appare per il vincitore

4. **Salva Partita**
   - Clicca "💾 Salva Partita" per aggiungere allo storico
   - Partita salvata include: timestamp, giocatori, punteggi, durata

### Modalità di Gioco Dettagliate

#### 🎯 Modalità Max (Punteggio Massimo)
Esempio: Burraco (target: 2005 punti)

- Vince chi raggiunge **per primo** il punteggio target
- Punteggio cresce: 0 → 2005
- Usa pulsanti `+` per incrementare

#### ⏱️ Modalità Min (Punteggio Minimo)
Esempio: Scala 40 (target: 101 punti)

- Vince chi raggiunge **per primo** il target (o chi ha meno punti)
- Punteggio cresce ma vince chi finisce prima: 0 → 101
- Perde chi supera il target

#### 🔄 Modalità Rounds (Round Multipli)
Esempio: Scopa (target round: 21 pt, rounds da vincere: 2)

- Ogni round finisce al raggiungimento target
- Vince il round chi fa più punti (o meno, configurabile)
- Vince la partita chi vince N rounds

#### 🎯 Modalità Darts (Freccette)
Esempio: Freccette 501

- Parti da 501 punti
- Scala **verso lo 0** esatto
- Se vai sotto zero: **BUST!** → Torni al punteggio precedente
- Vince chi arriva esattamente a 0

---

## 🎮 Modalità di Gioco

### Preset Predefiniti

#### 🃏 Giochi di Carte

| Gioco | Modalità | Target | Descrizione |
|-------|----------|--------|-------------|
| Scala 40 | Min | 101 | Perde chi raggiunge 101 punti |
| Burraco | Max | 2005 | Vince chi totalizza 2005 punti |
| Briscola | Max | 11 | Vince chi arriva a 11 vittorie |
| Scopa | Rounds | 21 pt/round, 2 rounds | Vince 2 round |
| Pinnacola | Max | 1500 | Totalizza 1500 punti |
| Poker (Mani) | Rounds | 10k chips/mano, 5 mani | Vince 5 mani |

#### ⚽ Sport

| Gioco | Modalità | Target | Descrizione |
|-------|----------|--------|-------------|
| Tennis (Set) | Rounds | 6 game/set, 2 set | Vince 2 set |
| Pallavolo (Set) | Rounds | 25 pt/set, 3 set | Vince 3 set |

#### 🎯 Altri

| Gioco | Modalità | Target | Descrizione |
|-------|----------|--------|-------------|
| Freccette 501 | Darts | 501 | Scala da 501 a 0 esatto |
| Freccette 301 | Darts | 301 | Scala da 301 a 0 esatto |

---

## 🏗️ Architettura

### Struttura File

```
Segnapunti/
├── index.html                  # Pagina principale partita
├── settings.html               # Impostazioni
├── storico.html                # Storico partite
├── preset-manager.html         # Gestione preset
├── premium.html                # Pagina upgrade Premium
├── statistiche.html            # Statistiche avanzate (Premium)
├── manifest.json               # PWA manifest
├── service-worker.js           # Service Worker per offline
│
├── CSS/
│   ├── segnapunti.css          # Stili principali
│   ├── segnapunti-mobile.css   # Responsive mobile
│   ├── utility-classes.css     # Utility CSS reusable
│   └── preset-manager.css      # Stili preset manager
│
├── JavaScript/
│   ├── segnapunti.js           # Core game logic
│   ├── logger.js               # Production-safe logger
│   ├── error-handler.js        # Global error boundary
│   ├── storage-helper.js       # Storage abstraction
│   ├── polyfills.js            # Browser compatibility
│   ├── dark-mode-toggle.js     # Dark mode standalone
│   ├── preset-manager.js       # Preset CRUD operations
│   ├── billing-module.js       # Google Play billing
│   ├── ads-module.js           # AdMob ads management
│   ├── premium-ui.js           # Premium paywall UI
│   ├── export-module.js        # PDF/CSV export
│   └── statistics-module.js    # Statistics charts
│
└── Docs/
    ├── README.md               # Questo file
    └── BUGS_AUDIT_REPORT.md    # Report audit completo
```

### Pattern Architetturali

#### Module Pattern
```javascript
const ModuleName = (() => {
  // Private variables
  let privateVar = 0;

  // Public API
  return {
    publicMethod: () => { /*...*/ }
  };
})();
```

#### Storage Abstraction (3-Layer Fallback)
```
1. IndexedDB (preferito) → Async, 50MB+
2. localStorage (fallback) → Sync, 5-10MB
3. Memory (Safari private) → Session only
```

---

## 🛠️ Tecnologie Utilizzate

### Frontend
- **HTML5**: Semantic markup, ARIA labels
- **CSS3**: Variables, Grid, Flexbox, Animations
- **JavaScript ES6+**: Modules, Async/Await

### Libraries
- **Chart.js 4.4.1**: Grafici statistiche interattivi
- **jsPDF 2.x**: Generazione PDF per export

### APIs
- **IndexedDB API**: Storage persistente asincrono
- **localStorage API**: Storage sincrono fallback
- **Service Worker API**: Offline support
- **Web App Manifest**: PWA installation
- **Payment Request API**: In-app purchases

---

## 🌐 Browser Supportati

| Browser | Versione Minima | Supporto |
|---------|----------------|----------|
| Chrome (Desktop) | 80+ | ✅ Completo |
| Chrome (Mobile) | 80+ | ✅ PWA installabile |
| Safari (Desktop) | 14+ | ✅ Supportato |
| Safari (iOS) | 14+ | ✅ PWA installabile |
| Firefox | 75+ | ✅ Completo |
| Edge (Chromium) | 80+ | ✅ Completo |
| IE 11 | 11 | ⚠️ Supporto limitato |

**Polyfills Inclusi Per:**
- Object.assign (IE11)
- Array.from (IE11)
- Array.includes (IE11)
- String.prototype.includes (IE11)
- Promise.finally (IE11)

---

## 🗺️ Roadmap

### ✅ v1.3 (Attuale)
- [x] Bug fixes multipli (41+ fixes)
- [x] Safari private mode support
- [x] Security hardening (XSS protection)
- [x] Performance optimizations

### 🚧 v1.4 (In Pianificazione)
- [ ] Tests automatizzati (Jest/Mocha)
- [ ] Error monitoring (Sentry)
- [ ] Cloud backup (Firebase/Supabase)

### 💡 v2.0 (Futuro)
- [ ] Multi-player online (WebSockets)
- [ ] Internazionalizzazione (i18n): EN, ES, FR
- [ ] TypeScript migration

---

## 🤝 Contribuire

Contributi sono benvenuti! Segui questi passaggi:

1. **Fork** del repository
2. **Crea branch** per feature: `git checkout -b feature/nome-feature`
3. **Commit** con messaggi descrittivi
4. **Push** al tuo fork
5. **Apri Pull Request** su GitHub

### Coding Style
- **JavaScript**: 2 spazi indentazione, camelCase
- **CSS**: 2 spazi indentazione, kebab-case
- **Error Handling**: Sempre try-catch per operazioni async
- **Logging**: Usa `Logger.log/warn/error`

---

## 🐛 Segnalare Bug

Hai trovato un bug? Apri un issue su GitHub con:
- Descrizione del problema
- Passaggi per riprodurlo
- Comportamento atteso vs attuale
- Screenshot se possibile
- Browser/OS/Device info

---

## 📄 Licenza

Questo progetto è rilasciato sotto licenza **MIT License**.

---

## 🙏 Ringraziamenti

- **Chart.js Team**: Per la libreria grafici
- **jsPDF Team**: Per export PDF
- **Google Fonts**: Inter font family
- **Community**: Feedback e testing

---

## 📞 Contatti

- **GitHub**: [@TNT-Labs](https://github.com/TNT-Labs)
- **Issues**: [GitHub Issues](https://github.com/TNT-Labs/Segnapunti/issues)

---

## ❓ FAQ

### Come installo l'app come PWA?
Su Chrome/Edge: Apri l'app, clicca sull'icona `+` nella barra URL → "Installa Segnapunti".
Su Safari iOS: Apri Safari → Menu condividi → "Aggiungi a Home".

### L'app funziona offline?
Sì! Grazie al Service Worker, l'app funziona completamente offline dopo la prima visita.

### Come posso esportare i miei dati?
Vai a "Storico" → "Esporta Dati" → Scegli PDF o CSV (richiede Premium).

### Quanto costa Premium?
€2.99 una tantum. Nessun abbonamento, pagamento unico.

### I miei dati sono al sicuro?
Sì, tutti i dati sono salvati localmente sul tuo device. Massima privacy.

---

<div align="center">

**Fatto con ❤️ da TNT Labs**

⭐ Se ti piace il progetto, lascia una stella su GitHub!

[🐛 Report Bug](https://github.com/TNT-Labs/Segnapunti/issues) • [📖 Audit Report](BUGS_AUDIT_REPORT.md)

</div>
