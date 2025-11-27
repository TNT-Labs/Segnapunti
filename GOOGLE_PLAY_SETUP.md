# 🚀 Guida Completa: Pubblicazione su Google Play

## Panoramica

Questa guida ti accompagna passo-passo nella pubblicazione di **Segnapunti** su Google Play Store come **Trusted Web Activity (TWA)**.

---

## 📋 Checklist Pre-Pubblicazione

### ✅ Completato
- [x] ✅ App funzionante e testata
- [x] ✅ Service Worker implementato
- [x] ✅ Manifest.json configurato
- [x] ✅ Icone corrette (tutte le dimensioni)
- [x] ✅ Riferimenti icone corretti
- [x] ✅ Dark mode implementato
- [x] ✅ Mobile responsive
- [x] ✅ Privacy Policy creata (`privacy-policy.html`)
- [x] ✅ Template assetlinks.json creato (`.well-known/assetlinks.json`)

### 🔄 Da Completare
- [ ] ⏳ HTTPS configurato (vedi `HTTPS_SETUP_GUIDE.md`)
- [ ] ⏳ Dominio registrato e configurato
- [ ] ⏳ Privacy Policy pubblicata online
- [ ] ⏳ SHA-256 fingerprint ottenuto
- [ ] ⏳ assetlinks.json completato e deployato
- [ ] ⏳ App Android TWA generata
- [ ] ⏳ Account Google Play Console attivo
- [ ] ⏳ App pubblicata su Google Play

---

## 🎯 Step 1: Registra Dominio e Attiva HTTPS

### Opzione Consigliata: Netlify (5 minuti)

1. **Deploy su Netlify:**
   ```bash
   1. Vai su https://netlify.com
   2. Sign up con GitHub
   3. New site from Git
   4. Seleziona repo: TNT-Labs/Segnapunti
   5. Branch: main
   6. Build: (lascia vuoto)
   7. Publish directory: .
   8. Deploy!
   ```

2. **Ottieni URL HTTPS:**
   ```
   URL automatico: https://segnapunti-app.netlify.app
   ✅ HTTPS già attivo!
   ```

3. **Custom Domain (Opzionale):**
   ```
   Site settings → Domain management
   → Add custom domain
   → segnapunti.com
   → Verify & Configure DNS
   → HTTPS automatico in 1 minuto
   ```

**📝 Annota il tuo URL finale:** `_____________________________`

---

## 🎯 Step 2: Pubblica Privacy Policy

### Upload su Netlify

```bash
# La privacy policy è già nel repo: privacy-policy.html
# Netlify la servirà automaticamente a:
https://TUO-DOMINIO.com/privacy-policy.html

# Oppure su path dedicato:
https://TUO-DOMINIO.com/privacy
```

### Verifica Accessibilità

```bash
# Test da browser:
curl https://segnapunti.tuodominio.com/privacy-policy.html

# Deve ritornare: HTTP 200 OK
```

**✅ URL Privacy Policy:** `_____________________________`

---

## 🎯 Step 3: Crea Account Google Play Console

1. **Vai su:** https://play.google.com/console/signup

2. **Crea Account Sviluppatore:**
   ```
   - Nome sviluppatore: TNT Labs
   - Email: [tua-email@esempio.com]
   - Tipo: Individuale o Organizzazione
   - Paga quota registrazione: €25 (una tantum)
   ```

3. **Completa Profilo Sviluppatore:**
   ```
   - Indirizzo completo
   - Numero di telefono
   - Sito web: [URL della tua app]
   - Email di contatto pubblico
   ```

4. **Accetta Termini:**
   - Developer Distribution Agreement
   - Google Play Developer Program Policies

**⏱️ Tempo approvazione:** 24-48 ore

---

## 🎯 Step 4: Genera App Android TWA

### Opzione A: PWA Builder (CONSIGLIATO - GUI)

#### 1. Genera Package

1. **Vai su:** https://www.pwabuilder.com/

