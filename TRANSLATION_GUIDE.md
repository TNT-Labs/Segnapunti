# 📚 Guida Traduzione Screen Rimanenti

## ✅ Screen Tradotti Completamente
- **AboutScreen** ✅ - Completamente tradotto
- **SettingsScreen** ✅ - Completamente tradotto
- **ScoreModal** ✅ - Completamente tradotto

## 🔄 Screen da Completare

### GameScreen.js
**Pattern da seguire:**

```javascript
// 1. Importa useTranslation
import {useTranslation} from 'react-i18next';

// 2. Usa nel componente
const {t} = useTranslation();

// 3. Sostituisci stringhe:
// Prima:
<Text>🎮 Partita</Text>
// Dopo:
<Text>{t('game.title')}</Text>

// Prima:
Alert.alert('Vincitore!', `${winner.name} ha vinto!`);
// Dopo:
Alert.alert(t('game.winner'), t('game.winnerMessage', {playerName: winner.name, score: winner.score}));
```

**Stringhe principali da tradurre:**
- Titolo schermata
- "Nessuna partita attiva"
- "Vai su Impostazioni per iniziare"
- "Punteggi Attuali"
- Messaggi vincitore
- "Nuova Partita" / "Vedi Storico"

### HistoryScreen.js
**Stringhe da tradurre:**
- "📜 Storico"
- "Nessuna partita nello storico"
- "🗑️ Cancella Tutto"
- "Sei sicuro di voler cancellare tutto lo storico?"
- "Vincitore:", "Giocatori:", "Data:"
- Alert di conferma

### PresetManagerScreen.js
**Stringhe da tradurre:**
- "🎲 Gestione Preset"
- "Preset Predefiniti"
- "I Miei Preset"
- "➕ Nuovo Preset"
- "Nessun preset personalizzato"
- "Sei sicuro di voler eliminare questo preset?"
- Descrizioni modalità (MAX, MIN, ROUNDS, DARTS)

### PlayerCard.js (opzionale)
**Stringhe:**
- Accessibility labels per pulsanti +/-
- Hints per interazioni

### PresetCard.js (opzionale)
**Stringhe:**
- Accessibility labels
- "Obiettivo: X pt"
- "Y rounds"

## 📝 File Traduzioni

Le traduzioni sono già preparate in:
- `src/locales/it.json` ✅ Completo
- `src/locales/en.json` ✅ Completo
- `src/locales/de.json` 🟡 Base
- `src/locales/es.json` 🟡 Base
- `src/locales/fr.json` 🟡 Base

## 🚀 Come Procedere

### 1. GameScreen
```bash
# Apri file
nano src/screens/GameScreen.js

# Aggiungi import
import {useTranslation} from 'react-i18next';

# Nel componente
const {t} = useTranslation();

# Cerca e sostituisci tutte le stringhe hardcoded
```

### 2. HistoryScreen
Stessa procedura di GameScreen

### 3. PresetManagerScreen
Stessa procedura

## ✨ Vantaggi Attuali

Anche con solo AboutScreen, SettingsScreen e ScoreModal tradotti, l'app già:
- ✅ Supporta cambio lingua
- ✅ Persiste la scelta
- ✅ 3/5 screen principali funzionanti
- ✅ Setup completato e funzionante
- ✅ LanguageSelector operativo

## 📊 Stato Completamento

| Screen | Stato | %  |
|--------|-------|-----|
| AboutScreen | ✅ Completo | 100% |
| SettingsScreen | ✅ Completo | 100% |
| ScoreModal | ✅ Completo | 100% |
| GameScreen | 🔄 Da fare | 0% |
| HistoryScreen | 🔄 Da fare | 0% |
| PresetManagerScreen | 🔄 Da fare | 0% |
| PlayerCard | ⭕ Opzionale | - |
| PresetCard | ⭕ Opzionale | - |

**Totale: 3/6 screen tradotti (50%)**

## 🎯 Priorità

1. **GameScreen** (Alta) - Screen principale di gioco
2. **HistoryScreen** (Media) - Storico partite
3. **PresetManagerScreen** (Media) - Gestione preset
4. PlayerCard (Bassa) - Componente UI
5. PresetCard (Bassa) - Componente UI

## 💡 Tips

- Usa sempre `{t('chiave')}` per traduzioni
- Per interpolazione: `{t('chiave', {var: valore})}`
- Test su Impostazioni → Cambia lingua → Verifica screen
- Le traduzioni IT/EN sono complete, DE/ES/FR hanno le basi
