# ✅ Pre-Submission Checklist - Google Play Store

**App**: Segnapunti v2.0.0
**Data**: 2026-01-08
**Target**: Prima pubblicazione Play Store

---

## 🔴 BLOCCHI CRITICI (Must-Have)

### 1. Build & Configurazione Android

- [ ] **Progetto Android inizializzato**
  - `android/` folder presente
  - `AndroidManifest.xml` esiste
  - Build debug funziona: `./gradlew assembleDebug`

- [ ] **Keystore produzione creato**
  - File `segnapunti-release.keystore` generato
  - Password annotata in password manager
  - **3 BACKUP** salvati (cloud + USB + altro)

- [ ] **build.gradle configurato**
  - `compileSdkVersion 34`
  - `targetSdkVersion 34` (CRITICO per Play Store 2024)
  - `minSdkVersion 23`
  - `versionCode 1`
  - `versionName "2.0.0"`
  - `signingConfigs.release` configurato
  - `ndk.abiFilters` include arm64-v8a (64-bit)

- [ ] **AAB genera correttamente**
  ```bash
  cd android && ./gradlew bundleRelease
  # Output: android/app/build/outputs/bundle/release/app-release.aab
  ```
  - AAB size < 50MB
  - Nessun errore di build

- [ ] **Versioning coerente**
  - `package.json`: version "2.0.0"
  - `README.md`: badge version 2.0.0
  - `StorageService.js`: version '2.0.0'
  - `android/app/build.gradle`: versionName "2.0.0"

---

### 2. Permissions & Privacy

- [ ] **AndroidManifest.xml pulito**
  - Nessuna `INTERNET` permission (app offline)
  - Max 2 permissions totali (VIBRATE ok, SYSTEM_ALERT_WINDOW debug only)
  - `allowBackup="false"`

- [ ] **Privacy Policy aggiornata**
  - URL: https://tnt-labs.github.io/Segnapunti/privacy-policy.html
  - Accessibile e online ✅
  - Sezione AdSense rimossa (o ads implementati)
  - Menziona AsyncStorage (non LocalStorage browser)
  - Contatti sviluppatore presenti

- [ ] **manifest.json ads permission coerente**
  - Se NO ads → Rimuovere `AD_ID` permission
  - Se SÌ ads → Implementare react-native-google-mobile-ads

- [ ] **Data Safety form preparato**
  - Risposta: "NO" raccolta dati
  - Tutti dati sono locali (AsyncStorage)
  - Nessuna condivisione terze parti

---

### 3. Accessibilità

- [ ] **accessibilityLabel aggiunto a TUTTI i controlli**
  - PlayerCard.js: pulsanti +/-
  - GameScreen.js: pulsanti azioni, header
  - SettingsScreen.js: preset cards, input, toggle
  - HistoryScreen.js: lista partite, pulsanti elimina
  - PresetManagerScreen.js: preset cards, pulsanti
  - AboutScreen.js: links
  - ScoreModal.js: quick scores, input

- [ ] **accessibilityRole specificato**
  - TouchableOpacity → `accessibilityRole="button"`
  - Headers → `accessibilityRole="header"`

- [ ] **Touch target size verificato**
  - Tutti i pulsanti ≥48dp touch area
  - Misurato con React DevTools

- [ ] **Testato con TalkBack**
  ```
  Settings → Accessibility → TalkBack → ON
  ```
  - Tutti elementi leggibili
  - Navigazione fluida
  - Descrizioni chiare

---

### 4. Store Assets

- [ ] **App Icon 512x512**
  - File: `Segnapunti512x512.png` ✅
  - 32-bit PNG con alpha
  - Size: ~135 KB ✅

- [ ] **Adaptive Icon XML**
  - Generato con Android Studio Image Asset
  - `res/mipmap-anydpi-v26/ic_launcher.xml` presente
  - Preview OK su circle/square/squircle shapes