2. **Inserisci URL:**
   ```
   Enter your site's URL: https://segnapunti.tuodominio.com
   → Start
   ```

3. **Valida PWA:**
   ```
   PWABuilder analizzerà:
   ✅ Manifest presente
   ✅ Service Worker presente
   ✅ HTTPS attivo
   ✅ Icons disponibili

   Se tutto OK: "Your PWA looks great!"
   ```

4. **Package Android App:**
   ```
   → Seleziona "Android" tab
   → Package Type: "Trusted Web Activity"
   → Options:
     - Name: Segnapunti
     - Package ID: com.tntlabs.segnapunti
     - Version: 1
     - Version code: 1
     - Host: segnapunti.tuodominio.com
     - Start URL: /
     - Theme color: #2a4d69
     - Background color: #f4f6fb
     - Icon: (auto-detect from manifest)
     - Splash screen: Enabled
     - Fallback strategy: Custom tabs
   → Generate Package
   ```

5. **Download:**
   ```
   → Download ZIP
   File: segnapunti-android.zip (~5MB)
   ```

#### 2. Signing Configuration

**⚠️ IMPORTANTE:** Devi firmare l'APK con il tuo keystore.

```bash
# Unzip package
unzip segnapunti-android.zip
cd segnapunti-android

# Genera keystore (PRIMA VOLTA SOLO)
keytool -genkey -v \
  -keystore segnapunti-release.keystore \
  -alias segnapunti \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Rispondi alle domande:
# Password keystore: [SCEGLI PASSWORD SICURA - NON PERDERLA!]
# Nome e cognome: TNT Labs
# Unità organizzativa: Development
# Organizzazione: TNT Labs
# Città: [La tua città]
# Provincia: [La tua provincia]
# Codice paese: IT
# Password chiave: [STESSA PASSWORD O DIVERSA]

# ⚠️ BACKUP KEYSTORE: Copia segnapunti-release.keystore in luogo sicuro!
# Se lo perdi, NON potrai più aggiornare l'app su Play Store!
```

#### 3. Build Signed APK

```bash
# Build con Android Studio (se installato):
./gradlew assembleRelease

# Oppure usa PWABuilder Cloud Build (più facile):
# 1. Upload keystore su PWABuilder
# 2. Inserisci password
# 3. Cloud build automatico
# 4. Download APK firmato
```

---

### Opzione B: Bubblewrap CLI (Manuale - Avanzato)

```bash
# Installa Bubblewrap
npm install -g @bubblewrap/cli

# Inizializza progetto TWA
bubblewrap init --manifest https://segnapunti.tuodominio.com/manifest.json

# Rispondi alle domande:
# App name: Segnapunti
# Package name: com.tntlabs.segnapunti
# Host: segnapunti.tuodominio.com
# Start URL: /
# Icon: (auto da manifest)

# Genera keystore
bubblewrap generateKey segnapunti-release.keystore

# Build APK
bubblewrap build

# Output: app-release-signed.apk
```

---

## 🎯 Step 5: Ottieni SHA-256 Fingerprint

### Da Keystore Firmato

```bash
# Con keytool (Java):
keytool -list -v -keystore segnapunti-release.keystore

# Output:
# Certificate fingerprints:
#  SHA1: XX:XX:XX:...
#  SHA256: AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99

# ✅ COPIA IL VALORE SHA256 (quello lungo a 32 byte separati da : )
```

### Formato per assetlinks.json

```bash
# Il fingerprint deve essere MAIUSCOLO, separato da :
# Esempio:
AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99
```

**📝 Annota SHA-256:** `_____________________________`

---

## 🎯 Step 6: Completa assetlinks.json

### 1. Modifica File

