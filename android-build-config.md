# 📝 Android Build Configuration - TODO

**Status**: ⏳ Da configurare dopo generazione progetto Android

## File da Creare/Modificare

### `android/app/build.gradle`

Una volta eseguito `init-react-native-android.bat` o generato manualmente il progetto Android, aggiornare il file `android/app/build.gradle` con la seguente configurazione:

```gradle
android {
    namespace "com.tntlabs.segnapunti"
    compileSdkVersion 34  // Android 14

    defaultConfig {
        applicationId "com.tntlabs.segnapunti"
        minSdkVersion 23  // Android 6.0 (API 23) - 95%+ device coverage
        targetSdkVersion 34  // CRITICAL: Required for Google Play Store 2024

        // VERSION SYNC - MUST MATCH package.json
        versionCode 1           // Integer incrementale (primo release)
        versionName "1.0.0"     // Semantic versioning (sync con package.json)

        // 64-bit Support (OBBLIGATORIO per Play Store)
        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a"
        }
    }

    signingConfigs {
        release {
            // Configurato dopo creazione keystore
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
            minifyEnabled true              // ProGuard/R8 obfuscation
            shrinkResources true            // Remove unused resources
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Checklist Configurazione

- [ ] Progetto Android generato (`android/` folder exists)
- [ ] `build.gradle` modificato con config sopra
- [ ] `versionCode` = 1
- [ ] `versionName` = "1.0.0" (sync con package.json)
- [ ] `targetSdkVersion` = 34
- [ ] `minSdkVersion` = 23
- [ ] Keystore creato e signing configurato
- [ ] Test build: `cd android && ./gradlew bundleRelease`
- [ ] AAB generato correttamente

## Versioning Future

Per aggiornamenti futuri, incrementare **insieme**:

| Release Type | versionCode | versionName | Esempio |
|--------------|-------------|-------------|---------|
| Hotfix | +1 | x.y.Z+1 | 1.0.0 → 1.0.1 (versionCode 2) |
| Minor | +1 | x.Y+1.0 | 1.0.1 → 1.1.0 (versionCode 3) |
| Major | +1 | X+1.0.0 | 1.1.0 → 2.0.0 (versionCode 4) |

**IMPORTANTE**: `versionCode` DEVE sempre aumentare, non può mai diminuire!

---

**Data Creazione**: 2026-01-08
**Prossimo Step**: Eseguire `init-react-native-android.bat`
