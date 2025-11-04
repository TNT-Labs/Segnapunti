// src/storage/DataPersistence.js

const DB_NAME = 'ScoreTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'scores';
let db;

/**
 * Richiede lo storage persistente al browser. Cruciale per la stabilità MMP.
 * @returns {Promise<boolean>} Vero se la persistenza è garantita.
 */
async function requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        if (isPersisted) {
            console.log("Storage già persistente.");
            return true;
        }
        
        const granted = await navigator.storage.persist();
        if (granted) {
            console.log("Persistenza storage garantita.");
            return true;
        } else {
            console.warn("Storage persistente negato. I dati potrebbero essere cancellati in condizioni di bassa memoria (rischio su iOS).");
            // Implementare qui una notifica all'utente se la persistenza è negata.
            return false;
        }
    }
    return false;
}

/**
 * Apre la connessione a IndexedDB.
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("Errore nell'apertura di IndexedDB:", event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

/**
 * Salva i dati (es. punteggio o modello di gioco) in IndexedDB.
 */
async function saveData(data) {
    if (!db) await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(data); 
    return tx.complete;
}

/**
 * Avvia la strategia di persistenza all'inizio dell'applicazione.
 */
export async function initializePersistence() {
    await openDB();
    await requestPersistentStorage();
}

// Altre funzioni di lettura e cancellazione per la gestione completa dei dati...