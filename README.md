# 🃏 Segnapunti - PWA Scorekeeper

**Versione:** 1.3.3
**Ultima modifica:** 2025-01-23

Progressive Web App per tenere il punteggio di giochi di carte e da tavolo. Supporta modalità offline, dark mode, preset personalizzabili e sistema di monetizzazione con Google AdMob.

---

## 📋 Indice

- [Features](#features)
- [Architettura](#architettura)
- [Struttura del Progetto](#struttura-del-progetto)
- [Setup e Installazione](#setup-e-installazione)
- [Moduli Principali](#moduli-principali)
- [Bug Fixes History](#bug-fixes-history)
- [Tecnologie Utilizzate](#tecnologie-utilizzate)

---

## ✨ Features

### Core Features
- ✅ **Gestione Punteggi**: Tracciamento punteggi multi-giocatore con cronologia rounds
- ✅ **Modalità Offline**: Service Worker con caching intelligente
- ✅ **Dark Mode**: Tema scuro con sincronizzazione cross-tab
- ✅ **Preset Giochi**: Sistema di preset personalizzabili (Scala 40, Burraco, etc.)
- ✅ **Storico Partite**: Persistenza dati con IndexedDB + localStorage fallback
- ✅ **PWA**: Installabile come app nativa su mobile e desktop

### Premium Features
- 💎 **Ad-Free**: Rimozione pubblicità
- 💎 **Preset Illimitati**: Gestione preset personalizzati senza limiti

### Accessibilità & Sicurezza
- ♿ **WCAG 2.1 Compliant**: aria-labels, role attributes
- 🔒 **CSP Headers**: Content Security Policy per prevenire XSS
- 🛡️ **Error Boundary**: Handler globale per errori catastrofici

---

## 🐛 Bug Fixes History

### v1.3.3 - LOW Priority Bugs (2025-01-23)

#### BUG #41: Console.log in Production
- **Problema**: 100+ console.log in production
- **Fix**: Creato modulo logger.js che disabilita log in production

#### BUG #42: Magic Numbers
- **Problema**: Timeout e limiti hardcoded
- **Fix**: Sostituiti con costanti nomenclate

#### BUG #43: Polyfills Mancanti
- **Problema**: Compatibilità limitata con browser vecchi
- **Fix**: Creato polyfills.js

#### BUG #44: CSP Headers Mancanti
- **Problema**: Nessuna protezione XSS
- **Fix**: Aggiunto meta tag Content-Security-Policy

#### BUG #45: Inline Styles
- **Problema**: Troppi stili inline
- **Fix**: Creato utility-classes.css con utility classes riutilizzabili

#### BUG #46: Error Boundary Globale
- **Problema**: Errori catastrofici crashano l'app senza recovery
- **Fix**: Creato error-handler.js con fallback UI

#### BUG #47: Mancanza Documentazione
- **Problema**: Nessuna documentazione tecnica
- **Fix**: Creato README.md completo

---

**Segnapunti** - L'app segnapunti definitiva per ogni gioco 🃏🎲🎮
