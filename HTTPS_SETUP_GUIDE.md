# 🔒 Guida Setup HTTPS per Segnapunti PWA

## Prerequisiti

- ✅ Dominio registrato (es: `segnapunti.tuodominio.com`)
- ✅ Server web (Apache, Nginx, o hosting provider)
- ✅ Accesso SSH al server (o pannello di controllo hosting)

---

## Opzione 1: Hosting Gratuito con HTTPS Automatico (CONSIGLIATO)

### A) GitHub Pages + Cloudflare (100% Gratis)

#### Step 1: Deploy su GitHub Pages

```bash
# Nel repository Segnapunti
git checkout main
git pull origin main

# Abilita GitHub Pages
# Vai su: Settings > Pages > Source: main branch
```

**URL automatico:** `https://tnt-labs.github.io/Segnapunti/`

#### Step 2: Custom Domain con Cloudflare (Opzionale)

1. **Registra dominio** (es: Namecheap, GoDaddy, o usa uno esistente)

2. **Aggiungi a Cloudflare** (gratis):
   ```
   https://dash.cloudflare.com/
   > Add Site
   > segnapunti.com
   > Free Plan
   ```

3. **Configura DNS**:
   ```
   Type: CNAME
   Name: @
   Content: tnt-labs.github.io
   Proxy: ✅ Proxied (orange cloud)
   ```

4. **HTTPS Automatico**:
   - Cloudflare abilita SSL automaticamente
   - Certificato valido in 5-10 minuti
   - Redirect HTTP→HTTPS automatico

**Costo:** 💵 €0/mese

---

### B) Netlify (Semplicissimo, HTTPS automatico)

#### Setup in 5 Minuti

1. **Vai su** [netlify.com](https://netlify.com)
2. **Sign up** con GitHub
3. **New site from Git** → Seleziona repo `Segnapunti`
4. **Build settings:**
   ```
   Build command: (lascia vuoto)
   Publish directory: .
   ```
5. **Deploy!**

**URL automatico:** `https://segnapunti-app.netlify.app`

#### Custom Domain (Opzionale)

```
Site settings > Domain management > Add custom domain
> segnapunti.com
> Verify ownership
> HTTPS automatico attivo in ~1 minuto
```

**Costo:** 💵 €0/mese (100GB bandwidth gratis)

---

### C) Vercel (Alternativa simile a Netlify)

```bash
npm install -g vercel

cd /home/user/Segnapunti
vercel login
vercel --prod
```

**URL automatico:** `https://segnapunti.vercel.app`

**Costo:** 💵 €0/mese

---

## Opzione 2: Server Proprio (VPS/Dedicato)

### Setup con Let's Encrypt (Certificato SSL Gratuito)

#### Prerequisiti

- Server Ubuntu/Debian con accesso root
- Dominio puntato al server IP
- Nginx o Apache installato

#### A) Con Nginx

```bash
# 1. Installa Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# 2. Configura Nginx
sudo nano /etc/nginx/sites-available/segnapunti

# Incolla questa configurazione:
server {
    listen 80;
    server_name segnapunti.tuodominio.com;

    root /var/www/segnapunti;
    index index.html;

    # Abilita compressione gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache statica
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker - NO cache
    location /service-worker.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}

# 3. Abilita il sito
sudo ln -s /etc/nginx/sites-available/segnapunti /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 4. Upload files
sudo mkdir -p /var/www/segnapunti
sudo chown -R $USER:$USER /var/www/segnapunti

# Da locale:
rsync -avz --progress ./ user@server:/var/www/segnapunti/

# 5. Ottieni certificato SSL (HTTPS)
sudo certbot --nginx -d segnapunti.tuodominio.com

# Certbot configurerà automaticamente HTTPS!
# Rispondi alle domande:
# - Email: tua@email.com
# - Accept terms: Yes
# - Redirect HTTP to HTTPS: Yes (2)

# 6. Test auto-renewal
sudo certbot renew --dry-run
```

#### B) Con Apache

```bash
# 1. Installa Certbot
sudo apt update
sudo apt install certbot python3-certbot-apache -y

# 2. Configura Apache
sudo nano /etc/apache2/sites-available/segnapunti.conf

# Incolla:
<VirtualHost *:80>
    ServerName segnapunti.tuodominio.com
    DocumentRoot /var/www/segnapunti

    <Directory /var/www/segnapunti>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Gzip compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/css application/json application/javascript text/xml application/xml
    </IfModule>

    # Cache control
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType image/jpg "access plus 1 year"
        ExpiresByType image/jpeg "access plus 1 year"
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType text/css "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
    </IfModule>

    ErrorLog ${APACHE_LOG_DIR}/segnapunti_error.log
    CustomLog ${APACHE_LOG_DIR}/segnapunti_access.log combined
</VirtualHost>

# 3. Abilita moduli e sito
sudo a2enmod rewrite expires deflate headers
sudo a2ensite segnapunti
sudo apache2ctl configtest
sudo systemctl reload apache2

# 4. Upload files
sudo mkdir -p /var/www/segnapunti
sudo chown -R $USER:$USER /var/www/segnapunti
# rsync come sopra

# 5. Ottieni certificato SSL
sudo certbot --apache -d segnapunti.tuodominio.com
```

---

## Opzione 3: Hosting Condiviso (cPanel/Plesk)

### Con cPanel

1. **Accedi a cPanel**
2. **File Manager** → Upload tutti i file di Segnapunti
3. **Domains** → Addon Domains:
   ```
   New Domain: segnapunti.tuodominio.com
   Document Root: /public_html/segnapunti
   ```
4. **SSL/TLS** → Let's Encrypt SSL:
   ```
   ✅ Enable per segnapunti.tuodominio.com
   ```
5. **HTTPS Redirect** (in .htaccess):
   ```apache
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

**Tempo totale:** ~10 minuti

---

## Verifica HTTPS Funzionante

### 1. Test Certificato

```bash
# Da terminale:
curl -I https://segnapunti.tuodominio.com

# Deve mostrare:
# HTTP/2 200
# server: nginx
# content-type: text/html
```

### 2. SSL Labs Test

Vai su: https://www.ssllabs.com/ssltest/

```
Enter hostname: segnapunti.tuodominio.com
> Submit
```

**Target:** Grade A o A+

### 3. Browser Test

```
1. Apri https://segnapunti.tuodominio.com
2. Clicca sul lucchetto nella barra URL
3. Verifica: "Connection is secure" ✅
4. Certificato valido e non scaduto ✅
```

---

## Configurazione DNS (Per Qualsiasi Opzione)

### Cloudflare DNS (Consigliato)

```
Type: A
Name: segnapunti
Content: [IP_SERVER]
Proxy: ✅ Proxied (per CDN + DDoS protection gratis)
TTL: Auto
```

### DNS Provider Standard

```
Type: A
Name: segnapunti
Value: [IP_SERVER]
TTL: 3600
```

**Propagazione:** 5 minuti - 48 ore (solitamente <1 ora)

---

## Security Headers (Raccomandati)

### Nginx

```nginx
# In server block:
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# CSP - Adatta per Google AdSense
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://adservice.google.com https://www.googletagmanager.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://pagead2.googlesyndication.com; frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com;" always;
```

### Apache

```apache
# In .htaccess o VirtualHost:
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
```

---

## Aggiornamento assetlinks.json

Dopo aver configurato HTTPS, aggiorna il file:

```json
// .well-known/assetlinks.json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.tntlabs.segnapunti",
    "sha256_cert_fingerprints": [
      "YOUR_SHA256_HERE"
    ]
  }
}]
```

**IMPORTANTE:** Il file DEVE essere accessibile via HTTPS:
```
https://segnapunti.tuodominio.com/.well-known/assetlinks.json
```

Verifica con:
```bash
curl https://segnapunti.tuodominio.com/.well-known/assetlinks.json
```

---

## Troubleshooting

### Problema: "Connection not secure"

```bash
# Verifica certificato:
sudo certbot certificates

