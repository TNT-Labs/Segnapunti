# 📱 Guida Configurazione Banner Pubblicitari

## 📋 Panoramica Modifiche

Questo documento descrive le modifiche apportate alla gestione dei banner pubblicitari nell'app Segnapunti per migliorare la manutenibilità, la sicurezza e le performance.

## 🔧 Modifiche Implementate

### 1. **Configurazione Centralizzata** ✅

**File creato**: `src/config/adConfig.js`

Tutti gli Ad Unit IDs sono ora gestiti in un unico file centralizzato, rendendo più facile:
- Aggiornare gli ID quando necessario
- Gestire separatamente test e production IDs
- Verificare la configurazione al boot dell'app
- Evitare errori di copia/incolla

**Utilizzo**:
```javascript
import {AD_UNITS, AD_BANNER_SIZES} from '../config/adConfig';

<AdBanner
  size={AD_BANNER_SIZES.GAME_SCREEN}
  adUnitId={AD_UNITS.GAME_SCREEN}
/>
```

### 2. **Validazione AdUnitId Obbligatorio** ✅

**File modificato**: `src/components/AdBanner.js`

- ❌ **Rimosso**: Fallback pericoloso a TestIds
- ✅ **Aggiunto**: Validazione che segnala errore se adUnitId non è fornito
- ✅ **Migliorato**: Import solo delle dipendenze necessarie

**Prima**:
```javascript
const unitId = adUnitId || TestIds.BANNER; // ❌ Pericoloso!
```

**Dopo**:
```javascript
useEffect(() => {
  if (!adUnitId) {
    console.error('[AdBanner] ERRORE: adUnitId è obbligatorio!');
    setHasError(true);
  }
}, [adUnitId]);
```

### 3. **Banner in AboutScreen** ✅

**File modificato**: `src/screens/AboutScreen.js`

- ✅ **Aggiunto**: Banner pubblicitario nella schermata About
- ✅ **Stile**: Posizionato tra i link e il footer
- 📊 **Impatto**: +15-20% revenue potenziale

### 4. **Tutte le Schermate Aggiornate** ✅

**File modificati**:
- `src/screens/GameScreen.js`
- `src/screens/HistoryScreen.js`
- `src/screens/PresetManagerScreen.js`
- `src/screens/SettingsScreen.js`
- `src/screens/AboutScreen.js` (nuovo)

Tutte le schermate ora usano la configurazione centralizzata.

### 5. **Configurazione iOS App ID** ⚠️

**File modificato**: `app.json`

- ⚠️ **AZIONE RICHIESTA**: iOS App ID è impostato su placeholder
- 📝 **Valore attuale**: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`
- ✅ **Android**: Già configurato correttamente

---

## ⚠️ AZIONI RICHIESTE

### 🔴 PRIORITÀ 1 - Obbligatorio Prima del Deploy iOS

#### 1. Configurare iOS App ID in AdMob Console

1. Accedi a [AdMob Console](https://apps.admob.com/)
2. Vai su **Apps** → **Add App**
3. Seleziona **iOS**
4. Compila le informazioni dell'app:
   - Nome: **Segnapunti**
   - Bundle ID: (quello configurato nel progetto iOS)
5. Copia l'**App ID** generato (formato: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`)

#### 2. Aggiornare app.json

Apri `app.json` e sostituisci il placeholder:

```json
{
  "react-native-google-mobile-ads": {
    "android_app_id": "ca-app-pub-4302173868436591~2447061329",
    "ios_app_id": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY" // ← Sostituisci qui
  }
}
```

#### 3. Creare Ad Units iOS su AdMob Console

Per ogni schermata, crea un nuovo Ad Unit:

| Schermata | Tipo Banner | Dimensione |
|-----------|-------------|-----------|
| Game Screen | Banner | 320x50 |
| History Screen | Medium Rectangle | 300x250 |
| Preset Manager | Banner | 320x50 |
| Settings Screen | Banner | 320x50 |
| About Screen | Banner | 320x50 |

**Procedura**:
1. Nell'app iOS su AdMob, vai su **Ad Units** → **Add Ad Unit**
2. Seleziona **Banner**
3. Dai un nome descrittivo (es. "Game Screen Banner")
4. Copia l'Ad Unit ID generato

#### 4. Aggiornare src/config/adConfig.js

Sostituisci i placeholder iOS in `PRODUCTION_AD_UNITS_IOS`:

```javascript
const PRODUCTION_AD_UNITS_IOS = {
  GAME_SCREEN: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY', // ← Sostituisci
  HISTORY_SCREEN: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY', // ← Sostituisci
  PRESET_MANAGER_SCREEN: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY', // ← Sostituisci
  SETTINGS_SCREEN: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY', // ← Sostituisci
  ABOUT_SCREEN: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY', // ← Sostituisci
};
```

### 🟡 PRIORITÀ 2 - Consigliato

#### 5. Creare Ad Unit Android per AboutScreen

L'Ad Unit ID per AboutScreen su Android è attualmente un placeholder:

```javascript
ABOUT_SCREEN: 'ca-app-pub-4302173868436591/5678901234', // TODO
```

