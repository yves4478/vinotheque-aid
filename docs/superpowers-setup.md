# Agentic Frameworks – Setup-Guide für VM-Umgebung (claude.ai/code)

> Diese Anleitung beschreibt die verfügbaren Frameworks, die Claude Code und Codex
> mit strukturierten Entwicklungs-Skills erweitern, und erklärt wie sie in einer
> Web-VM installiert werden, wo Sessions ephemer sind.

---

## Übersicht: Welches Framework für was?

| Framework | Fokus | Beste Wahl wenn… |
|---|---|---|
| **Superpowers** | TDD, Planung, Reviews | Du diszipliniert vorgehen willst |
| **GSD** | Autonome Langläufer, Context-Management | Claude/Codex soll stundenlang alleine arbeiten |
| **gstack** | Virtuelles Engineering-Team | Product + Tech zusammenarbeiten |
| **claude-stack** | Alle drei in einem | Du nicht wählen willst |

---

## Problem: Ephemere VM-Sessions

Bei `claude.ai/code` läuft jede Session in einer VM. Installierst du ein Plugin
nur einmalig über den Chat, ist es bei der nächsten Session weg – sofern
`~/.claude/` nicht zwischen Sessions persistiert.

**Lösung:** Plugin per SessionStart-Hook automatisch installieren, sodass
es am Anfang jeder Session bereitsteht.

---

## Option A – Automatisch via SessionStart-Hook (empfohlen)

Dieser Hook führt `claude plugin install` beim Start jeder Session aus.

### Schritt 1: Hook-Skript erstellen

Öffne ein Terminal in der VM und führe folgendes aus:

```bash
cat > ~/.claude/superpowers-install.sh << 'EOF'
#!/bin/bash
# Superpowers installieren, falls noch nicht vorhanden
if ! claude plugin list 2>/dev/null | grep -q "superpowers"; then
  claude plugin install superpowers@claude-plugins-official --silent 2>/dev/null || true
fi
EOF
chmod +x ~/.claude/superpowers-install.sh
```

### Schritt 2: Hook in `~/.claude/settings.json` eintragen

Füge den `SessionStart`-Block in deine `~/.claude/settings.json` ein:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/superpowers-install.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/stop-hook-git-check.sh"
          }
        ]
      }
    ]
  }
}
```

### Schritt 3: Prüfen

```bash
claude plugin list
# Ausgabe sollte enthalten: superpowers
```

---

## Option B – Einmalig manuell im Terminal

Falls `~/.claude/` zwischen Sessions persistiert (z. B. durch Backup),
reicht ein einmaliger Befehl:

```bash
claude plugin install superpowers@claude-plugins-official
```

Danach prüfen:

```bash
claude plugin list
```

---

## Option C – Manuell via Git (Fallback)

Wenn der Plugin-Befehl in der VM nicht funktioniert:

```bash
# Repository klonen
git clone https://github.com/obra/superpowers.git ~/.superpowers

# Als lokales Plugin laden
claude plugin load ~/.superpowers
```

---

## Codex einrichten

Codex unterstützt Superpowers über den offiziellen OpenAI Plugin Marketplace:

1. Codex App / CLI öffnen
2. Plugin-Suche aufrufen
3. **„Superpowers"** in der Kategorie *Coding* suchen
4. Installieren

Alternativ in der `codex.json` / `opencode.json`:

```json
{
  "plugins": [
    "obra/superpowers"
  ]
}
```

---

## Skills benutzen

Nach der Installation stehen in Claude Code diese Slash-Commands bereit:

| Command | Was es tut |
|---|---|
| `/brainstorm` | Idee ausarbeiten, bevor Code geschrieben wird |
| `/plan` | Implementierungsplan mit Tasks erstellen |
| `/tdd` | Test-first: RED → GREEN → REFACTOR |
| `/debug` | Systematische Root-Cause-Analyse |
| `/review` | Zweistufiger Code-Review (Spec + Qualität) |
| `/worktree` | Isolierter Git-Worktree für parallele Entwicklung |

**Workflow für neue Features:**

```
/brainstorm → Design besprechen & abnicken
    ↓
/plan → Implementierungsplan erstellen
    ↓
/tdd → Tests zuerst, dann Implementierung
    ↓