Apri `.well-known/assetlinks.json` e sostituisci:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.tntlabs.segnapunti",
      "sha256_cert_fingerprints": [
        "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99"
      ]
    }
  }
]
```

**⚠️ IMPORTANTE:**
- `package_name` DEVE corrispondere al package Android
- `sha256_cert_fingerprints` DEVE essere il fingerprint del keystore di PRODUZIONE

### 2. Deploy su Server

```bash
# Commit e push
git add .well-known/assetlinks.json
git commit -m "Add assetlinks.json per TWA"
git push origin main

# Netlify auto-deploy
# Oppure upload manuale su server
```

### 3. Verifica Accessibilità

```bash
# Deve essere accessibile via HTTPS a:
https://segnapunti.tuodominio.com/.well-known/assetlinks.json

# Test:
curl https://segnapunti.tuodominio.com/.well-known/assetlinks.json

# Deve ritornare il JSON senza errori
```

### 4. Valida con Google Tool

```
https://developers.google.com/digital-asset-links/tools/generator

Statement List Generator and Tester:
→ Site domain: segnapunti.tuodominio.com
→ App package name: com.tntlabs.segnapunti
→ Test Statement

✅ Deve mostrare: "No error found"
```

---

## 🎯 Step 7: Upload su Google Play Console

### 1. Crea Nuova App

```
Google Play Console → Create app

- App name: Segnapunti
- Default language: Italiano (Italia)
- App or game: App
- Free or paid: Gratuito
- Developer Program Policies: ✅ Accetta
- US export laws: ✅ Accetta
→ Create app
```

### 2. Store Listing (Scheda Store)

```
Menu: Grow → Store presence → Main store listing

📝 App details:
- App name: Segnapunti - Punteggi Giochi da Tavolo
- Short description (80 chars):
  "Tieni traccia dei punteggi di tutti i tuoi giochi da tavolo e di carte!"

- Full description (4000 chars):
  "🎲 Segnapunti è l'app perfetta per tutti gli appassionati di giochi da tavolo!

  Tieni traccia dei punteggi durante le tue partite a:
  ✅ Giochi di carte (Poker, Scala 40, Burraco, Briscola...)
  ✅ Giochi da tavolo (Monopoly, Risk, Catan...)
  ✅ Giochi di società (Pictionary, Trivial Pursuit...)
  ✅ Giochi personalizzati

  🌟 FUNZIONALITÀ PRINCIPALI:
  • ✨ Preset di gioco predefiniti (Poker, Burraco, Scopa, Tennis...)
  • 📝 Crea i tuoi preset personalizzati
  • 👥 Aggiungi illimitati giocatori
  • 📊 Traccia punteggi e rounds vinti
  • 📈 Statistiche dettagliate
  • 📜 Storico partite completo
  • 📥 Esporta dati in PDF o CSV
  • 🌙 Dark mode elegante
  • 📱 Design mobile-first
  • ⚡ Funziona anche offline
  • 🔒 Privacy garantita: tutti i dati rimangono sul tuo dispositivo

  🎮 MODALITÀ DI GIOCO:
  • Max: Vince chi raggiunge il punteggio più alto
  • Min: Vince chi ha il punteggio più basso
  • Rounds: Vince chi conquista più rounds (Best of 3, 5, 7...)
  • Darts: Modalità freccette (501, 301...)

  💯 PERFETTO PER:
  • Serate in famiglia
  • Tornei tra amici
  • Eventi ludici
  • Club di giochi da tavolo
  • Giocatori occasionali e hardcore

  📊 STATISTICHE AVANZATE:
  • Media punteggi per giocatore
  • Storico vittorie
  • Durata media partite
  • Grafici interattivi
  • Esportazione dati per analisi

  🔒 PRIVACY FIRST:
  • Zero raccolta dati personali
  • Tutti i dati memorizzati localmente
  • Nessuna registrazione richiesta
  • Funziona completamente offline
  • GDPR compliant

  ⭐ Scarica ora e non perdere mai più il conto dei punteggi!"

📷 Screenshots:
- Almeno 2 screenshot (max 8)
- Dimensioni: 1080x1920 (portrait) o 1920x1080 (landscape)
- Formati: PNG o JPG

