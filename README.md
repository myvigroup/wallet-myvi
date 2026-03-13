# wallet.myvi.de – Digitale Visitenkarte (Apple Wallet)

Berater erstellen sich selbst ihre persönliche Apple Wallet Visitenkarte.

## Stack
- **Next.js 14** (App Router)
- **Supabase** (Berater-Profile & Logs)
- **passkit-generator** (.pkpass Erstellung)
- **Vercel** (Hosting)

---

## 1. Apple Developer Zertifikate einrichten

### Schritt 1: Pass Type ID anlegen
1. Öffne [developer.apple.com/account](https://developer.apple.com/account)
2. → Certificates, IDs & Profiles → Identifiers → + (Plus)
3. → **Pass Type IDs** auswählen → Continue
4. Description: `MYVI Visitenkarte`, Identifier: `pass.de.myvi.visitenkarte`
5. → Register

### Schritt 2: Zertifikat erstellen
1. Identifier anklicken → **Edit**
2. → Create Certificate → CSR-Datei hochladen (mit Keychain erstellt)
3. Zertifikat herunterladen → `pass.cer`
4. Doppelklick → Keychain Access

### Schritt 3: Exportieren als .p12
1. Keychain Access → Mein Zertifikat suchen → Rechtsklick → Exportieren
2. Als `.p12` speichern, Passwort vergeben (merken für `PASS_PHRASE`)

### Schritt 4: PEM-Dateien erstellen
```bash
# signerCert.pem
openssl pkcs12 -in pass.p12 -clcerts -nokeys -out certs/signerCert.pem -passin pass:DEIN_PASSWORT

# signerKey.pem
openssl pkcs12 -in pass.p12 -nocerts -out certs/signerKey.pem -passin pass:DEIN_PASSWORT -passout pass:DEIN_PASSWORT

# WWDR (Apple Intermediate Certificate)
curl -o certs/wwdr.pem https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer
# Falls das nicht klappt: von https://www.apple.com/certificateauthority/ herunterladen
# Dann konvertieren:
# openssl x509 -inform DER -in AppleWWDRCAG4.cer -out certs/wwdr.pem
```

> ⚠️ `certs/` ist in `.gitignore`. Zertifikate NIEMALS committen.
> Für Vercel: Inhalte als Umgebungsvariablen (Base64) hinterlegen.

---

## 2. Projekt Setup

```bash
git clone https://github.com/myvigroup/wallet-myvi
cd wallet-myvi
npm install
cp .env.local.example .env.local
# .env.local mit eigenen Werten füllen
npm run dev
```

---

## 3. Supabase Setup

```bash
# Supabase CLI
npx supabase init
npx supabase db push --db-url "postgresql://..."
# Oder: SQL direkt im Supabase Dashboard ausführen
```

SQL-Datei: `supabase/schema.sql`

---

## 4. Vercel Deployment

```bash
vercel --prod
```

### Umgebungsvariablen in Vercel:
| Variable | Beschreibung |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Projekt URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key |
| `SUPABASE_SERVICE_KEY` | Supabase Service Role Key |
| `APPLE_TEAM_ID` | 10-stellige Apple Team ID |
| `APPLE_PASS_TYPE_ID` | `pass.de.myvi.visitenkarte` |
| `PASS_PHRASE` | Passwort für signerKey |
| `CERT_SIGNER_CERT` | Inhalt signerCert.pem (Base64) |
| `CERT_SIGNER_KEY` | Inhalt signerKey.pem (Base64) |
| `CERT_WWDR` | Inhalt wwdr.pem (Base64) |

### Zertifikate als Base64 für Vercel:
```bash
base64 -i certs/signerCert.pem | pbcopy  # → in CERT_SIGNER_CERT
base64 -i certs/signerKey.pem | pbcopy   # → in CERT_SIGNER_KEY
base64 -i certs/wwdr.pem | pbcopy        # → in CERT_WWDR
```

---

## 5. Eigene Logos hinzufügen

Lege folgende Dateien in `passes/visitenkarte/`:
- `icon.png` (29×29px)
- `icon@2x.png` (58×58px)
- `logo.png` (160×50px)
- `logo@2x.png` (320×100px)

---

## Projektstruktur

```
wallet-myvi/
├── app/
│   ├── page.tsx                 ← Berater-Formular (Hauptseite)
│   ├── layout.tsx
│   ├── globals.css
│   ├── success/page.tsx         ← Erfolgsseite
│   └── api/pass/generate/
│       └── route.ts             ← .pkpass API Route
├── lib/
│   ├── supabase.ts              ← Supabase Client
│   └── passkit.ts               ← Pass-Generierung
├── passes/visitenkarte/         ← Pass-Template
│   ├── pass.json
│   ├── icon.png
│   └── logo.png
├── certs/                       ← GITIGNORED
├── supabase/
│   └── schema.sql
└── .env.local.example
```
