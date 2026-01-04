# 📱 Guida Build Android - Segnapunti

Questa guida spiega come trasformare Segnapunti in un'app Android nativa usando **Capacitor** e come generare l'APK usando gli script automatici per Windows.

---

## 📋 Indice

- [Prerequisiti](#-prerequisiti)
- [Quick Start](#-quick-start)
- [Build Automatica (Windows)](#-build-automatica-windows)
- [Build Manuale](#-build-manuale)
- [Distribuzione Google Play](#-distribuzione-google-play)
- [Troubleshooting](#-troubleshooting)
- [FAQ](#-faq)

---

## 🔧 Prerequisiti

Prima di iniziare, assicurati di avere installato:

### 1. Node.js (Obbligatorio)

```bash
# Versione consigliata: LTS 20.x o superiore
```

**Download:** https://nodejs.org/

**Verifica installazione:**
```bash
node --version
npm --version
```

### 2. Java JDK 17 (Obbligatorio)

**Download:** https://adoptium.net/

**Verifica installazione:**
```bash
java -version
```

**Configurazione JAVA_HOME:**
- Windows: Aggiungi variabile d'ambiente `JAVA_HOME`
  - Esempio: `C:\Program Files\Eclipse Adoptium\jdk-17.0.8.7-hotspot`
  - Aggiungi `%JAVA_HOME%\bin` al PATH

### 3. Android Studio (Consigliato)

**Download:** https://developer.android.com/studio

**Installazione:**
1. Scarica Android Studio
2. Avvia Android Studio
3. Vai su `Tools` → `SDK Manager`
4. Installa:
   - Android SDK Platform 33 (o superiore)
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - Android SDK Command-line Tools

**Configurazione ANDROID_HOME:**
- Windows: Aggiungi variabile d'ambiente `ANDROID_HOME`
  - Esempio: `C:\Users\TuoNome\AppData\Local\Android\Sdk`
  - Aggiungi al PATH:
    - `%ANDROID_HOME%\platform-tools`
    - `%ANDROID_HOME%\tools`
    - `%ANDROID_HOME%\cmdline-tools\latest\bin`

### 4. Gradle (Installato automaticamente)

Gradle verrà installato automaticamente da Capacitor.

---

## 🚀 Quick Start

### Build APK in 3 passaggi:

```bash
# 1. Esegui lo script di build (Windows)
.\build-android.bat

# 2. Segui le istruzioni a schermo

# 3. Trova il tuo APK in:
# - Debug: android\app\build\outputs\apk\debug\app-debug.apk
# - Release: android\app\build\outputs\apk\release\app-release.apk
```

---

## 🪟 Build Automatica (Windows)

Sono disponibili quattro script BAT per semplificare il workflow:

### 1. `build-android.bat` - Build APK Automatica

**Funzionalità:**
- ✅ Verifica prerequisiti (Node.js, Java, Android SDK)
- ✅ Installa dipendenze npm automaticamente
- ✅ Inizializza progetto Android con Capacitor
- ✅ Prepara file web (copia in directory `www/`)
- ✅ Sincronizza file web con progetto Android
- ✅ Compila APK (debug o release)
- ✅ Gestisce firma keystore per release
- ✅ Apre cartella con APK generato

**Uso:**
```bash
# Doppio click su build-android.bat
# Oppure da terminale:
.\build-android.bat
```

**Scelte durante la build:**

1. **Tipo di build:**
   - `1` → Debug (per test, non firmato)
   - `2` → Release (per distribuzione, firmato)

2. **Keystore (solo per release):**
   - Se non esiste, lo script ti guiderà nella creazione
   - Inserisci password e informazioni richieste
   - **IMPORTANTE:** Salva il keystore e la password!

**Output:**
- Debug: `android\app\build\outputs\apk\debug\app-debug.apk`
- Release: `android\app\build\outputs\apk\release\app-release.apk`

### 2. `open-android-studio.bat` - Apri in Android Studio

**Funzionalità:**
- Apre il progetto Android in Android Studio
- Utile per debug avanzato e configurazioni manuali

**Uso:**
```bash
.\open-android-studio.bat
```

### 3. `prepare-web.bat` - Preparazione File Web

**Funzionalità:**
- Copia tutti i file web (HTML, CSS, JS, immagini) nella directory `www/`
- Copia cartelle (locales, screenshots, .well-known)
- Chiamato automaticamente da `build-android.bat`

**Uso:**
```bash
# Normalmente non serve eseguirlo manualmente
.\prepare-web.bat
```

**Nota:** Questo script viene eseguito automaticamente da `build-android.bat`. Utile solo se vuoi preparare i file manualmente.

### 4. `clean-android.bat` - Pulizia Build

**Funzionalità:**
- Elimina tutti i file di build
- Utile quando si verificano errori di build
- Libera spazio disco

**Uso:**
```bash
.\clean-android.bat
```

---

## 🔨 Build Manuale

Se preferisci gestire il processo manualmente:

### 1. Installa dipendenze

```bash
npm install
```

### 2. Inizializza progetto Android

```bash
npx cap add android
```

### 3. Prepara file web

```bash
.\prepare-web.bat
```

### 4. Sincronizza file web

```bash
npx cap sync android
```

### 5. Build APK

**Debug:**
```bash
cd android
gradlew.bat assembleDebug
cd ..
```

**Release:**
```bash
cd android
gradlew.bat assembleRelease
cd ..
```

---

## 📦 Distribuzione Google Play

### Opzione A: Upload APK (Semplice)

1. Genera APK release firmato:
   ```bash
   .\build-android.bat
   # Scegli opzione 2 (Release)
   ```

2. APK generato: `android\app\build\outputs\apk\release\app-release.apk`

3. Carica su Google Play Console

**Nota:** Google preferisce AAB invece di APK per nuove app.

### Opzione B: Build AAB (Consigliato da Google)

```bash
cd android
gradlew.bat bundleRelease
cd ..
```

**Output:** `android\app\build\outputs\bundle\release\app-release.aab`

**Vantaggi AAB:**
- Dimensioni download più piccole (Google genera APK ottimizzati per ogni dispositivo)
- Richiesto per app nuove su Google Play

### Firma del keystore

**IMPORTANTE:** Il keystore è fondamentale per aggiornamenti futuri!

**Creazione keystore (prima volta):**
```bash
keytool -genkey -v -keystore android\app\segnapunti-release.keystore -alias segnapunti -keyalg RSA -keysize 2048 -validity 10000
```

**Informazioni da fornire:**
- Password keystore (ricordala!)
- Nome e cognome: TNT Labs
- Unità organizzativa: Development
- Organizzazione: TNT Labs
- Città, Provincia, Paese

**Backup keystore:**
```bash
# Copia questi file in un posto SICURO:
android\app\segnapunti-release.keystore
# Annota password in un password manager
```

**⚠️ ATTENZIONE:** Se perdi il keystore, non potrai MAI più aggiornare l'app su Google Play!

### Configurazione build.gradle per firma automatica

Modifica `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file("segnapunti-release.keystore")
            storePassword "TUA_PASSWORD_STORE"
            keyAlias "segnapunti"
            keyPassword "TUA_PASSWORD_CHIAVE"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

**Sicurezza:** Non committare mai password su Git! Usa variabili d'ambiente o `gradle.properties`.

---

## 🛠️ Troubleshooting

### Errore: "Node.js non trovato"

**Soluzione:**
1. Installa Node.js da https://nodejs.org/
2. Riavvia il terminale
3. Verifica: `node --version`

### Errore: "Java JDK non trovato"

**Soluzione:**
1. Installa JDK 17 da https://adoptium.net/
2. Configura JAVA_HOME:
   - Variabile d'ambiente: `JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17...`
   - Aggiungi `%JAVA_HOME%\bin` al PATH
3. Riavvia terminale
4. Verifica: `java -version`

### Errore: "ANDROID_HOME non configurato"

**Soluzione:**
1. Installa Android Studio
2. Apri SDK Manager e installa Android SDK
3. Configura variabile d'ambiente:
   ```
   ANDROID_HOME=C:\Users\TuoNome\AppData\Local\Android\Sdk
   ```
4. Aggiungi al PATH:
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\cmdline-tools\latest\bin
   ```
5. Riavvia terminale

### Errore: "Gradle build failed"

**Soluzioni:**

1. **Pulizia build:**
   ```bash
   .\clean-android.bat
   .\build-android.bat
   ```

2. **Verifica versione Gradle:**
   ```bash
   cd android
   gradlew.bat --version
   cd ..
   ```

3. **Controlla logs:**
   - Apri `android/app/build.gradle`
   - Verifica che tutte le dipendenze siano aggiornate

4. **Reinstalla node_modules:**
   ```bash
   rmdir /s /q node_modules
   npm install
   npx cap sync android
   ```

### Errore: "Keystore password errata"

**Soluzione:**
- Assicurati di inserire la password corretta
- Se hai dimenticato la password, devi ricreare il keystore (impossibile recuperarla)
- **Attenzione:** Ricreare il keystore significa che non potrai aggiornare l'app esistente su Play Store

### APK non si installa su dispositivo

**Soluzioni:**

1. **Abilita "Origini sconosciute":**
   - Impostazioni → Sicurezza → Origini sconoscite (ON)
   - Su Android 8+: Impostazioni → App → Menu → Accesso speciale → Installa app sconosciute

2. **Verifica firma APK:**
   ```bash
   # Solo per APK release
   jarsigner -verify -verbose -certs android\app\build\outputs\apk\release\app-release.apk
   ```

3. **Usa APK debug per test:**
   ```bash
   .\build-android.bat
   # Scegli opzione 1 (Debug)
   ```

### Build lenta

**Ottimizzazioni:**

1. **Incrementa memoria Gradle:**

   Crea/Modifica `android/gradle.properties`:
   ```properties
   org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
   org.gradle.daemon=true
   org.gradle.parallel=true
   org.gradle.configureondemand=true
   ```

2. **Usa cache Gradle:**
   ```bash
   # Già abilitato di default
   ```

3. **Chiudi app in background** (Chrome, IDE, ecc.)

---

## ❓ FAQ

### 1. Qual è la differenza tra APK Debug e Release?

**APK Debug:**
- Non firmato (o firmato con chiave debug)
- Include simboli di debug
- Dimensioni maggiori
- Solo per test interno
- Non accettato da Google Play

**APK Release:**
- Firmato con keystore di produzione
- Ottimizzato e compresso
- Dimensioni ridotte
- Pronto per distribuzione
- Richiesto per Google Play

### 2. Come aggiorno l'app dopo la pubblicazione?

1. Incrementa versione in `capacitor.config.json`:
   ```json
   {
     "android": {
       "versionName": "1.4.0",
       "versionCode": 2
     }
   }
   ```

2. Incrementa anche in `android/app/build.gradle`:
   ```gradle
   versionCode 2
   versionName "1.4.0"
   ```

3. Ricompila APK/AAB:
   ```bash
   .\build-android.bat
   ```

4. Carica su Google Play Console

**IMPORTANTE:** Usa sempre lo stesso keystore per tutti gli aggiornamenti!

### 3. Come cambio icona dell'app?

1. Sostituisci le icone in:
   - `Segnapunti512x512.png` (principale)
   - Tutte le altre dimensioni

2. Risincronizza:
   ```bash
   npx cap sync android
   ```

3. Rebuild APK

Capacitor copierà automaticamente le icone dal manifest.json.

### 4. Come cambio nome app o package ID?

**Nome app:**
- Modifica `appName` in `capacitor.config.json`
- Modifica `app_name` in `android/app/src/main/res/values/strings.xml`

**Package ID (ATTENZIONE!):**
- Modifica `appId` in `capacitor.config.json`
- Modifica `applicationId` in `android/app/build.gradle`
- **NON CAMBIARLO** dopo la pubblicazione su Play Store!

### 5. Come abilito debug USB?

1. Dispositivo Android → Impostazioni → Info sul telefono
2. Tocca 7 volte su "Numero build"
3. Torna indietro → Opzioni sviluppatore
4. Abilita "Debug USB"
5. Collega dispositivo via USB
6. Autorizza il computer sul dispositivo

### 6. Come testo l'app sul dispositivo reale?

**Metodo 1: Installa APK manualmente**
```bash
# Build APK debug
.\build-android.bat
# Scegli opzione 1

# Trasferisci APK sul dispositivo
# Installa l'APK dal file manager
```

**Metodo 2: Android Studio (Live Reload)**
```bash
# Apri progetto
.\open-android-studio.bat

# In Android Studio:
# Run → Run 'app'
# Seleziona dispositivo USB o emulatore

# Le modifiche web si ricaricheranno automaticamente
```

### 7. L'app è lenta sul dispositivo

**Ottimizzazioni:**

1. **Minify in release:**

   `android/app/build.gradle`:
   ```gradle
   buildTypes {
       release {
           minifyEnabled true
           shrinkResources true
       }
   }
   ```

2. **Abilita ProGuard:**
   - Già abilitato di default

3. **Riduci dimensioni immagini:**
   - Comprimi PNG/JPG
   - Usa WebP invece di PNG per immagini grandi

4. **Service Worker:**
   - Già implementato per caching offline

### 8. Come abilito HTTPS per WebView?

Capacitor usa HTTPS di default per le risorse web:
- Schema: `https://`
- Hostname: `segnapunti.app` (configurato in `capacitor.config.json`)

### 9. Come aggiungo permessi Android?

Modifica `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
    <!-- Esempio: permesso fotocamera -->
    <uses-permission android:name="android.permission.CAMERA" />

    <!-- Esempio: permesso storage -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

    <application>
        ...
    </application>
</manifest>
```

Poi risincronizza:
```bash
npx cap sync android
```

### 10. Come pubblico su Google Play?

Vedi la guida completa: [GOOGLE_PLAY_SETUP.md](GOOGLE_PLAY_SETUP.md)

Passaggi rapidi:
1. Crea account Google Play Console (€25)
2. Build AAB release firmato
3. Carica AAB su Play Console
4. Compila scheda store
5. Invia per revisione (48-72 ore)

---

## 📚 Risorse Utili

- **Capacitor Docs:** https://capacitorjs.com/docs
- **Android Developer Guide:** https://developer.android.com/
- **Gradle Build Guide:** https://docs.gradle.org/
- **Google Play Console:** https://play.google.com/console

---

## 🆘 Supporto

Hai problemi? Apri un issue su GitHub:

**Repository:** https://github.com/TNT-Labs/Segnapunti

**Email:** tntlabs.ita@gmail.com

---

## 📝 Note Tecniche

### Struttura Progetto Android

```
android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── AndroidManifest.xml    # Configurazione app
│   │       ├── res/                    # Risorse (icone, strings, etc.)
│   │       └── assets/                 # Asset web copiati qui
│   ├── build.gradle                    # Configurazione build app
│   └── segnapunti-release.keystore     # Keystore (NON committare!)
├── gradle/                             # Wrapper Gradle
├── build.gradle                        # Configurazione build progetto
└── settings.gradle                     # Impostazioni Gradle
```

### Capacitor Config

`capacitor.config.json` controlla:
- **appId:** Package ID Android (es. `com.tntlabs.segnapunti`)
- **appName:** Nome app
- **webDir:** Directory con file web (`.` = root)
- **server.androidScheme:** Schema URL (`https`)
- **backgroundColor:** Colore splash/background

### Version Management

**Incrementa versione per ogni release:**

1. `capacitor.config.json` (opzionale, per riferimento)
2. `android/app/build.gradle`:
   ```gradle
   versionCode 2        // Incrementa di 1 ad ogni release
   versionName "1.4.0"  // Versione human-readable
   ```

**Regole:**
- `versionCode`: Deve essere sempre crescente (1, 2, 3...)
- `versionName`: Semantic versioning (1.0.0, 1.1.0, 2.0.0)
- Google Play richiede `versionCode` più alto per aggiornamenti

---

**Buona Build! 🚀**
