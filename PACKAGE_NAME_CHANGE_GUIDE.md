# 📦 Guida Cambio Package Name

**Da**: `com.segnapuntitemp`
**A**: `com.tntlabs.segnapunti`

---

## ✅ 1. File già modificati automaticamente

- ✅ `react-native.config.js` - packageName aggiornato

---

## 📝 2. File da modificare MANUALMENTE

### File 1: `android/app/build.gradle`

**Cerca** (circa linea 100-140):
```gradle
defaultConfig {
    applicationId "com.segnapuntitemp"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 1
    versionName "1.0.0"
}
```

**Modifica in**:
```gradle
defaultConfig {
    applicationId "com.tntlabs.segnapunti"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 1
    versionName "1.0.0"
}
```

---

### File 2: `android/app/src/main/AndroidManifest.xml`

**Cerca** (linea 2):
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.segnapuntitemp">
```

**Modifica in**:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.tntlabs.segnapunti">
```

---

### File 3: `android/app/src/debug/AndroidManifest.xml`

**Cerca**:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.segnapuntitemp">
```

**Modifica in**:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.tntlabs.segnapunti">
```

---

### File 4: Rinomina cartelle sorgenti Java/Kotlin

**Percorso attuale**:
```
android/app/src/main/java/com/segnapuntitemp/
```

**AZIONI**:

#### Passo A: Crea nuova struttura cartelle
```bash
cd android/app/src/main/java
mkdir -p com/tntlabs/segnapunti
```

#### Passo B: Sposta file
```bash
# Sposta tutti i file .java e .kt
move com/segnapuntitemp/*.java com/tntlabs/segnapunti/
move com/segnapuntitemp/*.kt com/tntlabs/segnapunti/
```

Oppure manualmente:
1. Crea cartella: `android/app/src/main/java/com/tntlabs/segnapunti/`
2. Sposta tutti i file da `com/segnapuntitemp/` a `com/tntlabs/segnapunti/`
3. Elimina la vecchia cartella `com/segnapuntitemp/`

#### Passo C: Aggiorna package declaration nei file sorgenti

**File**: `android/app/src/main/java/com/tntlabs/segnapunti/MainActivity.java`

**Cerca** (linea 1):
```java
package com.segnapuntitemp;
```

**Modifica in**:
```java
package com.tntlabs.segnapunti;
```

**File**: `android/app/src/main/java/com/tntlabs/segnapunti/MainApplication.java` (o `.kt`)

**Cerca** (linea 1):
```java
package com.segnapuntitemp;
```

**Modifica in**:
```java
package com.tntlabs.segnapunti;
```

---

### File 5: Stesso processo per cartella `debug`

Se esiste `android/app/src/debug/java/com/segnapuntitemp/`:

1. Crea: `android/app/src/debug/java/com/tntlabs/segnapunti/`
2. Sposta tutti i file
3. Aggiorna `package` declaration in ogni file

---

### File 6: Stesso processo per cartella `release`

Se esiste `android/app/src/release/java/com/segnapuntitemp/`:

1. Crea: `android/app/src/release/java/com/tntlabs/segnapunti/`
2. Sposta tutti i file
3. Aggiorna `package` declaration in ogni file

---

## 🔍 3. Verifica completa

Dopo tutte le modifiche, cerca eventuali riferimenti rimanenti:

### Windows (PowerShell):
```powershell
cd C:\dev\Segnapunti\android
Get-ChildItem -Recurse -File | Select-String "com.segnapuntitemp" -List | Select Path
```

### Windows (Command Prompt):
```bash
cd C:\dev\Segnapunti\android
findstr /S /I "com.segnapuntitemp" *.gradle *.xml *.java *.kt
```

---

## 🧹 4. Clean build

Dopo tutte le modifiche, pulisci e ricompila:

```bash
cd android
gradlew clean
cd ..

# Poi ricompila
build-aab.bat
```

---

## 📋 5. Checklist finale

Prima di caricare su Google Play, verifica:

- [ ] `android/app/build.gradle` → applicationId: `com.tntlabs.segnapunti`
- [ ] `android/app/src/main/AndroidManifest.xml` → package: `com.tntlabs.segnapunti`
- [ ] `android/app/src/debug/AndroidManifest.xml` → package: `com.tntlabs.segnapunti`
- [ ] `react-native.config.js` → packageName: `com.tntlabs.segnapunti` ✅
- [ ] Cartelle rinominate: `com/tntlabs/segnapunti/` invece di `com/segnapuntitemp/`
- [ ] Tutti i file `.java`/`.kt` aggiornati con nuovo package
- [ ] Nessun riferimento a `com.segnapuntitemp` rimanente
- [ ] Clean build eseguito
- [ ] AAB generato con successo

---

## ⚠️ IMPORTANTE

**NON modificare** il package name dopo aver caricato la prima versione su Google Play!

Una volta caricata la prima versione con `com.tntlabs.segnapunti`, il package name **NON può più essere cambiato** per quella app.

---

## 🚨 In caso di errori

Se dopo le modifiche vedi errori tipo:

```
error: package com.segnapuntitemp does not exist
```

Significa che hai dimenticato di aggiornare un file sorgente. Cerca tutti i file `.java` e `.kt` e verifica che la prima riga sia:

```java
package com.tntlabs.segnapunti;
```

---

## ✅ File Recap

| File | Cosa modificare |
|------|-----------------|
| `react-native.config.js` | ✅ Già fatto |
| `android/app/build.gradle` | `applicationId` |
| `android/app/src/main/AndroidManifest.xml` | `package` attribute |
| `android/app/src/debug/AndroidManifest.xml` | `package` attribute |
| `android/app/src/main/java/.../MainActivity.java` | Prima riga `package` + rinomina cartelle |
| `android/app/src/main/java/.../MainApplication.java` | Prima riga `package` + rinomina cartelle |

---

Buona fortuna! 🚀
