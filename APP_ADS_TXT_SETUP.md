# Guida alla Configurazione di app-ads.txt per AdMob

## Requisito Obbligatorio (da Gennaio 2025)

A partire da gennaio 2025, tutte le app AdMob devono essere verificate tramite un file **app-ads.txt** prima di poter pubblicare completamente gli annunci. Questo file è necessario per:

- ✅ Prevenire frodi pubblicitarie
- ✅ Verificare che hai l'autorizzazione a monetizzare l'app
- ✅ Garantire che solo i venditori autorizzati possano vendere il tuo inventario pubblicitario

## 📄 Il File app-ads.txt

Il file `app-ads.txt` è già stato creato nel repository con il contenuto corretto:

```
google.com, pub-4302173868436591, DIRECT, f08c47fec0942fa0
```

**Importante:** Questo file contiene il tuo ID publisher AdMob (`pub-4302173868436591`).

## 🌐 Dove Ospitare il File

Il file **app-ads.txt** deve essere ospitato sul tuo dominio web personale o aziendale. NON può essere ospitato:
- ❌ Nell'app stessa
- ❌ Su GitHub o repository Git
- ❌ Su servizi di file sharing

### Posizionamento Corretto

Il file deve essere accessibile all'URL radice del tuo dominio:

```
https://tuo-dominio.com/app-ads.txt
```

**Esempio:**
- Se il tuo dominio è `example.com`
- Il file deve essere accessibile a: `https://example.com/app-ads.txt`

### Opzioni di Hosting

1. **Dominio Personale/Aziendale**
   - Se hai un sito web esistente, carica il file nella directory root
   - Esempio: cPanel → File Manager → public_html → carica `app-ads.txt`

2. **GitHub Pages** (se hai un dominio custom)
   - Crea un repository con il file app-ads.txt
   - Configura GitHub Pages con il tuo dominio custom
   - Il file sarà accessibile a `https://tuo-dominio.com/app-ads.txt`

3. **Servizi di Hosting Gratuiti**
   - Netlify (con dominio custom)
   - Vercel (con dominio custom)
   - Firebase Hosting (con dominio custom)

4. **No Dominio?**
   - Puoi acquistare un dominio economico (es. su Namecheap, Google Domains, Cloudflare)
   - Usa un hosting statico gratuito come Netlify o Vercel
   - Costo totale: ~$10-15/anno per il dominio

## 📝 Configurazione nel Play Store

Nel Google Play Store Developer Console, devi specificare il dominio nel quale hai ospitato il file:

1. Vai alla **Developer Console del Play Store**
2. Seleziona la tua app **Segnapunti**
3. Vai su **Configurazione dell'app** → **Dettagli dell'app**
4. Cerca il campo **Sito web dello sviluppatore**
5. Inserisci il tuo dominio: `https://tuo-dominio.com`

**Importante:** Il dominio specificato nel Play Store deve essere lo stesso dove è ospitato app-ads.txt.

## ✅ Verifica dell'App in AdMob

Dopo aver configurato il file app-ads.txt:

1. **Attendi la Scansione**
   - AdMob scansionerà automaticamente il file app-ads.txt
   - Questo può richiedere **24-48 ore**

2. **Verifica l'App**
   - Vai su **AdMob** → **App** → **Segnapunti**
   - Clicca su **Impostazioni app**
   - Clicca su **Verifica app**
   - Clicca su **Verifica la disponibilità di aggiornamenti**

3. **Revisione dell'Idoneità**
   - Dopo la verifica, inizierà la revisione dell'idoneità dell'app
   - L'app potrà pubblicare annunci completamente solo dopo l'approvazione

## 🧪 Test del File app-ads.txt

Per verificare che il file sia configurato correttamente:

1. **Test Manuale**
   - Apri un browser
   - Vai a: `https://tuo-dominio.com/app-ads.txt`
   - Verifica che vedi il contenuto:
     ```
     google.com, pub-4302173868436591, DIRECT, f08c47fec0942fa0
     ```

2. **Controllo in AdMob**
   - Vai su **AdMob** → **Account** → **app-ads.txt**
   - Verifica lo stato del file
   - Dovrebbe mostrare "Verificato" ✅

## 📋 Checklist Completa

- [ ] File app-ads.txt creato con l'ID publisher corretto
- [ ] File ospitato sul dominio web a: `https://tuo-dominio.com/app-ads.txt`
- [ ] Dominio dello sviluppatore configurato nel Play Store
- [ ] File accessibile pubblicamente (test nel browser)
- [ ] Atteso 24-48 ore per la scansione AdMob
- [ ] App verificata in AdMob tramite "Verifica app"
- [ ] Stato file app-ads.txt verificato in AdMob
- [ ] Revisione dell'idoneità dell'app completata

## ❓ Risoluzione Problemi

### Il file non viene trovato

- Verifica che il file sia nella directory root del dominio
- Il nome del file deve essere esattamente: `app-ads.txt` (minuscolo)
- Il file deve essere di tipo `text/plain`
- Non devono esserci redirect o errori 404

### Il dominio non corrisponde

- Il dominio nel Play Store deve essere lo stesso dove è ospitato il file
- Usa `https://` non `http://`

### Errori di formato

- Il file deve contenere esattamente:
  ```
  google.com, pub-4302173868436591, DIRECT, f08c47fec0942fa0
  ```
- Non aggiungere spazi extra o righe vuote alla fine
- Usa la codifica UTF-8

## 📚 Riferimenti

- [Guida ufficiale app-ads.txt di Google](https://support.google.com/admob/answer/9787654)
- [Risoluzione problemi app-ads.txt](https://support.google.com/admob/answer/10441149)
- [Developer Console del Play Store](https://play.google.com/console)
- [AdMob Console](https://apps.admob.com/)

## 🎯 Prossimi Passi

1. Ospita il file `app-ads.txt` sul tuo dominio
2. Configura il dominio nel Play Store
3. Attendi la scansione AdMob (24-48 ore)
4. Verifica l'app in AdMob
5. Pubblica l'app sul Play Store

---

**Nota:** Senza la verifica app-ads.txt, l'app non potrà pubblicare completamente gli annunci dopo gennaio 2025. Assicurati di completare questo passaggio prima della pubblicazione sul Play Store.
