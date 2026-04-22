# DEV Environment: macOS VM als lokale Arbeitsumgebung

## Kurzurteil

Ja, die Theorie ist gut fuer dieses Projekt.

Der Grund: Das Repo ist nicht nur eine Vite/React-Web-App, sondern enthaelt auch eine Expo/React-Native-iOS-App. Fuer iOS-Simulator, Xcode und lokale native Builds ist macOS weiterhin die pragmatischste Entwicklungsumgebung. Eine macOS-VM in UTM gibt Claude Code und Codex einen klar begrenzten Spielplatz, waehrend dein echter Mac wieder eher ein "thin client" wird.

Die Zielarchitektur:

- GitHub bleibt die Hauptablage.
- Die UTM-macOS-VM ist DEV: Code, Node, Xcode, Simulator, Tests, Claude Code, Codex.
- Cloud-Server sind nicht mehr DEV. Dort laufen spaeter nur PROD und optional PREPROD.
- Der Host-Mac enthaelt idealerweise keine Projekt-Clones, keine lokalen Agent-Secrets und keine Build-Caches mehr.

## Wichtige Grenzen

- macOS-Gaeste in UTM sind auf Apple Silicon Hosts mit macOS 12+ vorgesehen.
- UTM nutzt fuer macOS-Gaeste Apples Virtualization Framework. Einige Features sind eingeschraenkt, besonders USB-Sharing. Fuer physische iPhones ist die VM daher nicht die beste Umgebung; fuer iOS Simulator und EAS/TestFlight ist sie gut.
- Xcode ist gross. Plane genug Speicher ein.
- Teile den Projektordner nicht als Host-Shared-Folder in die VM. Klone das Repository direkt in der VM. Shared Folders sind gut fuer Dateiuebergabe, aber nicht als aktiver Node/Xcode-Working-Tree.

## UTM VM anlegen

Empfohlene VM:

- macOS-Gast: aktuelle stabile Version, per UTM "Virtualization" -> "macOS 12+".
- CPU: 6-8 Kerne, wenn der Host genug Reserven hat.
- RAM: 16 GB Minimum fuer angenehmes Xcode/Simulator-Arbeiten; 24 GB besser.
- Disk: 160 GB Minimum, 250 GB entspannter.
- Netzwerk: NAT reicht. Fuer Web-Test vom Host aus entweder im VM-Browser testen oder Vite mit `--host 0.0.0.0` starten.

Snapshots:

1. `base-macos`: direkt nach macOS-Installation.
2. `xcode-ready`: nach Xcode, Command Line Tools und Simulator Runtime.
3. `dev-tools-ready`: nach Homebrew, Node, GitHub CLI, Claude Code, Codex.
4. `project-green`: nachdem `npm test`, `npm run build` und `npm run lint` im Projekt gruen sind.

## Manuelle Schritte in der VM

1. Xcode aus dem App Store installieren.
2. Xcode einmal oeffnen und die Zusatzkomponenten installieren lassen.
3. In Xcode unter Settings -> Platforms eine iOS Simulator Runtime installieren, falls noch keine vorhanden ist.
4. Terminal oeffnen:

```sh
xcode-select --install
```

5. Repository in der VM klonen:

```sh
mkdir -p ~/Developer
cd ~/Developer
git clone git@github.com:ORG/REPO.git vinotheque-aid
cd vinotheque-aid
```

6. Setup-Skript starten:

```sh
chmod +x scripts/setup-macos-vm-dev.sh
./scripts/setup-macos-vm-dev.sh
```

Falls du das Skript ohne vorherigen Clone nutzt, kannst du es mit Repository-URL starten:

```sh
REPO_URL=git@github.com:ORG/REPO.git ./scripts/setup-macos-vm-dev.sh
```

7. Danach interaktiv anmelden:

```sh
gh auth login
claude
codex --login
```

## Was das Setup-Skript installiert

Das Skript `scripts/setup-macos-vm-dev.sh` richtet ein:

