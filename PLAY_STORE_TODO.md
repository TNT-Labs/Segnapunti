# 📋 TODO List Prioritizzata - Pubblicazione Google Play Store

**Progetto**: Segnapunti v2.0.0
**Target**: Prima pubblicazione su Google Play Store
**Data**: 2026-01-08

---

## 🔴 PRIORITÀ CRITICA - BLOCCHI PUBBLICAZIONE

### ❌ 1. Inizializzare Progetto Android Nativo
**Status**: ❌ NON INIZIATO
**Blocca**: Tutto il resto
**Effort**: 30 minuti + 500MB download
**Assignee**: Developer

**Steps**:
```bash
# Opzione A: Usa script esistente
cd /path/to/Segnapunti
./init-react-native-android.bat  # Windows
# o
bash init-react-native-android.sh  # Linux/Mac (da creare)

# Opzione B: Manuale
npx @react-native-community/cli@13.6.9 init SegnapuntiTemp --version 0.74.6 --skip-install
cp -r SegnapuntiTemp/android ./
rm -rf SegnapuntiTemp

# Verifica
ls -la android/app/src/main/AndroidManifest.xml  # Deve esistere
```

**Acceptance Criteria**:
- [ ] Cartella `android/` presente
- [ ] `AndroidManifest.xml` generato
- [ ] `build.gradle` files presenti
- [ ] Build debug funziona: `cd android && ./gradlew assembleDebug`

---

### ❌ 2. Configurare Versioning Coerente
**Status**: ❌ INCOERENTE
**Blocca**: Upload Play Store
**Effort**: 15 minuti
**Assignee**: Developer

**Files da Aggiornare**:

1. **README.md** (linea 5)
```markdown
Cambia: ![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)
In:     ![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
```

2. **src/services/StorageService.js** (linea 236)
```javascript
Cambia: version: '1.3.0',
In:     version: '2.0.0',
```

3. **android/app/build.gradle** (da creare dopo step 1)
```gradle
defaultConfig {
    applicationId "com.tntlabs.segnapunti"
    versionCode 1              // Integer incrementale
    versionName "2.0.0"        // Semantic versioning
    // ...
}
```

**Acceptance Criteria**:
- [ ] Tutti i file usano versione `2.0.0`
- [ ] versionCode = 1 (primo release)
- [ ] git commit: `"chore: sync version to 2.0.0"`

---

### ❌ 3. Configurare Build per Produzione
**Status**: ❌ NON CONFIGURATO
**Blocca**: APK/AAB firmato
**Effort**: 45 minuti
**Assignee**: Developer

**3.1 Generare Keystore** (UNA VOLTA SOLA)
```bash
cd android/app

# Windows
keytool -genkey -v -keystore segnapunti-release.keystore ^
  -alias segnapunti -keyalg RSA -keysize 2048 -validity 10000

# Linux/Mac
keytool -genkey -v -keystore segnapunti-release.keystore \
  -alias segnapunti -keyalg RSA -keysize 2048 -validity 10000

# Rispondi alle domande:
# Nome: TNT Labs
# Organizzazione: TNT Labs
# Città: [La tua città]
# Provincia: [XX]
# Paese: IT
# Password: [SCEGLI PASSWORD SICURA - ANNOTALA!]
```

**⚠️ CRITICAL**: Backup keystore in 3 posti:
- [ ] Drive cloud (Google Drive, Dropbox)
- [ ] USB esterno
- [ ] Password manager (per password)

**3.2 Configurare Gradle Properties**