- [ ] **Feature Graphic 1024x500** ⚠️ MANCANTE
  - Creato con Canva/Figma
  - Logo + testo "Segnapunti - Traccia Punteggi"
  - Gradient background (#4A148C → #212121)
  - Size < 1MB

- [ ] **Screenshots 1080x1920**
  - Minimo 6 screenshot (attualmente 3)
  - Ratio 9:16 standard Android
  - Coprono: Setup, Partita, Storico, Preset, Dark Mode, About

- [ ] **Video Promo** (opzionale)
  - 30-60 secondi
  - Uploaded YouTube (unlisted)
  - Link pronto per Play Console

- [ ] **Store Description pronta**
  - Short (80 char): "Traccia punteggi per giochi di carte, sport e tavolo. Offline e senza ads!"
  - Full (4000 char): [vedi PLAY_STORE_TODO.md sezione 7]
  - SEO keywords inclusi

---

### 5. Testing

- [ ] **Unit Tests scritti e passano**
  ```bash
  npm test -- --coverage
  ```
  - GameContext.test.js
  - StorageService.test.js
  - presets.test.js
  - Coverage ≥60%

- [ ] **Testato su 5+ dispositivi reali**
  - Android 9, 10, 11, 12, 13/14
  - Phone + Tablet
  - Low-end + High-end
  - 100% checklist passati su tutti

- [ ] **Edge cases testati**
  - Rotazione schermo → stato preservato
  - Interruzioni (call, notifiche) → riprende OK
  - Low memory → no crash
  - 100+ partite salvate → no lag

- [ ] **Performance verificata**
  - Cold start < 3 secondi
  - 60fps navigation
  - Memory < 100MB
  - Nessun ANR (Application Not Responding)

- [ ] **Error Boundary implementato**
  - Componente ErrorBoundary creato
  - Wrappa App.js
  - UI fallback invece di white screen

---

### 6. Legal & Compliance

- [ ] **License verificata**
  - LICENSE file presente (Apache 2.0) ✅
  - Tutte dependencies MIT/Apache (nessuna GPL)

- [ ] **Third-party licenses documentate**
  ```bash
  npx license-checker --html --out licenses.html
  ```
  - Lista generata
  - Link in AboutScreen o deployed online

- [ ] **Terms of Service** (opzionale ma raccomandato)
  - File creato: `terms-of-service.html`
  - Deployed su GitHub Pages
  - Link in AboutScreen

- [ ] **Contatti sviluppatore funzionanti**
  - Email: tntlabs.ita@gmail.com ✅
  - Risponde entro 48h

---

### 7. Play Console Setup

- [ ] **Account Google Play Developer**
  - Registrato su play.google.com/console
  - Fee $25 pagata
  - Email verificata
  - Profilo completo (nome, indirizzo, telefono)
  - Stato: "Active"

- [ ] **App creata in Play Console**
  - App name: "Segnapunti - Punteggi Giochi"
  - Default language: Italiano
  - App type: App (non game)
  - Free app: Yes

- [ ] **Store Listing completo**
  - All assets uploaded (icon, feature graphic, screenshots)
  - Short description (80 char)
  - Full description (≤4000 char)
  - App category: Produttività
  - Contact email: tntlabs.ita@gmail.com
  - Privacy Policy URL: https://tnt-labs.github.io/Segnapunti/privacy-policy.html

- [ ] **Content Rating completato**
  - Questionnaire compilato
  - Rating ottenuto: PEGI 3 / Everyone
  - Certificato scaricato

- [ ] **Data Safety completato**
  - "No data collected" dichiarato
  - Encryption in transit: N/A
  - Can users request deletion: Yes

- [ ] **Pricing & Distribution**
  - Countries: All (o selezione)
  - Devices: Phone + Tablet + Chromebook
  - Age restrictions: None

---

## 🟠 RACCOMANDAZIONI FORTI (Should-Have)

### Codice

- [ ] **Dependencies aggiornate**
  ```bash
  npm audit fix
  # Vulnerabilities: 0 critical, 0 high
  ```

- [ ] **ProGuard rules custom**
  - File: `android/app/proguard-rules.pro`
  - Keep rules per AsyncStorage, Navigation, VectorIcons

- [ ] **Input validation**
  - Nomi giocatori: max 30 char, sanitized
  - Punteggi: bounds ±999999
  - Preset custom: validati prima di save

### Testing

- [ ] **Internal Testing Track usato**
  - AAB uploaded su Internal track
  - 5-10 tester interni aggiunti
  - Testato per 3-7 giorni
  - Bug critici fixati

- [ ] **Pre-launch Report ottenuto**
  - Google testa su ~20 dispositivi automaticamente
  - Report analizzato
  - Issue critici risolti

### Docs

- [ ] **README aggiornato**
  - Versione sincronizzata
  - Link Play Store aggiunto (dopo publish)
  - Badge "Get it on Google Play"

- [ ] **CHANGELOG creato**
  - File: `CHANGELOG.md`
  - Versione 2.0.0 documentata

---

## 🟡 NICE-TO-HAVE (Could-Have)

- [ ] **Traduzione Inglese**
  - Doppio mercato potenziale
  - i18n configurato
  - Tutte stringhe tradotte

- [ ] **Video Promo**
  - +20-30% conversion rate
  - 30-60 secondi
  - Uploaded e linkato

- [ ] **Crashlytics integration**
  - Firebase Crashlytics configurato
  - Crash reports real-time
  - Privacy Policy aggiornata

- [ ] **Analytics**
  - Firebase Analytics
  - Event tracking (partita iniziata, preset usato)
  - Privacy compliance

- [ ] **More screenshots**
  - 8 screenshot (max consentiti)
  - Screenshot tablet dedicati

---

## 📋 SUBMISSION FLOW

### Step 1: Upload AAB

```bash
Play Console → App → Releases → Production → Create new release

Upload: android/app/build/outputs/bundle/release/app-release.aab

Release name: 2.0.0 (1)
Release notes (IT):
  🎉 Prima Release Pubblica di Segnapunti!

  ✨ Traccia punteggi per tutti i tuoi giochi preferiti:
  • 10 preset predefiniti (Scala 40, Burraco, Scopa, Poker...)
  • 4 modalità di gioco (Max, Min, Rounds, Darts)
  • Storico partite completo
  • Dark mode elegante
  • 100% offline, zero ads

  📱 App nativa React Native ottimizzata per Android

  Buon divertimento! 🎲

Save → Review release
```

### Step 2: Staged Rollout Configuration

```
Release → Production → Managed Publishing

Rollout percentage:
✅ Start with 5%

Timeline:
Day 1-2:   5% users  → Monitor crash rate
Day 3-5:   20% users → Monitor reviews
Day 6-8:   50% users → Final checks
Day 9+:    100% users → Full release
```

### Step 3: Submit for Review

```
Play Console → Publishing overview

Verify all green checkmarks:
✅ Store listing
✅ Content rating
✅ Target audience
✅ Privacy & security
✅ Production release
✅ Pricing & distribution

Button: "Send for review"
```

### Step 4: Wait for Approval

```
⏳ Review time: 1-7 days (typically 48-72h)

Monitor:
- Play Console → Dashboard → Review status
- Email notifications

If rejected:
- Read feedback carefully
- Fix issues
- Resubmit
```

### Step 5: Post-Launch Monitoring

```
First 48 hours - CRITICAL:

Check every 6h:
- Crash rate (target: <0.5%)
- ANR rate (target: <0.1%)
- Reviews (respond within 24h)
- Ratings (target: ≥4.0)

If crash rate >2%:
→ HALT ROLLOUT IMMEDIATELY
→ Investigate with stack traces
→ Fix and resubmit
```

---

## ⚠️ COMMON REJECTION REASONS

### ❌ Da Evitare

1. **Permissions non giustificate**
   - ❌ INTERNET permission per app offline
   - ✅ Rimuovere o giustificare

2. **Privacy Policy mancante/non conforme**
   - ❌ Policy generica/template
   - ✅ Specifica per la tua app

3. **targetSdkVersion troppo vecchio**
   - ❌ targetSdk < 33
   - ✅ targetSdk = 34

4. **Assets mancanti**
   - ❌ Feature graphic missing
   - ✅ Tutti assets obbligatori presenti

5. **Crash at startup**
   - ❌ App crasha su Pre-launch Report
   - ✅ Testare su Internal track prima

6. **Content mismatched**
   - ❌ Screenshots di altra app
   - ✅ Screenshots genuine dell'app

7. **Gambling content frainteso**
   - ❌ "Gioca a Poker per soldi"
   - ✅ "Tieni il punteggio delle mani di Poker"

---

## 🎯 FINAL VERIFICATION (5 min prima di submit)

### Quick Sanity Check

```bash
# 1. AAB esiste e è firmato
ls -lh android/app/build/outputs/bundle/release/app-release.aab
# Expected: ~25-35 MB

# 2. AAB installabile
bundletool build-apks --bundle=app-release.aab --output=test.apks
bundletool install-apks --apks=test.apks
# App si apre senza crash

# 3. Versioning corretto
grep -r "2.0.0" package.json README.md android/app/build.gradle
# Tutti devono mostrare 2.0.0

# 4. Privacy Policy online
curl -I https://tnt-labs.github.io/Segnapunti/privacy-policy.html
# HTTP 200 OK

# 5. Assets pronti
ls -lh feature-graphic.png screenshots/*.png Segnapunti512x512.png
# Tutti files presenti

# 6. Play Console ready
# Login → All green checkmarks → Ready to publish
```

---

## 📞 SUPPORT CONTACTS

### Se Bloccato

**Google Play Support**
- Help Center: https://support.google.com/googleplay/android-developer
- Contact: Play Console → Help → Contact Support
- Response time: 24-48h

**React Native Community**
- Discord: https://discord.gg/react-native
- Stack Overflow: [react-native] tag
- GitHub: https://github.com/facebook/react-native/issues

**Segnapunti Specific**
- Email: tntlabs.ita@gmail.com
- GitHub Issues: https://github.com/TNT-Labs/Segnapunti/issues

---

## 🎉 AFTER APPROVAL

### Day 1 Post-Launch

- [ ] **Announce on social media**
  - Twitter, Facebook, LinkedIn
  - Screenshot store listing
  - Link: play.google.com/store/apps/details?id=com.tntlabs.segnapunti

- [ ] **Update README with Play Store badge**
  ```markdown
  [![Get it on Google Play](https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png)](https://play.google.com/store/apps/details?id=com.tntlabs.segnapunti)
  ```

- [ ] **Monitor dashboard obsessively**
  - First 100 installs critical
  - Respond to ALL reviews (good and bad)
  - Fix bugs immediately

### Week 1 Post-Launch

- [ ] **Gather user feedback**
  - Read all reviews
  - Check crash reports
  - Create issues for bugs

- [ ] **Plan v2.0.1 hotfix** (if needed)
  - Critical bugs only
  - Increment versionCode to 2

### Month 1 Post-Launch

- [ ] **Analyze metrics**
  - Install/uninstall rate
  - Retention (1-day, 7-day, 30-day)
  - Crash-free rate
  - Average rating

- [ ] **Plan next features**
  - Based on user requests
  - v2.1.0 roadmap

---

## ✅ SIGN-OFF

**Before clicking "Submit for Review", confirm:**

```
I, _________________ (name), confirm that:

✅ All MUST-HAVE items are completed
✅ App tested on 5+ real devices
✅ No critical bugs known
✅ Keystore backed up in 3 locations
✅ Privacy Policy is accurate and online
✅ Store listing is complete and accurate
✅ I understand rejection is possible and fixable
✅ I'm ready to monitor and respond to users

Signed: ________________
Date: __________________
```

---

**Buona Fortuna! 🚀**

---

**Versione Checklist**: 1.0
**Data**: 2026-01-08
**Generato da**: Claude Code AI

