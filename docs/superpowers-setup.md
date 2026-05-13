# Superpowers Setup – VM-Umgebung (claude.ai/code)

> **Hintergrund:** [Superpowers](https://github.com/obra/superpowers) ist ein Open-Source Framework,
> das Claude Code und Codex mit strukturierten Entwicklungs-Skills erweitert
> (TDD, Planung, Code-Review, Brainstorming). Da du in einer Web-VM arbeitest,
> muss die Installation entweder manuell oder per Hook automatisiert werden.

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

## Quellen

- [obra/superpowers auf GitHub](https://github.com/obra/superpowers)
- [Superpowers Plugin auf Anthropic Marketplace](https://claude.com/plugins/superpowers)
- [Issue #262: Web-Agent-Unterstützung](https://github.com/obra/superpowers/issues/262)