🎬 Video promo (opzionale):
- YouTube video demo

🎨 Graphic assets:
- Feature graphic: 1024x500 (obbligatorio)
- Icon: 512x512 (auto da manifest)

📂 Categorie:
- App category: Produttività
- Tags: giochi, punteggi, score, board games

📧 Contact details:
- Email: privacy@tntlabs.it
- Website: https://segnapunti.tuodominio.com
- Phone: (opzionale)

🔒 Privacy policy:
- URL: https://segnapunti.tuodominio.com/privacy-policy.html
```

### 3. Content Rating

```
Menu: Policy → App content → Content rating

→ Start questionnaire

Email: privacy@tntlabs.it

Q: Does your app contain violence?
A: No

Q: Does your app contain sexual content?
A: No

Q: Does your app contain strong language?
A: No

Q: Does your app contain alcohol, tobacco, or drugs?
A: No

Q: Does your app include gambling or betting?
A: No

Q: Does your app contain ads?
A: Yes, but non-intrusive banner ads

→ Calculate rating
→ Apply rating

✅ Expected: PEGI 3 (Everyone)
```

### 4. Target Audience

```
Menu: Policy → App content → Target audience

- Target age: 3+ (Everyone)
- App designed for children: No
```

### 5. Privacy & Security

```
Menu: Policy → App content → Privacy & security

Data safety section:
→ Start

Q: Does your app collect or share user data?
A: No (tutti i dati sono locali)

Q: Does your app use encryption?
A: Yes (HTTPS)

Q: Can users request data deletion?
A: Yes (cancellazione dati locali)

Q: Does your app allow account creation?
A: No

→ Submit
```

### 6. Upload APK/AAB

```
Menu: Release → Production → Create new release

⚠️ IMPORTANTE: Google richiede AAB (Android App Bundle), non APK

# Se hai APK, converti in AAB con PWABuilder o bundletool:
java -jar bundletool-all.jar build-bundle \
  --modules=base.zip \
  --output=segnapunti.aab

# Upload:
→ Upload AAB file
→ Segnapunti-v1.0.0.aab

- Release name: 1.0.0 (1)
- Release notes (IT):
  "🎉 Prima versione di Segnapunti!

  ✨ Traccia punteggi per tutti i tuoi giochi da tavolo
  📊 Statistiche dettagliate
  📥 Esporta in PDF/CSV
  🌙 Dark mode
  📱 Design mobile-first

  Buon divertimento! 🎲"

→ Save → Review release
```

### 7. Pricing & Distribution

```
Menu: Release → Pricing & Distribution

💰 Price:
- Free app: Yes

🌍 Countries:
- Available in: All countries (o selezione specifica)

🎯 Program opt-in:
- Google Play for Education: No (a meno che non sia educational)
- Designed for Families: No

📱 Device categories:
- Phone: ✅
- Tablet: ✅
- Wear OS: ❌
- Android TV: ❌
- Chromebook: ✅
- Android Auto: ❌

📢 Marketing opt-in:
- Promotional campaigns: (a tua scelta)

🔧 App access:
- All functionality available without special access: Yes

📧 Contact email:
- privacy@tntlabs.it

→ Save
```

### 8. Review e Submit

```
Menu: Publishing overview

✅ Verifica tutti i completati:
- Store listing: ✅
- Content rating: ✅
- Target audience: ✅
- Privacy & security: ✅
- Production release: ✅
- Pricing & distribution: ✅

→ Send for review

⏱️ Tempo review: 1-7 giorni (tipicamente 48-72 ore)
```

---

## 🎯 Step 8: Post-Pubblicazione

### Monitoraggio

```
Google Play Console → Dashboard

📊 Metriche da monitorare:
- Installazioni attive
- Valutazioni e recensioni
- Crash reports
- ANR (Application Not Responding)
- Performance metrics
```

### Aggiornamenti Futuri

```bash
# 1. Aggiorna versione in manifest.json
{
  "version": "1.1.0",
  "version_code": 2
}