/review → Code-Review vor dem Merge
```

---

---

## GSD – Get Stuff Done

**GitHub:** [gsd-build/gsd-2](https://github.com/gsd-build/gsd-2)

Strukturiert Arbeit in **Milestone → Slice → Task**, jede Task in eigenem Context-Fenster.
Verhindert Kontextverlust bei langen Sessions, trackt Kosten, erholt sich von Abstürzen.

### Installation

```bash
npm install -g gsd-pi@latest
```

Erfordert Node.js ≥ 22. Einmalig starten und Setup-Wizard abschliessen:

```bash
gsd
```

### Wichtige Commands

| Command | Was es tut |
|---|---|
| `/gsd next` | Einen Task ausführen, dann pausieren |
| `/gsd auto` | Vollautomatisch: Planen → Bauen → Verifizieren → Committen |
| `/gsd status` | Fortschritt-Dashboard |
| `/gsd discuss` | Architektur besprechen während Arbeit läuft |
| `/gsd stop` | Autonomen Modus sauber beenden |

### In der VM persistent machen

Da GSD global via npm installiert wird, bleibt es zwischen Sessions erhalten
solange das npm-Prefix in `~/.npm-global` liegt (in dieser VM der Fall).
Prüfen mit:

```bash
gsd --version
```

---

## gstack – Virtuelles Engineering-Team

**GitHub:** [garrytan/gstack](https://github.com/garrytan/gstack) · von Garry Tan (YC President & CEO)

23 spezialisierte Rollen: CEO, Eng Manager, Designer, QA, Release Manager, Doc Engineer.
Sprint-Prozess: Think → Plan → Build → Review → Test → Ship → Reflect.

### Installation

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack \
  && cd ~/.claude/skills/gstack && ./setup
```

Erfordert: Claude Code, Git, Bun v1.0+

### Wichtige Commands

| Command | Was es tut |
|---|---|
| `/office-hours` | Produkt-Vision klären (CEO-Perspektive) |
| `/plan-ceo-review` | Strategischer Review vor der Implementierung |
| `/plan-eng-review` | Architektur-Review |
| `/design-consultation` | UI/UX-Feedback |
| `/review` | Automatischer Code-Audit |
| `/qa` | Browser-Testing via Chromium |
| `/cso` | Security-Audit |
| `/ship` | PR erstellen mit Verifikation |
| `/land-and-deploy` | Merge + Deploy |
| `/codex` | Second Opinion von OpenAI Codex |

### In der VM persistent machen

gstack klont sich nach `~/.claude/skills/gstack` – dieser Pfad persistiert
zwischen Sessions (Teil von `~/.claude/`). Einmalig installieren genügt.

---

## claude-stack-plugin – Alles in einem

**GitHub:** [bdarbaz/claude-stack-plugin](https://github.com/bdarbaz/claude-stack-plugin)

Vereint Superpowers + GSD + gstack + ECC in einem einzigen Plugin.
27 Skills, 12 Agents, 6 Hooks, 8 Rules – alle unter dem `/s:` Namespace.

### Installation

```bash
claude plugin install claude-stack@claude-plugins-official
```

**Hinweis:** Wenn du bereits Superpowers installiert hast, können sich Commands überschneiden.
claude-stack eignet sich besonders für Neueinsteiger die alles auf einmal wollen.

---

## Claude ↔ Codex Aufgabenteilung

| Aufgabe | Agent |
|---|---|
| Architektur & komplexe Features | Claude (via Superpowers `/plan` + `/tdd`) |
| Routineaufgaben, Tests, Bugfixes | Codex |
| Code-Review | Claude (`/review`) |
| iOS/Mobile | Codex (Expo-Kontext) |

Branches:
- `claude/<feature>` – Claude-geführte Arbeiten
- `codex/<feature>` – Codex-geführte Arbeiten

---

## Empfehlung für Vinotheque

| Aufgabe | Framework |
|---|---|
| Neue Features (Architektur, TDD) | **Superpowers** (`/plan` + `/tdd`) |
| Lange autonome Tasks (z. B. ganze Feature-Implementierung) | **GSD** (`/gsd auto`) |
| Product-Reviews, Sicherheits-Audit | **gstack** (`/cso`, `/plan-ceo-review`) |
| Wenn du schnell starten willst | **claude-stack** (alles in einem) |

---

## Quellen

- [obra/superpowers auf GitHub](https://github.com/obra/superpowers)
- [gsd-build/gsd-2 auf GitHub](https://github.com/gsd-build/gsd-2)
- [garrytan/gstack auf GitHub](https://github.com/garrytan/gstack)
- [bdarbaz/claude-stack-plugin auf GitHub](https://github.com/bdarbaz/claude-stack-plugin)
- [Superpowers Plugin auf Anthropic Marketplace](https://claude.com/plugins/superpowers)
- [Issue #262: Web-Agent-Unterstützung](https://github.com/obra/superpowers/issues/262)
