# Vinotheque auf Hetzner Cloud deployen

## Schritt-für-Schritt Anleitung

Du brauchst nur die **Hetzner Cloud Console** (cloud.hetzner.com) und ein Terminal.

---

### Schritt 1: Server vorbereiten (Hetzner Cloud Console)

1. Gehe zu https://cloud.hetzner.com
2. Klicke auf **"Servers"** → **Dein Server**
3. Notiere dir die **IP-Adresse** deines Servers (z.B. `65.21.xxx.xxx`)

Falls du noch keinen Server hast:
1. Klicke **"Add Server"**
2. Wähle **Location**: Falkenstein oder Nürnberg
3. Wähle **Image**: **Ubuntu 24.04**
4. Wähle **Type**: **CX22** (2 vCPU, 4GB RAM) — reicht locker, kostet ca. 4€/Monat
5. Erstelle einen **SSH Key** (siehe Schritt 2) oder nutze ein Root-Passwort
6. Klicke **"Create & Buy Now"**

---

### Schritt 2: Mit dem Server verbinden

Öffne ein Terminal (auf Mac: Terminal-App, auf Windows: PowerShell oder [PuTTY](https://putty.org)):

```bash
ssh root@DEINE-SERVER-IP
```

Beim ersten Mal wirst du gefragt: `Are you sure you want to continue connecting?` → Tippe `yes`

Gib dann dein Root-Passwort ein (das bei Server-Erstellung festgelegt wurde).

---

### Schritt 3: Docker installieren (auf dem Server)

Kopiere diesen gesamten Block und füge ihn ins Terminal ein:

```bash
curl -fsSL https://get.docker.com | sh
```

Warte bis es fertig ist (ca. 1-2 Minuten). Dann prüfe:

```bash
docker --version
```

Du solltest etwas wie `Docker version 27.x.x` sehen.

---

### Schritt 4: App auf den Server bringen

Auf dem Server:

```bash
cd /opt
git clone https://github.com/yves4478/vinotheque-aid.git
cd vinotheque-aid
```

---

### Schritt 5: Passwörter setzen

Erstelle eine `.env` Datei mit sicheren Passwörtern:

```bash
cat > .env << 'EOF'
DB_ROOT_PASSWORD=hier-ein-sicheres-root-passwort
DB_PASSWORD=hier-ein-sicheres-db-passwort
EOF
```

**Wichtig:** Ersetze die Passwörter durch eigene! Z.B. `MeinWeinKeller2024!`

---

### Schritt 6: App starten

```bash
docker compose up -d --build
```

Das dauert beim ersten Mal 2-5 Minuten (Docker lädt und baut alles).

Prüfe ob alles läuft:

```bash
docker compose ps
```

Du solltest 2 Container sehen, beide mit Status `Up`:
- `vinotheque-aid-db-1` (MariaDB)
- `vinotheque-aid-app-1` (Deine App)

---

### Schritt 7: Testen!

Öffne im Browser:

```
http://DEINE-SERVER-IP
```

Du solltest deinen Weinkeller sehen! 🍷

---

## Nützliche Befehle

```bash
# App stoppen
docker compose down

# App neu starten
docker compose up -d

# Logs anschauen (wenn etwas nicht funktioniert)
docker compose logs -f

# App aktualisieren (nach Code-Änderungen)
cd /opt/vinotheque-aid
git pull
docker compose up -d --build
```

---

## Troubleshooting

**Browser zeigt nichts an:**
- Prüfe Firewall: In der Hetzner Cloud Console → Networking → Firewalls
- Port 80 (HTTP) muss offen sein
- Oder es gibt noch keine Firewall (dann ist alles offen = OK)

**"Connection refused":**
```bash
docker compose logs app
```
→ Zeigt dir Fehler im Backend

**Datenbank-Fehler:**
```bash
docker compose logs db
```
→ Zeigt dir DB-Probleme
