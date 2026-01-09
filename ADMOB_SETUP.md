# Configurazione Google AdMob per Segnapunti

Questa guida ti aiuterà a configurare Google AdMob per generare entrate dalla tua app Segnapunti.

## 📋 Prerequisiti

- Account Google AdMob ([Crea account qui](https://admob.google.com))
- App pubblicata o in fase di pubblicazione su Google Play Store / Apple App Store
- React Native configurato correttamente

## ✅ Stato Attuale dell'Integrazione

L'integrazione AdMob è già stata implementata in modo **non invasivo** nelle seguenti schermate:

| Schermata | Posizione | Dimensione | Tipo Banner |
|-----------|-----------|------------|-------------|
| **Game Screen** | Tra lista giocatori e button di azione | 320x50px | Small Banner |
| **History Screen** | Dopo button "Elimina Tutto" | 300x250px | Medium Rectangle |

### Perché questi posizionamenti?

✨ **Non invasivi**: Non interrompono il gameplay o la navigazione
✨ **Naturali**: Separatori visuali tra sezioni di contenuto
✨ **Mobile-friendly**: Dimensioni ottimizzate per dispositivi mobili
✨ **Alta visibilità**: Posizioni con buon tasso di visualizzazione

## 🚀 Passaggi per Attivare AdMob in Produzione

### 1. Crea il tuo Account AdMob

1. Vai su [admob.google.com](https://admob.google.com)
2. Accedi con il tuo account Google
3. Clicca su "Get Started" e segui la procedura guidata
4. Accetta i termini e condizioni

### 2. Registra la tua App su AdMob

#### Per Android:

1. Nel dashboard AdMob, clicca su **"Apps" → "Add App"**
2. Seleziona **"Android"**
3. Cerca la tua app su Google Play Store (o seleziona "No" se non è ancora pubblicata)
4. Inserisci il nome dell'app: **"Segnapunti"**
5. Copia l'**App ID** generato (formato: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`)

#### Per iOS:

1. Nel dashboard AdMob, clicca su **"Apps" → "Add App"**
2. Seleziona **"iOS"**
3. Cerca la tua app su App Store (o seleziona "No" se non è ancora pubblicata)
4. Inserisci il nome dell'app: **"Segnapunti"**
5. Copia l'**App ID** generato

### 3. Crea le Unità Pubblicitarie (Ad Units)

Devi creare **2 unità pubblicitarie** per i banner nell'app:

#### Banner 1: Game Screen (Small Banner)

1. Nel dashboard AdMob, vai su **"Apps" → Seleziona Segnapunti → "Ad units" → "Add ad unit"**
2. Seleziona **"Banner"**
3. Configurazione:
   - **Ad unit name**: `Game Screen Banner`
   - **Ad type**: `Banner`
   - **Size**: `Standard (320x50)`
4. Clicca su **"Create ad unit"**
5. Copia l'**Ad Unit ID** (formato: `ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY`)

#### Banner 2: History Screen (Medium Rectangle)

1. Ripeti il processo per il secondo banner
2. Configurazione:
   - **Ad unit name**: `History Screen Banner`
   - **Ad type**: `Banner`
   - **Size**: `Medium Rectangle (300x250)`
3. Copia l'**Ad Unit ID**

### 4. Aggiorna il Codice con i tuoi ID Reali

#### 4.1 Aggiorna `app.json`

Sostituisci gli App ID di test con i tuoi:

```json
{
  "name": "Segnapunti",
  "displayName": "Segnapunti",
  "react-native-google-mobile-ads": {
    "android_app_id": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY",  // ← Il tuo Android App ID
    "ios_app_id": "ca-app-pub-XXXXXXXXXXXXXXXX~ZZZZZZZZZZ",     // ← Il tuo iOS App ID
    "user_tracking_usage_description": "Questo identificativo verrà utilizzato per fornirti annunci personalizzati."
  }
}
```

#### 4.2 Aggiorna `src/screens/GameScreen.js`

Modifica il componente `AdBanner` alla linea 132:

```jsx
<AdBanner
  size="small"
  style={styles.adBanner}
  adUnitId="ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY" // ← Il tuo Game Screen Ad Unit ID
/>
```

#### 4.3 Aggiorna `src/screens/HistoryScreen.js`

Modifica il componente `AdBanner` alla linea 103:

```jsx
<AdBanner
  size="medium"
  style={styles.adBanner}
  adUnitId="ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ" // ← Il tuo History Screen Ad Unit ID
/>
```

### 5. Configurazione Native (iOS)

Per iOS, devi aggiungere l'App ID al file `Info.plist`:

```bash
cd ios
```

Apri `ios/Segnapunti/Info.plist` e aggiungi:

```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY</string>
```

Poi esegui:

```bash
cd ios && pod install && cd ..
```

### 6. Test in Sviluppo

Prima di pubblicare, testa che gli annunci funzionino:

```bash
# Per Android
npx react-native run-android

# Per iOS
npx react-native run-ios
```

Gli annunci di test dovrebbero apparire nelle schermate Game e History.

### 7. Build di Produzione

Quando sei pronto per la produzione:

```bash
# Android
cd android && ./gradlew assembleRelease

# iOS
cd ios && xcodebuild -workspace Segnapunti.xcworkspace -scheme Segnapunti -configuration Release
```

## 🎯 Ottimizzazione delle Entrate

### Suggerimenti per Massimizzare i Guadagni

1. **Mediazione**: Nel dashboard AdMob, attiva la mediazione per aumentare il fill rate
2. **Target geografico**: Gli annunci in paesi come USA, UK, Canada pagano di più
3. **Aggiorna regolarmente**: Monitora le metriche e ottimizza i posizionamenti
4. **Esperienza utente**: Non aggiungere troppi annunci - qualità > quantità

### Metriche da Monitorare

- **eCPM** (Effective Cost Per Mille): Guadagno per 1000 impressioni
- **Fill Rate**: Percentuale di richieste servite con successo
- **Click-Through Rate (CTR)**: Percentuale di click sugli annunci
- **Impression per utente**: Numero medio di visualizzazioni per utente

## 🔧 Posizionamenti Futuri (Opzionali)

Se vuoi aggiungere più annunci in futuro, considera questi posizionamenti non invasivi:

### Preset Manager Screen

```jsx
// In src/screens/PresetManagerScreen.js
<AdBanner size="small" style={styles.adBanner} adUnitId="YOUR_AD_UNIT_ID" />
```

Posiziona il banner tra "Preset Predefiniti" e "Preset Personalizzati"

### Settings Screen

```jsx
// In src/screens/SettingsScreen.js
<AdBanner size="small" style={styles.adBanner} adUnitId="YOUR_AD_UNIT_ID" />
```

Posiziona dopo il toggle "Dark Mode"

### Annunci Interstitial (Avanzato)

Per annunci a schermo intero che appaiono tra le schermate:

```bash
npm install react-native-google-mobile-ads
```

```jsx
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

const interstitial = InterstitialAd.createForAdRequest(
  'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY'
);

// Mostra dopo aver salvato una partita
interstitial.show();
```

**⚠️ Attenzione**: Gli interstitial sono invasivi - usali con parsimonia!

## 📊 Compliance e Privacy

### GDPR (Europa)

Se hai utenti europei, devi:

1. Implementare un Consent Management Platform (CMP)
2. Chiedere il consenso prima di mostrare annunci personalizzati
3. Rispettare le scelte degli utenti

Soluzione raccomandata: [react-native-google-mobile-ads Consent](https://docs.page/invertase/react-native-google-mobile-ads/european-user-consent)

### COPPA (USA)

Se l'app è rivolta a bambini sotto i 13 anni:

```jsx
requestOptions={{
  tagForChildDirectedTreatment: true,
  requestNonPersonalizedAdsOnly: true,
}}
```

## 🐛 Troubleshooting

### Gli annunci non appaiono

- **Verifica gli ID**: Assicurati che gli App ID e Ad Unit ID siano corretti
- **Wait time**: Nuove unità pubblicitarie possono richiedere fino a 24h per attivarsi
- **Test IDs**: In sviluppo, usa sempre i Test IDs per evitare ban
- **Log**: Controlla i log per errori: `console.log` in `AdBanner.js`

### "No fill" errors

- Normale durante lo sviluppo
- Migliora con il tempo quando l'app ha più utenti
- Attiva la mediazione nel dashboard AdMob

### L'app crasha

- Reinstalla i pod: `cd ios && pod install`
- Ricostruisci l'app: `npx react-native run-android --reset-cache`
- Verifica che `react-native-google-mobile-ads` sia installato correttamente

## 📚 Risorse Utili

- [Documentazione react-native-google-mobile-ads](https://docs.page/invertase/react-native-google-mobile-ads)
- [AdMob Help Center](https://support.google.com/admob)
- [Best Practices AdMob](https://support.google.com/admob/answer/6128543)
- [Policy AdMob](https://support.google.com/admob/answer/6128543)

## 🎉 Congratulazioni!

Hai integrato AdMob in modo non invasivo. Monitora le tue entrate nel dashboard AdMob e ottimizza gradualmente i posizionamenti per massimizzare i guadagni!

---

**Nota**: Attualmente l'app usa **Test IDs** di AdMob. Gli annunci reali appariranno solo dopo aver completato i passaggi sopra e pubblicato l'app.
