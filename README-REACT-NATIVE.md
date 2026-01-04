# 🃏 Segnapunti - React Native App

## ✅ Migrazione Completata

L'app è stata completamente migrata da PWA a React Native standard (no Expo).

## 📋 Caratteristiche

- **React Native 0.73.2** con JavaScript
- **AsyncStorage** per persistenza dati locale
- **React Navigation** con Bottom Tabs
- **Dark Mode** con Context API
- **5 Schermate Complete**:
  - GameScreen (gioco con gestione punteggi)
  - SettingsScreen (configurazione partita e preset)
  - HistoryScreen (storico partite)
  - PresetManagerScreen (gestione preset personalizzati)
  - AboutScreen (informazioni app)
- **10 Preset predefiniti** (Scala 40, Burraco, Scopa, ecc.)
- **Privacy-first**: nessuna registrazione, tutto locale

## 🚀 Build APK Android (Windows)

### Prerequisiti

1. **Node.js** (v18+): https://nodejs.org/
2. **Java JDK 17**: https://adoptium.net/
3. **Android Studio** con:
   - Android SDK
   - Android SDK Platform-Tools
   - Android SDK Build-Tools
   - ANDROID_HOME configurato (es: `C:\Users\YourName\AppData\Local\Android\Sdk`)

### Steps

#### 1. Inizializza Progetto Android

**IMPORTANTE**: Prima di eseguire lo script, se hai già una cartella `android/` esistente, eliminala:

```batch
rmdir /s /q android
```

Poi esegui:

```batch
init-react-native-android.bat
```

Questo script:
- Crea un progetto React Native 0.73.2 temporaneo
- Copia la cartella `android/` compatibile
- Pulisce i file temporanei

⚠️ **Nota sulla versione**: Lo script ora usa `react-native@0.73.2` per garantire compatibilità con le dipendenze in `package.json`. Le versioni precedenti usavano l'ultima versione disponibile, causando errori di build.

#### 2. Installa Dipendenze

```batch
npm install
```

#### 3. Build APK

```batch
build-react-native.bat
```

Scegli:
- **Opzione 1**: Debug APK (non firmato, per test)
- **Opzione 2**: Release APK (firmato, per distribuzione - richiede keystore)

L'APK sarà generato in:
- Debug: `android\app\build\outputs\apk\debug\app-debug.apk`
- Release: `android\app\build\outputs\apk\release\app-release.apk`

#### 4. Installa su Device

```batch
adb install android\app\build\outputs\apk\debug\app-debug.apk
```

### Run in Development

Per eseguire l'app in modalità sviluppo con hot reload:

```batch
run-android.bat
```

Assicurati di avere:
- Un device Android connesso con USB debugging abilitato, OPPURE
- Un emulatore Android in esecuzione

## 🐛 Risoluzione Problemi

### Errore: "autolinkLibrariesWithApp() not found"

**Causa**: Hai una cartella `android/` generata da una versione React Native diversa dalla 0.73.2.

**Soluzione**:
1. Elimina la cartella android: `rmdir /s /q android`
2. Esegui di nuovo: `init-react-native-android.bat`

### Errore: Gradle download timeout

**Soluzione**: Riprova il build. Il download di Gradle può richiedere diversi minuti.

### Errore: Plugin not found / Kotlin warnings

**Soluzione**: Assicurati di aver eliminato la vecchia cartella android e ricreata con lo script aggiornato.

### Build lento

Il primo build può richiedere 10-15 minuti. I build successivi saranno molto più veloci.

## 📂 Struttura Progetto

```
Segnapunti/
├── src/
│   ├── App.js                 # App principale con providers
│   ├── contexts/
│   │   ├── ThemeContext.js    # Dark mode
│   │   └── GameContext.js     # Stato gioco globale
│   ├── services/
│   │   └── StorageService.js  # AsyncStorage wrapper
│   ├── navigation/
│   │   └── AppNavigator.js    # Bottom Tabs navigation
│   ├── screens/
│   │   ├── GameScreen.js
│   │   ├── SettingsScreen.js
│   │   ├── HistoryScreen.js
│   │   ├── PresetManagerScreen.js
│   │   └── AboutScreen.js
│   ├── components/
│   │   ├── PlayerCard.js      # Card giocatore con +/-
│   │   ├── PresetCard.js      # Card preset selezionabile
│   │   └── ScoreModal.js      # Modal inserimento punteggio
│   └── constants/
│       ├── colors.js          # Palette colori
│       └── presets.js         # Preset predefiniti
├── android/                   # Progetto Android nativo
├── index.js                   # Entry point
├── package.json
├── babel.config.js
├── metro.config.js
└── *.bat                      # Script Windows
```

## 🔧 Configurazione Release

Per creare APK release firmati:

1. Genera keystore:
```batch
cd android\app
keytool -genkey -v -keystore segnapunti-release.keystore -alias segnapunti -keyalg RSA -keysize 2048 -validity 10000
```

2. Configura `android/gradle.properties`:
```properties
SEGNAPUNTI_RELEASE_STORE_FILE=segnapunti-release.keystore
SEGNAPUNTI_RELEASE_KEY_ALIAS=segnapunti
SEGNAPUNTI_RELEASE_STORE_PASSWORD=your_password
SEGNAPUNTI_RELEASE_KEY_PASSWORD=your_password
```

3. Build release:
```batch
build-react-native.bat
# Scegli opzione 2
```

## 📖 Documentazione

- React Native: https://reactnative.dev/
- React Navigation: https://reactnavigation.org/
- AsyncStorage: https://react-native-async-storage.github.io/async-storage/

## 🔄 Version History

- **v1.3.0**: Migrazione completa a React Native
  - Fix: Script init ora usa React Native 0.73.2 per compatibilità
  - Risolti problemi di build con versioni template mismatch
- **v1.2.0**: App PWA originale

---

**Nota**: Tutti i dati sono salvati localmente sul device. Non c'è sincronizzazione cloud né tracciamento utenti.