- Homebrew
- Git, Git LFS, GitHub CLI
- fnm und Node.js 20
- watchman, cocoapods, ripgrep, jq, direnv
- Claude Code und Codex CLI
- Projekt-Dependencies via `npm ci`
- Projektchecks: `npm test`, `npm run build`, `npm run lint`
- Expo-Basischeck mit `npx expo-doctor`

Node.js 20 ist hier bewusst konservativ gewaehlt: neu genug fuer moderne Toolchains und stabiler fuer Expo SDK 52 als sehr neue Node-Major-Versionen.

## Taegliche Arbeit

Web-App:

```sh
cd ~/Developer/vinotheque-aid
npm run dev
```

Falls du vom Host-Mac-Browser auf die VM zugreifen willst:

```sh
npm run dev -- --host 0.0.0.0
```

Dann die IP der VM verwenden.

Checks:

```sh
npm test
npm run build
npm run lint
```

Mobile:

```sh
cd ~/Developer/vinotheque-aid/apps/mobile
npx expo start
```

Im Expo-Terminal:

- `i` oeffnet den iOS Simulator.
- `r` laedt neu.
- `m` oeffnet das Development Menu.

Native iOS Build:

```sh
cd ~/Developer/vinotheque-aid/apps/mobile
npx expo run:ios
```

## Agenten-Regeln in der VM

Claude Code und Codex duerfen in der VM grosszuegiger laufen, weil der Schaden auf die VM begrenzt ist. Trotzdem:

- Eigene GitHub SSH Keys nur fuer die VM erzeugen.
- Keine PROD-Secrets in die VM legen.
- PROD-Deployments nur aus GitHub/CI oder klaren Release-Tags.
- Claude und Codex arbeiten auf Branches, nicht direkt auf `main`.
- `main` in GitHub schuetzen: PR erforderlich, Checks erforderlich.
- Fuer parallele Arbeit Branch-Prefixe nutzen, z.B. `codex/...` und `claude/...`.

## Cloud-Server Rolle

Der Cloud-Server sollte nicht mehr als Entwicklungsmaschine dienen.

Empfohlen:

- PREPROD deployt von Branch `preprod` oder GitHub Environment `preprod`.
- PROD deployt nur von Release-Tags oder geschuetztem `main`.
- SSH-Zugriff auf Cloud-Server nur fuer Betrieb, Logs, Notfall.
- Kein `npm install`, kein Agent, keine lokalen Code-Aenderungen direkt auf PROD.

## Host-Mac bereinigen

Erst wenn die VM gruen ist:

1. Alle lokalen Aenderungen pushen oder bewusst verwerfen.
2. VM-Snapshot `project-green` erstellen.
3. Dry-Run auf dem Host-Mac starten:

```sh
scripts/cleanup-local-dev-host.sh
```

4. Wenn die Liste stimmt:

```sh
scripts/cleanup-local-dev-host.sh --apply
```

5. Fuer groessere lokale Build-Caches:

```sh
scripts/cleanup-local-dev-host.sh --deep
scripts/cleanup-local-dev-host.sh --deep --apply
```

6. Fuer lokale Codex/Claude/OpenAI-Konfiguration nur nach bewusster Entscheidung:

```sh
DELETE_AI_STATE_CONFIRM=YES scripts/cleanup-local-dev-host.sh --ai-state --apply
```

Das Cleanup-Skript loescht standardmaessig keine SSH Keys, keine globale Git-Konfiguration, kein Xcode, kein Homebrew und keine komplette `~/Library`.

## Quellen

- UTM macOS Guest Support: https://docs.getutm.app/guest-support/macos/
- Apple Virtualization Framework fuer macOS VMs: https://developer.apple.com/documentation/Virtualization/running-macos-in-a-virtual-machine-on-apple-silicon
- Homebrew Installation: https://docs.brew.sh/Installation.html
- Expo CLI und `npx expo run:ios`: https://docs.expo.dev/more/expo-cli/
- Claude Code Setup: https://docs.anthropic.com/en/docs/claude-code/setup
- OpenAI Codex CLI Getting Started: https://help.openai.com/en/articles/11096431-openai-codex-ci-getting-started