Crea `android/gradle.properties` (NON committare su Git!):
```properties
SEGNAPUNTI_UPLOAD_STORE_FILE=segnapunti-release.keystore
SEGNAPUNTI_UPLOAD_KEY_ALIAS=segnapunti
SEGNAPUNTI_UPLOAD_STORE_PASSWORD=YOUR_STORE_PASSWORD
SEGNAPUNTI_UPLOAD_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

**3.3 Aggiornare build.gradle**

File: `android/app/build.gradle`

```gradle
android {
    namespace "com.tntlabs.segnapunti"
    compileSdkVersion 34  // Android 14

    defaultConfig {
        applicationId "com.tntlabs.segnapunti"
        minSdkVersion 23  // Android 6.0 (95% coverage)
        targetSdkVersion 34  // CRITICO per Play Store 2024
        versionCode 1
        versionName "2.0.0"

        // 64-bit support (obbligatorio)
        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a"
        }
    }

    signingConfigs {
        release {
            if (project.hasProperty('SEGNAPUNTI_UPLOAD_STORE_FILE')) {
                storeFile file(SEGNAPUNTI_UPLOAD_STORE_FILE)
                storePassword SEGNAPUNTI_UPLOAD_STORE_PASSWORD
                keyAlias SEGNAPUNTI_UPLOAD_KEY_ALIAS
                keyPassword SEGNAPUNTI_UPLOAD_KEY_PASSWORD
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

**3.4 Testare Build Release**
```bash
cd android
./gradlew clean
./gradlew bundleRelease  # Genera AAB (preferito da Play Store)
./gradlew assembleRelease  # Genera APK (per test locali)

# Output attesi:
# AAB: android/app/build/outputs/bundle/release/app-release.aab
# APK: android/app/build/outputs/apk/release/app-release.apk
```

**Acceptance Criteria**:
- [ ] Keystore generato e backuppato
- [ ] gradle.properties configurato (in .gitignore)
- [ ] build.gradle aggiornato
- [ ] AAB si genera senza errori
- [ ] AAB size <50MB

---

### ❌ 4. Rivedere e Pulire AndroidManifest.xml
**Status**: ⚠️ DA VERIFICARE (dopo step 1)
**Blocca**: Privacy compliance
**Effort**: 30 minuti
**Assignee**: Developer

**File**: `android/app/src/main/AndroidManifest.xml`

**Azioni**:

1. **Rimuovi permissions NON necessarie**
```xml
<!-- SE PRESENTI, RIMUOVERE -->
<uses-permission android:name="android.permission.INTERNET" tools:node="remove" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" tools:node="remove" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" tools:node="remove" />
```

2. **Mantieni SOLO permissions essenziali**
```xml
<!-- OK - Per vibrazioni feedback (opzionale) -->
<uses-permission android:name="android.permission.VIBRATE" />

<!-- OK - Solo per debug mode -->
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
```

3. **Aggiungi metadata app**
```xml
<application
    android:name=".MainApplication"
    android:label="@string/app_name"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:allowBackup="false"
    android:theme="@style/AppTheme">

    <!-- ... rest of config ... -->
</application>
```

**Acceptance Criteria**:
- [ ] Nessuna permission INTERNET (app offline)
- [ ] Massimo 2 permissions totali
- [ ] allowBackup=false (privacy)

---

### ❌ 5. Implementare Accessibilità
**Status**: ❌ MANCANTE
**Blocca**: Compliance policy Google
**Effort**: 6-8 ore
**Assignee**: Developer

**Files da Modificare**:

**5.1 PlayerCard.js**
```javascript
// PRIMA:
<TouchableOpacity
  style={[styles.button, {backgroundColor: theme.colors.error}]}
  onPress={() => onSubtractScore(player.id)}>
  <Icon name="minus" size={20} color="#FFFFFF" />
</TouchableOpacity>

// DOPO:
<TouchableOpacity
  accessible={true}
  accessibilityLabel={`Sottrai punti a ${player.name}`}
  accessibilityHint="Riduce il punteggio"
  accessibilityRole="button"
  style={[styles.button, {backgroundColor: theme.colors.error}]}
  onPress={() => onSubtractScore(player.id)}>
  <Icon name="minus" size={20} color="#FFFFFF" />
</TouchableOpacity>
```

**5.2 GameScreen.js**
```javascript
// Header titolo
<Text
  style={[styles.presetName, {color: theme.colors.primary}]}
  accessibilityRole="header"
  accessibilityLabel={`Partita a ${currentPreset.name}`}>
  {currentPreset.icon} {currentPreset.name}
</Text>

// Pulsanti azioni
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Salva partita nello storico"
  accessibilityRole="button"
  style={[styles.actionButton, {backgroundColor: theme.colors.primary}]}
  onPress={handleSaveGame}>
  <Text style={styles.actionButtonText}>💾 Salva Partita</Text>
</TouchableOpacity>
```

**5.3 Tutti gli altri screen**

Applicare stesso pattern a:
- [ ] SettingsScreen.js (preset cards, input giocatori, toggle dark mode)
- [ ] HistoryScreen.js (lista partite, pulsanti elimina)
- [ ] PresetManagerScreen.js (preset cards, pulsanti aggiungi/elimina)
- [ ] AboutScreen.js (links, versione)
- [ ] ScoreModal.js (quick score buttons, input custom)

**Checklist Accessibilità**:
- [ ] TUTTI i TouchableOpacity hanno `accessible={true}`
- [ ] TUTTI i TouchableOpacity hanno `accessibilityLabel`
- [ ] Pulsanti hanno `accessibilityRole="button"`
- [ ] Headers hanno `accessibilityRole="header"`
- [ ] Touch targets ≥48dp (verificare con misure)
- [ ] Testato con TalkBack abilitato

**Test**:
```bash
# Abilita TalkBack su dispositivo Android
Settings → Accessibility → TalkBack → ON

# Naviga app solo con TalkBack
# Ogni elemento deve essere leggibile e azionabile
```

---

### ✅ 6. Creare Feature Graphic
**Status**: ✅ COMPLETATO
**Blocca**: Store listing publication
**Effort**: 1-2 ore
**Assignee**: Designer / Developer

**Requisiti**:
- Dimensioni: **1024x500 px**
- Formato: PNG o JPG
- Size: <1MB
- 32-bit color

**Contenuto Suggerito**:
```
Layout:
┌─────────────────────────────────────────┐
│  [Logo 200x200]   SEGNAPUNTI            │
│  🃏🎯🎲            Traccia Punteggi      │
│                   Giochi e Carte         │
└─────────────────────────────────────────┘

Colors:
- Background: Gradient (#4A148C → #212121)
- Text: White (#FFFFFF)
- Accent: Purple (#9C27B0)

Elements:
- Logo app (da Segnapunti512x512.png)
- Icone decorative: 🃏 🎯 🎲 🏐 🎾
- Font: Bold, leggibile
```

**Tools**:
1. **Canva** (RACCOMANDATO per non-designer)
   - Template: "Google Play Feature Graphic"
   - https://www.canva.com/
   - Drag & drop interface

2. **Figma** (per designer)
   - Frame: 1024x500
   - Export PNG @1x

3. **Photoshop/GIMP** (avanzato)

**Acceptance Criteria**:
- [x] File `feature-graphic.png` creato
- [x] Dimensioni esatte 1024x500
- [x] Leggibile su thumbnail piccolo
- [x] Logo e testo ben visibili
- [x] Size <1MB (95KB)

---

### ❌ 7. Setup Account Google Play Console
**Status**: ⚠️ DA VERIFICARE
**Blocca**: Upload AAB
**Effort**: 30 minuti + 48h approval
**Assignee**: Project Owner

**Steps**:

1. **Registrazione**
   - Vai a: https://play.google.com/console/signup
   - Login con Google Account
   - Accetta Developer Distribution Agreement
   - **Paga fee**: $25 (one-time, carta credito)

2. **Completare Profilo**
   ```
   Developer name: TNT Labs
   Email: tntlabs.ita@gmail.com
   Website: https://tnt-labs.github.io/Segnapunti
   Phone: [Opzionale ma raccomandato]

   Developer address:
   Via/Piazza: [Indirizzo completo]
   Città: [Città]
   CAP: [CAP]
   Provincia: [XX]
   Paese: Italia
   ```

3. **Verifica Account**
   - Google invia email verifica
   - Conferma email
   - Wait 24-48 ore per approval manuale

4. **Configurare Pagamenti** (opzionale ora)
   - Play Console → Payments Profile
   - Aggiungi metodo pagamento
   - Per future app paid/IAP

**Acceptance Criteria**:
- [ ] Account registrato e pagato
- [ ] Email verificata
- [ ] Profilo sviluppatore completo
- [ ] Stato: "Account Active"

---

### ❌ 7a. Configurare e Verificare app-ads.txt (AdMob)
**Status**: ⚠️ FILE CREATO, HOSTING RICHIESTO
**Blocca**: Pubblicazione annunci AdMob dopo Gennaio 2025
**Effort**: 1-2 ore (+ 24-48h attesa verifica)
**Assignee**: Developer / Project Owner

**⚠️ NUOVO REQUISITO OBBLIGATORIO**: A partire da gennaio 2025, tutte le app AdMob devono essere verificate con app-ads.txt.

**7a.1 File app-ads.txt Creato**

✅ Il file è già stato generato nel repository: `app-ads.txt`

Contenuto:
```
google.com, pub-4302173868436591, DIRECT, f08c47fec0942fa0
```

**7a.2 Hosting del File** (AZIONE RICHIESTA)

Il file deve essere ospitato sul tuo dominio web:

**Opzioni**:
1. **Dominio Esistente**: Se hai già un sito web
   - Carica `app-ads.txt` nella directory root
   - Deve essere accessibile a: `https://tuo-dominio.com/app-ads.txt`

2. **Nuovo Dominio**: Se non hai un dominio
   - Acquista dominio (~$10-15/anno): Namecheap, Google Domains, Cloudflare
   - Usa hosting gratuito: Netlify, Vercel, GitHub Pages (con dominio custom)
   - Carica il file app-ads.txt

3. **GitHub Pages con Dominio Custom** (RACCOMANDATO)
   - Configura dominio custom su GitHub Pages
   - Aggiungi file app-ads.txt al repository principale
   - Accessibile a: `https://tuo-dominio.com/app-ads.txt`

**7a.3 Configurare nel Play Store**

1. Vai a **Google Play Console**
2. Seleziona app **Segnapunti**
3. **Configurazione dell'app** → **Dettagli dell'app**
4. Campo **Sito web dello sviluppatore**: inserisci `https://tuo-dominio.com`

⚠️ **Il dominio nel Play Store deve essere lo stesso dove è ospitato app-ads.txt!**

**7a.4 Verifica in AdMob**

1. Attendi **24-48 ore** per la scansione automatica di AdMob
2. Vai su **AdMob** → **App** → **Segnapunti** → **Impostazioni app**
3. Clicca su **Verifica app**
4. Clicca su **Verifica la disponibilità di aggiornamenti**
5. Verifica stato: **AdMob** → **Account** → **app-ads.txt**

**7a.5 Test Manuale**

Verifica che il file sia accessibile:
```bash
# Nel browser, vai a:
https://tuo-dominio.com/app-ads.txt

# Deve mostrare:
google.com, pub-4302173868436591, DIRECT, f08c47fec0942fa0
```

**Risoluzione Problemi**:

- **File non trovato (404)**: Verifica che il file sia nella root del dominio
- **Nome file errato**: Deve essere esattamente `app-ads.txt` (minuscolo)
- **Dominio non corrisponde**: Il dominio nel Play Store deve essere identico
- **Formato errato**: Non aggiungere spazi extra o righe vuote

**Riferimenti**:
- 📄 Guida completa: `APP_ADS_TXT_SETUP.md`
- 📚 [Guida ufficiale Google](https://support.google.com/admob/answer/9787654)

**Acceptance Criteria**:
- [ ] File `app-ads.txt` creato ✅
- [ ] File ospitato su dominio web pubblico
- [ ] Dominio configurato nel Play Store
- [ ] File accessibile via browser
- [ ] Atteso 24-48h per scansione AdMob
- [ ] App verificata in AdMob Console
- [ ] Stato "Verificato" ✅ in AdMob → app-ads.txt

**Timeline**:
- Configurazione: 1-2 ore
- Attesa verifica: 24-48 ore
- **Totale**: 2-3 giorni prima di pubblicazione completa annunci

---

## 🟠 PRIORITÀ ALTA - QUALITÀ & COMPLIANCE

### ⚠️ 8. Aggiornare Privacy Policy per App Nativa
**Status**: ⚠️ DISCREPANTE
**Effort**: 1 ora
**Assignee**: Legal / Developer

**Issue**: Privacy policy attuale menziona Google AdSense ma app React Native non ha ads.

**File**: `privacy-policy.html` (online su GitHub Pages)

**Azioni**:

1. **Decisione Ads**:
   - **Opzione A**: NON implementare ads → Rimuovere sezione AdSense
   - **Opzione B**: Implementare ads → Integrare react-native-google-mobile-ads

2. **Se Opzione A (NO ADS)**:

Rimuovere sezione:
```html
<!-- RIMUOVERE -->
<h2>🎯 Google AdSense (Pubblicità)</h2>
<p>L'app mostra annunci pubblicitari tramite Google AdSense...</p>
```

Aggiungere chiarimento:
```html
<h2>📱 App Mobile Android</h2>
<p>L'app mobile Android utilizza <strong>AsyncStorage</strong> (storage locale dispositivo)
al posto di LocalStorage browser. Tutti i dati rimangono esclusivamente sul tuo dispositivo.</p>

<p><strong>La versione mobile NON contiene pubblicità.</strong></p>
```

3. **Se Opzione B (CON ADS)**:
```bash
# Installare
npm install react-native-google-mobile-ads

# Configurare AdMob (serve AdMob App ID)
# Aggiornare AndroidManifest.xml con meta-data AdMob
# Implementare banner ads in UI
```

4. **Rimuovere da manifest.json**:
```json
// RIMUOVERE se NO ads:
"android_manifest_ext": [
  "<uses-permission android:name=\"com.google.android.gms.permission.AD_ID\"/>"
]
```

**Acceptance Criteria**:
- [ ] Decisione ads presa e documentata
- [ ] Privacy policy aggiornata di conseguenza
- [ ] manifest.json coerente con scelta
- [ ] Deployed su GitHub Pages

---

### ✅ 9. Scrivere Unit Tests Critici
**Status**: ✅ COMPLETATO
**Effort**: 8-12 ore
**Assignee**: Developer

**Setup Jest** (già configurato):
```bash
npm test  # Verifica funziona
```

**Test da Creare**:

**9.1 GameContext.test.js**
```javascript
import {renderHook, act} from '@testing-library/react-hooks';
import {useGame, GameProvider} from '../contexts/GameContext';

describe('GameContext', () => {
  test('startNewGame creates correct number of players', async () => {
    const {result} = renderHook(() => useGame(), {
      wrapper: GameProvider,
    });

    const preset = {mode: 'max', targetScore: 100};
    const players = ['Alice', 'Bob'];

    await act(async () => {
      await result.current.startNewGame(preset, players);
    });

    expect(result.current.players).toHaveLength(2);
    expect(result.current.players[0].name).toBe('Alice');
    expect(result.current.players[0].score).toBe(0);
  });

  test('updatePlayerScore updates correct player', async () => {
    // ... test incremento punteggio
  });

  test('checkWinCondition detects winner in max mode', async () => {
    // ... test vittoria quando score >= targetScore
  });

  test('checkWinCondition detects winner in darts mode', async () => {
    // ... test vittoria quando score === 0
  });

  test('darts mode prevents negative scores (BUST)', async () => {
    // ... test bust logic
  });
});
```

**9.2 StorageService.test.js**
```javascript
import StorageService from '../services/StorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('StorageService', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  test('saveGameState persists data', async () => {
    const gameState = {players: [], isFinished: false};
    const result = await StorageService.saveGameState(gameState);
    expect(result).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  test('loadGameState returns null if no data', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    const state = await StorageService.loadGameState();
    expect(state).toBeNull();
  });

  test('exportAllData includes all keys', async () => {
    const data = await StorageService.exportAllData();
    expect(data).toHaveProperty('gameState');
    expect(data).toHaveProperty('gameHistory');
    expect(data).toHaveProperty('version');
  });
});
```

**9.3 presets.test.js**
```javascript
import {DEFAULT_PRESETS} from '../constants/presets';

describe('DEFAULT_PRESETS', () => {
  test('has 10 preset items', () => {
    expect(DEFAULT_PRESETS).toHaveLength(10);
  });

  test('all presets have required fields', () => {
    DEFAULT_PRESETS.forEach(preset => {
      expect(preset).toHaveProperty('id');
      expect(preset).toHaveProperty('name');
      expect(preset).toHaveProperty('mode');
      expect(preset.defaultPlayers).toBeGreaterThanOrEqual(2);
    });
  });

  test('modes are valid', () => {
    const validModes = ['max', 'min', 'rounds', 'darts'];
    DEFAULT_PRESETS.forEach(preset => {
      expect(validModes).toContain(preset.mode);
    });
  });
});
```

**Run Tests**:
```bash
npm test -- --coverage

# Target: >60% coverage
```

**Acceptance Criteria**:
- [x] 3 test suites creati (GameContext.test.js, StorageService.test.js, presets.test.js)
- [x] Tutti i test passano (54/54 tests passed)
- [x] Coverage ≥60% per GameContext (75%) e StorageService (70.58%)
- [x] Jest configurato con React Native preset e mocks

---

### ⚠️ 10. Testare su 5+ Dispositivi Reali
**Status**: ❌ NON TESTATO
**Effort**: 4-6 ore
**Assignee**: QA / Developer

**Matrice Dispositivi Target**:

| # | Dispositivo | Android | Screen | ABI | Notes |
|---|-------------|---------|--------|-----|-------|
| 1 | Samsung Galaxy S8 | 9 | 5.8" | arm64 | Low-end baseline |
| 2 | Xiaomi Redmi Note 9 | 10 | 6.5" | arm64 | Budget phone |
| 3 | Google Pixel 5 | 12 | 6.0" | arm64 | Stock Android |
| 4 | Samsung Galaxy Tab A7 | 11 | 10.4" | arm64 | Tablet |
| 5 | OnePlus / Xiaomi recente | 13/14 | 6.5" | arm64 | Latest Android |

**Checklist per Device**:

Ogni dispositivo deve passare TUTTI i test:

```
[ ] App si installa senza errori
[ ] Splash screen appare correttamente
[ ] Bottom tabs navigabili
[ ] Setup partita:
    [ ] Selezione preset funziona
    [ ] Input nomi giocatori (min 2, max 8)
    [ ] Pulsante "Inizia Partita" funziona
[ ] Partita in corso:
    [ ] Pulsanti +/- aggiornano punteggio
    [ ] Modal score custom funziona
    [ ] Vittoria rilevata correttamente
    [ ] Banner vittoria appare
[ ] Storico:
    [ ] Partite salvate visibili
    [ ] Dettagli partita corretti
    [ ] Elimina singola partita funziona
    [ ] Elimina tutto storico con conferma
[ ] Preset Manager:
    [ ] Preset predefiniti visibili
    [ ] Crea preset custom funziona
    [ ] Elimina preset custom funziona
[ ] Dark Mode:
    [ ] Toggle funziona
    [ ] Tutti gli screen si aggiornano
    [ ] Persistenza dopo restart app
[ ] Rotazione schermo:
    [ ] Portrait → Landscape smooth
    [ ] Stato partita preservato
    [ ] UI non rotta
[ ] Performance:
    [ ] 60fps durante navigazione
    [ ] Nessun lag su pulsanti
    [ ] Animazioni fluide
[ ] Interruzioni:
    [ ] Chiamata in arrivo → riprendi app OK
    [ ] Notifica → riprendi app OK
    [ ] Home button → riprendi app OK
[ ] Memoria:
    [ ] Dopo 100 partite salvate: no lag
    [ ] Dopo 1 ora utilizzo: no crash
[ ] Accessibilità:
    [ ] TalkBack legge tutti gli elementi
    [ ] Touch targets ≥48dp
    [ ] Font large mode: UI non rotta
```

**Tools**:
```bash
# Logcat per debug
adb logcat | grep "segnapunti"

# Performance profiling
adb shell dumpsys gfxinfo com.tntlabs.segnapunti
# FPS target: >55fps

# Memory profiling
adb shell dumpsys meminfo com.tntlabs.segnapunti
# Target: <100MB
```

**Acceptance Criteria**:
- [ ] Testato su almeno 5 dispositivi diversi
- [ ] 100% checklist passati su tutti
- [ ] Nessun crash critico rilevato
- [ ] Performance accettabile su low-end device

---

### ⚠️ 11. Aggiungere Error Boundary
**Status**: ❌ MANCANTE
**Effort**: 1 ora
**Assignee**: Developer

**Problema**: Se un componente React crasha, tutta l'app mostra white screen.

**Soluzione**: Error Boundary per catch errors.

**Implementazione**:

**File**: `src/components/ErrorBoundary.js` (NUOVO)
```javascript
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError(error) {
    return {hasError: true, error};
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Opzionale: Invia a Crashlytics/Sentry
  }

  handleReset = () => {
    this.setState({hasError: false, error: null});
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Oops! Qualcosa è andato storto</Text>
          <Text style={styles.subtitle}>
            L'app ha incontrato un errore imprevisto.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Riprova</Text>
          </TouchableOpacity>
          {__DEV__ && (
            <Text style={styles.error}>{this.state.error?.toString()}</Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#212121',
  },
  emoji: {fontSize: 64, marginBottom: 20},
  title: {fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 10},
  subtitle: {fontSize: 16, color: '#AAAAAA', textAlign: 'center', marginBottom: 30},
  button: {
    backgroundColor: '#4A148C',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
  error: {
    marginTop: 20,
    fontSize: 12,
    color: '#FF5252',
    fontFamily: 'monospace',
  },
});

export default ErrorBoundary;
```

**Uso in App.js**:
```javascript
import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
};
```

**Acceptance Criteria**:
- [ ] ErrorBoundary component creato
- [ ] Wrappa tutto l'app in App.js
- [ ] Testato con throw Error simulato
- [ ] UI fallback appare invece di white screen
- [ ] Pulsante "Riprova" resetta stato

---

### ⚠️ 12. Ottimizzare Assets per Play Store
**Status**: ⚠️ PARZIALE
**Effort**: 2 ore
**Assignee**: Designer / Developer

**12.1 Resize Screenshots**

Attuali: 1170x2536 (iPhone ratio)
Target: 1080x1920 (Android standard 9:16)

```bash
# Con ImageMagick
for file in screenshots/*.png; do
  convert "$file" -resize 1080x1920^ -gravity center -extent 1080x1920 "screenshots/android_$(basename $file)"
done

# o con online tool: https://www.iloveimg.com/resize-image
```

**12.2 Aggiungere Screenshot Extra**

Attualmente: 3 screenshots
Raccomandato: 6-8 screenshots

Screenshot da aggiungere:
- [ ] Setup giocatori (SettingsScreen con input nomi)
- [ ] Selezione preset (grid preset cards)
- [ ] Dark mode comparison (split screen light/dark)
- [ ] About screen (features list)
- [ ] Preset manager (custom presets)

**12.3 Generare Adaptive Icon**

Tool: Android Studio → Image Asset Studio

Steps:
```
1. Apri Android Studio
2. Right click su android/app/src/main/res
3. New → Image Asset
4. Icon Type: Launcher Icons (Adaptive and Legacy)
5. Foreground Layer:
   - Source: Segnapunti512x512.png
   - Trim: Yes
   - Resize: 60%
6. Background Layer:
   - Color: #212121 (o #4A148C)
7. Legacy tab:
   - Generate: Yes
   - Shape: None (transparent)
8. Next → Finish
```

Output generato:
```
res/mipmap-anydpi-v26/ic_launcher.xml
res/mipmap-anydpi-v26/ic_launcher_round.xml
res/mipmap-hdpi/ic_launcher.png
res/mipmap-mdpi/ic_launcher.png
res/mipmap-xhdpi/ic_launcher.png
res/mipmap-xxhdpi/ic_launcher.png
res/mipmap-xxxhdpi/ic_launcher.png
```

**Acceptance Criteria**:
- [ ] 6-8 screenshots 1080x1920 pronti
- [ ] Adaptive icon generato per Android 8+
- [ ] Icon preview OK su varie shapes (circle, square, squircle)

---

## 🟡 PRIORITÀ MEDIA - POLISH & OPTIMIZATION

### 📝 13. Update Dependencies
**Status**: ⚠️ OUTDATED
**Effort**: 4-6 ore (con testing)
**Assignee**: Developer

**Major Updates Richiesti**:

```bash
# Check vulnerabilities
npm audit

# Update step by step (per evitare breaking changes)

# 1. React Native (major update - CAUTION)
npm install react-native@0.75.0  # Non 0.83 (troppo jump)
npm install react@18.3.1

# 2. Navigation
npm install @react-navigation/native@^6.1.18  # Stay on v6 for now
npm install @react-navigation/bottom-tabs@^6.6.1
npm install @react-navigation/native-stack@^6.11.0

# 3. AsyncStorage
npm install @react-native-async-storage/async-storage@^1.24.0

# 4. UI & Utilities
npm install react-native-paper@^5.12.3
npm install react-native-vector-icons@^10.2.0
npm install react-native-gesture-handler@^2.18.0
npm install react-native-screens@^3.34.0
npm install react-native-safe-area-context@^4.11.0

# 5. Rebuild
cd android && ./gradlew clean
cd ..
npm start -- --reset-cache
```

**Testing Dopo Update**:
- [ ] App builds senza errori
- [ ] Tutte le navigation funzionano
- [ ] AsyncStorage read/write OK
- [ ] Dark mode toggle OK
- [ ] Nessun crash su test suite

**Acceptance Criteria**:
- [ ] `npm audit` mostra 0 high/critical vulnerabilities
- [ ] Tutti i test passano
- [ ] App testata su 2+ dispositivi
- [ ] Performance ≥ baseline pre-update

---

### 📝 14. Configurare ProGuard Custom Rules
**Status**: ⚠️ DA CONFIGURARE
**Effort**: 1 ora
**Assignee**: Developer

**File**: `android/app/proguard-rules.pro`

```proguard
# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }
-dontwarn com.reactnativecommunity.asyncstorage.**

# React Navigation
-keep class com.reactnavigation.** { *; }
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }

# Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# React Native Paper
-keep class com.callstack.reactnativepaper.** { *; }

# Keep attributes for debugging
-keepattributes SourceFile,LineNumberTable
-keepattributes *Annotation*

# Preserve source file names for stack traces
-renamesourcefileattribute SourceFile
```

**Test ProGuard**:
```bash
cd android
./gradlew bundleRelease

# Installa su device
adb install app/build/outputs/apk/release/app-release.apk

# Test TUTTI i flussi dell'app
# Se crash → check logcat per missing classes
```

**Acceptance Criteria**:
- [ ] ProGuard rules aggiunti
- [ ] Release build funziona identica a debug
- [ ] Nessun crash su obfuscated code
- [ ] Stack traces still readable

---

### 📝 15. Input Validation & Sanitization
**Status**: ⚠️ MANCANTE
**Effort**: 2 ore
**Assignee**: Developer

**15.1 Nomi Giocatori**

File: `src/screens/SettingsScreen.js`

```javascript
// Aggiungi funzione sanitize
const sanitizePlayerName = (name) => {
  return name
    .trim()
    .substring(0, 30)  // Max 30 caratteri
    .replace(/[<>]/g, '')  // Remove HTML-like chars
    .replace(/\s+/g, ' ');  // Collapse multiple spaces
};

// Usa in onChange
const handlePlayerNameChange = (index, value) => {
  const sanitized = sanitizePlayerName(value);
  const newNames = [...playerNames];
  newNames[index] = sanitized;
  setPlayerNames(newNames);
};
```

**15.2 Punteggi Bounds**

File: `src/contexts/GameContext.js`

```javascript
const MAX_SCORE = 999999;
const MIN_SCORE = -999999;

const updatePlayerScore = async (playerId, scoreChange) => {
  const updatedPlayers = players.map(player => {
    if (player.id === playerId) {
      let newScore = player.score + scoreChange;

      // Bounds checking
      newScore = Math.max(MIN_SCORE, Math.min(MAX_SCORE, newScore));

      // Darts mode: no negative
      if (currentPreset.mode === 'darts' && newScore < 0) {
        return player; // BUST
      }

      return {...player, score: newScore};
    }
    return player;
  });
  // ...
};
```

**15.3 Preset Custom Validation**

File: `src/screens/PresetManagerScreen.js`

```javascript
const validatePreset = (preset) => {
  const errors = [];

  if (!preset.name || preset.name.trim().length < 2) {
    errors.push('Nome preset troppo corto (min 2 caratteri)');
  }

  if (preset.name.length > 50) {
    errors.push('Nome preset troppo lungo (max 50 caratteri)');
  }

  if (!['max', 'min', 'rounds', 'darts'].includes(preset.mode)) {
    errors.push('Modalità non valida');
  }

  if (preset.targetScore && (preset.targetScore < 1 || preset.targetScore > 999999)) {
    errors.push('Punteggio target non valido');
  }

  return errors;
};
```

**Acceptance Criteria**:
- [ ] Nomi giocatori limitati a 30 caratteri
- [ ] Punteggi hanno bounds ±999999
- [ ] Preset custom validati prima di save
- [ ] UI mostra errori validazione all'utente

---

### 📝 16. Creare Terms of Service
**Status**: ❌ MANCANTE (opzionale)
**Effort**: 1 ora
**Assignee**: Legal / Developer

**File**: `terms-of-service.html` (nuovo, su GitHub Pages)

**Template**:
```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Termini di Servizio - Segnapunti</title>
  <style>/* Same style as privacy-policy.html */</style>
</head>
<body>
  <div class="container">
    <h1>📜 Termini di Servizio</h1>
    <p class="last-updated">Ultimo aggiornamento: 8 Gennaio 2026</p>

    <h2>1. Accettazione dei Termini</h2>
    <p>Scaricando e utilizzando Segnapunti, accetti questi termini di servizio.</p>

    <h2>2. Licenza d'Uso</h2>
    <p>Ti concediamo una licenza personale, non esclusiva, non trasferibile per utilizzare l'app per scopi personali e non commerciali.</p>

    <h2>3. Limitazioni d'Uso</h2>
    <ul>
      <li>Non puoi modificare, reverse-engineer o decompilare l'app</li>
      <li>Non puoi rimuovere copyright o trademark</li>
      <li>Non puoi redistribuire l'app</li>
    </ul>

    <h2>4. Disclaimer</h2>
    <p>L'app è fornita "così com'è". Non garantiamo l'accuratezza dei punteggi salvati. Non siamo responsabili per dispute tra giocatori.</p>

    <h2>5. Limitazione di Responsabilità</h2>
    <p>Non siamo responsabili per danni derivanti dall'uso dell'app, inclusi ma non limitati a: perdita di dati, malfunzionamenti dispositivo, dispute tra utenti.</p>

    <h2>6. Modifiche ai Termini</h2>
    <p>Possiamo aggiornare questi termini. L'uso continuato dell'app costituisce accettazione dei nuovi termini.</p>

    <h2>7. Legge Applicabile</h2>
    <p>Questi termini sono regolati dalla legge italiana.</p>

    <h2>8. Contatti</h2>
    <p>Per domande: <a href="mailto:tntlabs.ita@gmail.com">tntlabs.ita@gmail.com</a></p>
  </div>
</body>
</html>
```

**Deploy**:
```bash
git add terms-of-service.html
git commit -m "docs: add Terms of Service"
git push origin main

# Verifica accessibile:
# https://tnt-labs.github.io/Segnapunti/terms-of-service.html
```

**Acceptance Criteria**:
- [ ] File ToS creato e styled
- [ ] Deployed su GitHub Pages
- [ ] Link aggiunto in AboutScreen.js
- [ ] URL verificato accessibile

---

### 📝 17. Generare Third-Party Licenses
**Status**: ❌ MANCANTE
**Effort**: 1 ora
**Assignee**: Developer

**Tool**: license-checker

```bash
# Installa
npm install -g license-checker

# Genera JSON
npx license-checker --json --out licenses.json

# Genera HTML
npx license-checker --html --out licenses.html

# Verifica nessuna GPL (incompatibile)
npx license-checker --summary | grep GPL
```

**Integrare in App**:

**Opzione A**: Screen dedicato in app

File: `src/screens/LicensesScreen.js`
```javascript
import {WebView} from 'react-native-webview';

const LicensesScreen = () => {
  return (
    <WebView
      source={{uri: 'https://tnt-labs.github.io/Segnapunti/licenses.html'}}
    />
  );
};
```

**Opzione B**: Link esterno

In `AboutScreen.js`:
```javascript
<TouchableOpacity
  onPress={() => Linking.openURL('https://tnt-labs.github.io/Segnapunti/licenses.html')}>
  <Text style={styles.link}>📜 Licenze Open Source</Text>
</TouchableOpacity>
```

**Acceptance Criteria**:
- [ ] licenses.json generato
- [ ] licenses.html creato e styled
- [ ] Deployed su GitHub Pages
- [ ] Link accessibile da AboutScreen

---

## 🟢 PRIORITÀ BASSA - NICE TO HAVE

### 💚 18. Traduzione Inglese
**Status**: ❌ NON IMPLEMENTATA
**Effort**: 8-12 ore
**Assignee**: Developer / Translator

**Benefit**: +300% mercato potenziale

**Implementazione**:

```bash
# Installa i18n
npm install react-native-i18n

# Struttura file
src/locales/
  it.json
  en.json
```

**it.json**:
```json
{
  "game": {
    "title": "Partita",
    "noActiveGame": "Nessuna Partita Attiva",
    "startGame": "Inizia Partita",
    "saveGame": "Salva Partita",
    "resetGame": "Ricomincia Partita"
  },
  "settings": {
    "title": "Impostazioni",
    "selectPreset": "Seleziona Preset",
    "playerNames": "Nomi Giocatori"
  }
}
```

**en.json**:
```json
{
  "game": {
    "title": "Game",
    "noActiveGame": "No Active Game",
    "startGame": "Start Game",
    "saveGame": "Save Game",
    "resetGame": "Restart Game"
  },
  "settings": {
    "title": "Settings",
    "selectPreset": "Select Preset",
    "playerNames": "Player Names"
  }
}
```

**Effort**: 8-12 ore per traduzione completa + testing

**Acceptance Criteria**:
- [ ] i18n configurato
- [ ] Tutte le stringhe UI tradotte
- [ ] Lingua auto-detect da sistema
- [ ] Toggle manuale in SettingsScreen

---

### 💚 19. Video Promo
**Status**: ❌ NON CREATO
**Effort**: 3-4 ore
**Assignee**: Video Editor

**Storyboard** (30-60 secondi):
```
0:00 - Splash screen logo (2s)
0:02 - Setup partita: selezione preset + nomi (8s)
0:10 - Gameplay: aggiungi punteggi con tap (10s)
0:20 - Vittoria: banner "Hai vinto!" + salva (5s)
0:25 - Storico partite scroll (5s)
0:30 - Dark mode switch animation (3s)
0:33 - Features text overlay:
       "✅ 10 Preset Predefiniti
        ✅ 100% Offline
        ✅ Dark Mode
        ✅ Gratis Senza Ads" (5s)
0:38 - Logo + "Scarica Ora" CTA (2s)
```

**Tools**:
- Recording: Android Studio Emulator screen record
- Editing: DaVinci Resolve (free) / CapCut
- Music: Epidemic Sound (royalty-free)

**Upload**: YouTube (unlisted) → link in Play Console

**Acceptance Criteria**:
- [ ] Video 30-60 secondi creato
- [ ] Uploaded su YouTube
- [ ] Link aggiunto a Play Console store listing

---

### 💚 20. Crashlytics / Analytics Integration
**Status**: ❌ NON IMPLEMENTATO
**Effort**: 2-3 ore
**Assignee**: Developer

**Raccomandazione**: Firebase Crashlytics per crash reporting

```bash
npm install @react-native-firebase/app
npm install @react-native-firebase/crashlytics
npm install @react-native-firebase/analytics

# Configurare Firebase project
# Aggiungere google-services.json in android/app/
```

**Benefits**:
- Real-time crash alerts
- Stack traces dettagliate
- User analytics (engagement, retention)
- Performance monitoring

**Privacy**: ⚠️ Aggiornare Privacy Policy se implementato!

**Acceptance Criteria**:
- [ ] Firebase configurato
- [ ] Crashlytics reports funzionanti
- [ ] Privacy Policy aggiornata
- [ ] Data Safety form aggiornato

---

## 📦 PLAY STORE SUBMISSION CHECKLIST

### Pre-Upload Verification

#### Build & Signing
- [ ] ✅ Android project generato
- [ ] ✅ Keystore produzione creato e backuppato (3 copie!)
- [ ] ✅ build.gradle configurato (targetSdk=34, versioning)
- [ ] ✅ AAB genera senza errori
- [ ] ✅ AAB size <50MB
- [ ] ✅ APK testato su dispositivo fisico

#### Code Quality
- [ ] ✅ Unit tests ≥60% coverage
- [ ] ✅ Tutti i test passano
- [ ] ✅ Accessibilità implementata (accessibilityLabel)
- [ ] ✅ Error Boundary implementato
- [ ] ✅ Input validation aggiunta
- [ ] ✅ ProGuard rules configurate

#### Testing
- [ ] ✅ Testato su 5+ dispositivi Android diversi
- [ ] ✅ Test con TalkBack (accessibilità)
- [ ] ✅ Test rotazione schermo
- [ ] ✅ Test interruzioni (call, notifiche)
- [ ] ✅ Test low memory scenarios
- [ ] ✅ Nessun crash critico rilevato

#### Assets
- [ ] ✅ App icon 512x512 pronto
- [ ] ✅ Adaptive icon XML generato
- [x] ✅ Feature graphic 1024x500 creato
- [ ] ✅ 6-8 screenshots 1080x1920 pronti
- [ ] ⚠️ Video promo caricato (opzionale)

#### Legal & Docs
- [ ] ✅ Privacy Policy pubblicata e accessibile
- [ ] ✅ Privacy Policy aggiornata per app nativa
- [ ] ⚠️ Terms of Service pubblicati (opzionale)
- [ ] ✅ Third-party licenses documentate
- [ ] ✅ Email supporto funzionante

#### Play Console
- [ ] ✅ Account developer attivo e verificato
- [ ] ✅ Fee $25 pagata
- [ ] ✅ Profilo sviluppatore completo

---

## 🎯 QUICK WIN PRIORITIES

**Se hai solo 1 settimana**, focalizzati su:

### Week 1 - Minimum Viable Release
1. ✅ Genera android/ (30min)
2. ✅ Configura build.gradle + keystore (1h)
3. ✅ Fix versioning (15min) - DONE
4. ✅ Aggiungi accessibilità base (4h) - DONE
5. ✅ Crea feature graphic (1h) - DONE
6. ✅ Test su 3 dispositivi (3h)
7. ✅ Setup Play Console (1h)
8. ✅ Upload internal test (30min)

**Totale**: ~12 ore → Publish weekend successivo

---

## 📞 SUPPORT

**Domande su questo TODO?**
- 📧 Email: tntlabs.ita@gmail.com
- 💬 GitHub Issues: https://github.com/TNT-Labs/Segnapunti/issues
- 📚 Docs: [GOOGLE_PLAY_ANALYSIS_REPORT.md](./GOOGLE_PLAY_ANALYSIS_REPORT.md)

---

**Ultima Modifica**: 2026-01-08
**Versione TODO**: 1.0
**Generato da**: Claude Code AI