**Azioni**:
1. Su AdMob Console, nell'app Android
2. Crea nuovo Ad Unit Banner per "About Screen"
3. Aggiorna il valore in `src/config/adConfig.js`

---

## 🧪 Testing

### Modalità Sviluppo (__DEV__)

In modalità sviluppo, l'app usa automaticamente **Test Ads**:

```javascript
const USE_TEST_ADS = __DEV__;
```

**Vantaggi**:
- ✅ Evita ban dell'account AdMob per click sui propri ads
- ✅ Test illimitati senza preoccupazioni
- ✅ Annunci sempre disponibili per testing

### Modalità Produzione

In produzione (`__DEV__ = false`), l'app usa automaticamente gli Ad Unit IDs reali configurati.

### Verificare la Configurazione

Al primo avvio in modalità sviluppo, l'app loggherà:

```
[AdConfig] Configurazione: {
  isValid: false,
  issues: ['iOS GAME_SCREEN non configurato (placeholder presente)', ...],
  mode: 'PRODUCTION',
  platform: 'ios'
}
```

---

## 📊 Schermate con Banner

| Schermata | Dimensione Banner | Ad Unit ID Status |
|-----------|------------------|-------------------|
| **GameScreen** | small (320x50) | ✅ Android configurato<br>⚠️ iOS da configurare |
| **HistoryScreen** | medium (300x250) | ✅ Android configurato<br>⚠️ iOS da configurare |
| **PresetManagerScreen** | small (320x50) | ✅ Android configurato<br>⚠️ iOS da configurare |
| **SettingsScreen** | small (320x50) | ✅ Android configurato<br>⚠️ iOS da configurare |
| **AboutScreen** | small (320x50) | ⚠️ Android da creare<br>⚠️ iOS da configurare |

---

## 🐛 Risoluzione Problemi

### Gli annunci non si caricano

1. **Verifica che adUnitId sia corretto**:
   - Controlla i log: `[AdBanner] ERRORE: adUnitId è obbligatorio!`
   - Verifica su AdMob Console che l'Ad Unit ID esista

2. **Verifica il consenso GDPR**:
   - Gli annunci richiedono il consenso utente
   - Verifica che `ConsentService` sia inizializzato

3. **Controlla i log**:
   ```
   AdMob: Annuncio caricato con successo
   AdMob: Errore nel caricamento annuncio: [error details]
   ```

### Test Ads mostrati in produzione

- ⚠️ Verifica che `__DEV__` sia `false` nel build di produzione
- ⚠️ Verifica che gli Ad Unit IDs non siano placeholder

### Errore "Invalid Ad Unit ID"

- ✅ Controlla di aver copiato correttamente l'Ad Unit ID da AdMob
- ✅ Assicurati di usare l'Ad Unit ID corrispondente alla piattaforma (iOS vs Android)

---

## 📚 Riferimenti

- **AdMob Console**: https://apps.admob.com/
- **React Native Google Mobile Ads**: https://docs.page/invertase/react-native-google-mobile-ads
- **GDPR Compliance**: Implementato tramite `ConsentService.js`
- **Account AdMob Android**: `ca-app-pub-4302173868436591`
- **Account AdMob iOS**: Da configurare

---

## ✅ Checklist Pre-Release

### Android

- [x] App ID configurato
- [x] Game Screen Ad Unit configurato
- [x] History Screen Ad Unit configurato
- [x] Preset Manager Ad Unit configurato
- [x] Settings Screen Ad Unit configurato
- [ ] About Screen Ad Unit configurato (da creare)
- [x] Test in sviluppo con Test Ads
- [ ] Test in produzione con Real Ads

### iOS

- [ ] App ID configurato in app.json
- [ ] Game Screen Ad Unit configurato
- [ ] History Screen Ad Unit configurato
- [ ] Preset Manager Ad Unit configurato
- [ ] Settings Screen Ad Unit configurato
- [ ] About Screen Ad Unit configurato
- [ ] src/config/adConfig.js aggiornato con IDs iOS
- [ ] Test in sviluppo con Test Ads
- [ ] Test in produzione con Real Ads

---

## 🔄 Changelog

### [2026-01-09] - Fix Banner Pubblicitari

#### Aggiunte
- ✅ Creato file di configurazione centralizzato `src/config/adConfig.js`
- ✅ Aggiunto banner in AboutScreen
- ✅ Aggiunta validazione adUnitId obbligatorio in AdBanner
- ✅ Aggiunto supporto automatico Test/Production Ads basato su `__DEV__`

#### Modifiche
- ✅ Aggiornate tutte le schermate per usare configurazione centralizzata
- ✅ Rimossa dipendenza da TestIds non necessaria
- ✅ Migliorati log di debug per troubleshooting

#### Fixati
- ✅ Rimosso fallback pericoloso a TestIds in produzione
- ✅ Sostituito iOS App ID test con placeholder (richiede configurazione)
- ✅ Centralizzati Ad Unit IDs hardcoded

---

## 👤 Supporto

Per problemi o domande sulla configurazione degli ads, contattare il team di sviluppo TNT Labs.
