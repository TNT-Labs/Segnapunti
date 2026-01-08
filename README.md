# 🃏 Segnapunti - React Native App

**L'app segnapunti mobile nativa per Android**

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![React Native](https://img.shields.io/badge/React%20Native-0.74.6-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 📱 Panoramica

Segnapunti è un'app React Native nativa per gestire punteggi di partite a carte, giochi da tavolo, sport e altro.

### ✨ Caratteristiche

- 🎯 **Multi-modalità**: Max, Min, Rounds, Darts
- 📱 **UI Nativa Android** completamente funzionante
- 🌙 **Dark Mode** con switch istantaneo
- 💾 **Storage Locale** (AsyncStorage)
- 📊 **Storico Partite** con dettagli completi
- 🎮 **10 Preset Predefiniti** + preset personalizzabili
- 🔒 **100% Privacy** - zero raccolta dati

---

## 🚀 Quick Start (Windows)

### Prerequisiti

1. **Node.js 18+** → https://nodejs.org/
2. **Java JDK 17** → https://adoptium.net/
3. **Android Studio** → https://developer.android.com/studio

### Setup Rapido

```bash
# 1. Clone repository
git clone https://github.com/TNT-Labs/Segnapunti.git
cd Segnapunti

# 2. Inizializza progetto Android (PRIMA VOLTA)
init-react-native-android.bat

# 3. Installa dipendenze
npm install

# 4. Build APK
build-react-native.bat
```

---

## 📦 Script Automatici (Windows)

### `init-react-native-android.bat`
Inizializza il progetto Android nativo (eseguire UNA SOLA VOLTA).

```bash
init-react-native-android.bat
```

### `build-react-native.bat`
Build automatica APK Debug o Release.

```bash
build-react-native.bat
# Scegli: 1=Debug, 2=Release
```

**Output:**
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

### `run-android.bat`
Avvia app su emulatore o dispositivo fisico.

```bash
run-android.bat
```

---

## 🏗️ Architettura

### Struttura Completa

```
src/
├── App.js                      # Entry point con providers
├── navigation/
│   └── AppNavigator.js         # Bottom Tab Navigation
├── screens/
│   ├── GameScreen.js           # ✅ Partita completa
│   ├── SettingsScreen.js       # ✅ Setup + Dark mode
│   ├── HistoryScreen.js        # ✅ Storico partite
│   ├── PresetManagerScreen.js  # ✅ Gestione preset
│   └── AboutScreen.js          # ✅ Info app
├── components/
│   ├── PlayerCard.js           # ✅ Card giocatore interattiva
│   ├── PresetCard.js           # ✅ Card preset selezionabile
│   └── ScoreModal.js           # ✅ Modal aggiungi punti
├── contexts/
│   ├── ThemeContext.js         # ✅ Dark mode + tema
│   └── GameContext.js          # ✅ Stato gioco globale
├── services/
│   └── StorageService.js       # ✅ AsyncStorage wrapper
└── constants/
    ├── colors.js               # ✅ Palette colori
    └── presets.js              # ✅ 10 preset predefiniti
```

### Features Implementate

✅ **GameScreen**
- Lista giocatori con punteggi
- Pulsanti +/- per modificare punteggio
- Modal custom score
- Rilevamento vittoria automatico
- Salvataggio partita nello storico

✅ **SettingsScreen**
- Selezione preset (10 predefiniti)
- Input nomi giocatori (2-8)
- Dark mode toggle
- Avvio partita

✅ **HistoryScreen**
- Lista storico partite
- Dettagli partita con vincitore
- Elimina singola partita
- Elimina tutto lo storico

✅ **PresetManagerScreen**
- Visualizzazione preset predefiniti
- Creazione preset personalizzati
- Eliminazione preset custom

✅ **Componenti UI**
- PlayerCard (interattiva)
- PresetCard (selezionabile)
- ScoreModal (quick scores)

---

## 🎮 Preset Predefiniti

| Gioco | Categoria | Modalità | Target |
|-------|-----------|----------|--------|
| Scala 40 | 🃏 Carte | Min | 101 |
| Burraco | 🃏 Carte | Max | 2005 |
| Scopa | 🃏 Carte | Rounds | 2 rounds (21pt) |
| Briscola | 🃏 Carte | Max | 11 |
| Pinnacola | 🃏 Carte | Max | 1500 |
| Poker | 🃏 Carte | Rounds | 5 mani (10k) |
| Tennis | ⚽ Sport | Rounds | 2 set (6 game) |
| Pallavolo | ⚽ Sport | Rounds | 3 set (25pt) |
| Freccette 501 | 🎯 Altri | Darts | 501→0 |
| Freccette 301 | 🎯 Altri | Darts | 301→0 |

---

## 🔧 Configurazione Android

### Variabili d'Ambiente (Windows)

```
JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.9+10
ANDROID_HOME=C:\Users\TuoNome\AppData\Local\Android\Sdk

PATH:
  %JAVA_HOME%\bin
  %ANDROID_HOME%\platform-tools
  %ANDROID_HOME%\emulator
  %ANDROID_HOME%\cmdline-tools\latest\bin
```

### Build Release (Firma APK)

#### 1. Crea Keystore

```bash
cd android\app
keytool -genkey -v -keystore segnapunti-release.keystore ^
  -alias segnapunti -keyalg RSA -keysize 2048 -validity 10000
```

#### 2. Configura Firma

Crea `android/gradle.properties`:

```properties
SEGNAPUNTI_UPLOAD_STORE_FILE=segnapunti-release.keystore
SEGNAPUNTI_UPLOAD_KEY_ALIAS=segnapunti
SEGNAPUNTI_UPLOAD_STORE_PASSWORD=your_store_password
SEGNAPUNTI_UPLOAD_KEY_PASSWORD=your_key_password
```

⚠️ **NON committare `gradle.properties` su Git!**

#### 3. Aggiorna `android/app/build.gradle`

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file(SEGNAPUNTI_UPLOAD_STORE_FILE)
            storePassword SEGNAPUNTI_UPLOAD_STORE_PASSWORD
            keyAlias SEGNAPUNTI_UPLOAD_KEY_ALIAS
            keyPassword SEGNAPUNTI_UPLOAD_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

---

## 📱 Test su Dispositivo

### Emulatore Android

```bash
# Avvia emulatore da Android Studio
# Oppure da cmd:
emulator -avd Pixel_5_API_33

# Run app
run-android.bat
```

### Dispositivo Fisico

```bash
# 1. Abilita Debug USB sul dispositivo
# 2. Connetti via USB
# 3. Verifica connessione
adb devices

# 4. Run app
run-android.bat
```

---

## 🐛 Troubleshooting

### Metro Bundler Error

```bash
npm start -- --reset-cache
```

### Gradle Build Failed

```bash
cd android
gradlew clean
cd ..
npm run android
```

### Android folder not found

```bash
# Esegui script init
init-react-native-android.bat
```

---

## 📄 Licenza

MIT License - vedi [LICENSE](LICENSE)

---

## 🙏 Ringraziamenti

- React Native Team
- React Navigation
- AsyncStorage
- Community open source

---

**Fatto con ❤️ da TNT Labs**

⭐ Se ti piace il progetto, lascia una stella su GitHub!

[🐛 Report Bug](https://github.com/TNT-Labs/Segnapunti/issues)