# Forza renewal:
sudo certbot renew --force-renewal
```

### Problema: Mixed Content (HTTP in HTTPS)

```javascript
// Verifica che tutte le risorse usino HTTPS o relative paths
// ❌ BAD:
<script src="http://example.com/script.js"></script>

// ✅ GOOD:
<script src="https://example.com/script.js"></script>
<script src="/script.js"></script>
```

### Problema: Service Worker non funziona

```javascript
// Service Worker richiede HTTPS obbligatorio
// Eccezione: localhost per testing

// Verifica che service-worker.js sia servito con header corretti:
Cache-Control: no-cache, no-store, must-revalidate
```

### Problema: assetlinks.json non trovato

```bash
# Verifica permessi:
sudo chmod 644 /var/www/segnapunti/.well-known/assetlinks.json
sudo chmod 755 /var/www/segnapunti/.well-known

# Verifica Nginx config:
location ~ /.well-known {
    allow all;
}
```

---

## Costi Stimati

| Soluzione | Setup | Mensile | Anno | Note |
|-----------|-------|---------|------|------|
| **GitHub Pages + Cloudflare** | €0 | €0 | €0 | ⭐ Consigliato per iniziare |
| **Netlify Free** | €0 | €0 | €0 | ⭐ Semplicissimo |
| **Vercel Free** | €0 | €0 | €0 | Ottimo per developers |
| **VPS (DigitalOcean)** | €0 | €6 | €72 | Più controllo |
| **VPS (Hetzner)** | €0 | €4.5 | €54 | EU servers |
| **Hosting Condiviso** | €0 | €3-8 | €36-96 | Facile ma limitato |

---

## Raccomandazione Finale

### 🏆 Per Segnapunti, consiglio:

**Opzione A: Netlify** (5 minuti setup)
```bash
1. Fork repo su tuo account GitHub
2. Connetti a Netlify
3. Deploy automatico
4. HTTPS automatico
5. Custom domain opzionale
```

**Pro:**
- ✅ Zero configurazione
- ✅ HTTPS automatico
- ✅ Deploy automatici ad ogni push
- ✅ CDN globale incluso
- ✅ 100GB bandwidth/mese gratis
- ✅ Rollback facile
- ✅ Preview per ogni PR

**Contro:**
- ⚠️ Limitato a 300 build/mese (più che sufficiente)

---

## Next Step

Dopo aver attivato HTTPS:

1. ✅ Testa PWA install da mobile
2. ✅ Verifica assetlinks.json accessibile
3. ✅ Ottieni SHA-256 fingerprint per TWA
4. ✅ Aggiorna manifest.json con URL production
5. ✅ Deploy privacy policy (prossimo step!)

---

**Hai bisogno di aiuto con una specifica piattaforma?** Fammi sapere quale preferisci e ti guido passo-passo! 🚀