# 2. Aggiorna APP_VERSION in version.js
const APP_VERSION = '1.1.0';

# 3. Rebuild APK/AAB con PWABuilder o Bubblewrap
# 4. Upload nuova release su Google Play Console
# 5. Scrivi release notes
# 6. Submit review
```

---

## 📊 Timeline Stimata

| Fase | Tempo | Status |
|------|-------|--------|
| Setup HTTPS (Netlify) | 10 min | ⏳ |
| Privacy Policy upload | 5 min | ⏳ |
| Google Play account | 2 ore + 48h approval | ⏳ |
| Genera TWA con PWABuilder | 30 min | ⏳ |
| Firma APK + SHA-256 | 15 min | ⏳ |
| assetlinks.json deploy | 10 min | ⏳ |
| Store listing completo | 2-3 ore | ⏳ |
| **TOTALE** | **4-5 ore + 2-3 giorni review** | |

---

## ⚠️ Troubleshooting Comune

### Errore: "Digital asset links verification failed"

```bash
# Verifica:
1. assetlinks.json accessibile via HTTPS
2. SHA-256 fingerprint corretto (dal keystore PRODUZIONE)
3. package_name corrisponde esattamente
4. Nessun redirect o errore 404

# Test tool:
https://developers.google.com/digital-asset-links/tools/generator
```

### Errore: "Service worker not found"

```bash
# Verifica che service-worker.js sia accessibile:
https://segnapunti.tuodominio.com/service-worker.js

# Header corretti:
Content-Type: application/javascript
Cache-Control: no-cache
```

### Errore: "Manifest invalid"

```bash
# Verifica manifest.json:
https://segnapunti.tuodominio.com/manifest.json

# Valida con:
https://manifest-validator.appspot.com/
```

### App non si apre, mostra solo browser

```
Causa: assetlinks.json non configurato correttamente

Fix:
1. Verifica SHA-256 corrisponde al keystore di PRODUZIONE
2. Attendi 24-48 ore propagazione Google
3. Disinstalla e reinstalla app
4. Clear cache Google Play Services
```

---

## 📝 Checklist Finale Pre-Submit

```
[ ] ✅ App accessibile via HTTPS
[ ] ✅ Privacy Policy online e linkato
[ ] ✅ assetlinks.json deployato e verificato
[ ] ✅ SHA-256 fingerprint corretto
[ ] ✅ APK/AAB firmato con keystore produzione
[ ] ✅ BACKUP keystore salvato (3 copie!)
[ ] ✅ Store listing completo con screenshot
[ ] ✅ Content rating ottenuto
[ ] ✅ Data safety dichiarato
[ ] ✅ Test su dispositivo fisico Android
[ ] ✅ Test TWA funzionante (apre fullscreen senza browser UI)
[ ] ✅ Email di contatto funzionante
[ ] ✅ Tutti i link funzionanti (privacy, website, support)
```

---

## 🎉 Congratulazioni!

Una volta approvato, la tua app sarà disponibile su:

```
https://play.google.com/store/apps/details?id=com.tntlabs.segnapunti
```

Condividi il link con gli utenti e goditi le recensioni! 🚀

---

## 📚 Risorse Utili

- **Google Play Console:** https://play.google.com/console
- **PWA Builder:** https://www.pwabuilder.com/
- **Digital Asset Links Tool:** https://developers.google.com/digital-asset-links/tools/generator
- **Android Developer Guide:** https://developer.android.com/distribute/best-practices/launch
- **Bubblewrap Docs:** https://github.com/GoogleChromeLabs/bubblewrap
- **TWA Quick Start:** https://developers.google.com/web/android/trusted-web-activity/quick-start

---

**Hai bisogno di aiuto?** Contatta: privacy@tntlabs.it

**Buona pubblicazione! 🎊**
