# 🃏 Segnapunti - React Native Migration

## ⚠️ WORK IN PROGRESS

Migrazione da PWA a React Native in corso.

## ✅ Completato

- Struttura progetto React Native
- StorageService (AsyncStorage)
- Contexts (Theme + Game)
- Navigazione (Bottom Tabs)
- 5 Screen base
- Constants (colors, presets)

## 🚧 Da Fare

**PRIORITY:**
1. Implementa progetto Android nativo:
   ```bash
   npx react-native init SegnapuntiNative
   # Copia android/ in questo progetto
   ```

2. Installa dipendenze:
   ```bash
   npm install
   ```

3. Completa GameScreen con:
   - Lista giocatori
   - Pulsanti +/- punteggio
   - Logica vittoria

4. Completa altri screen

5. Build APK:
   ```bash
   cd android && ./gradlew assembleRelease
   ```

## 📂 Struttura

```
src/
├── App.js
├── contexts/ (Theme, Game)
├── services/ (Storage)
├── navigation/ (AppNavigator)
├── screens/ (5 screens)
├── constants/ (colors, presets)
└── components/ (TODO)
```

## 🚀 Quick Start

```bash
# 1. Init Android
npx react-native init Temp
cp -r Temp/android .
rm -rf Temp

# 2. Install
npm install

# 3. Run
npm run android
```

## 📖 Docs

Vedi documentazione React Native ufficiale:
https://reactnative.dev/

---

**Nota:** Questa è la base. Serve completare tutti i componenti UI e la logica di gioco.
