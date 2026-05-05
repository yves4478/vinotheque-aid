# Lokale Entwicklung

Ziel: schnell lokal entwickeln und testen, ohne den `main`-Branch oder das Hetzner-Deployment als Entwicklungsumgebung zu benutzen.

## Kurzantwort zur Codex-Umgebung

Die "Funktions-Umgebung" hier ist nur mein Arbeitsbereich/Sandbox in Codex. Sie bestimmt, welche Dateien und Kommandos ich in diesem Thread anfassen darf. Sie ist nicht dein Produktivserver und nicht Hetzner. Fuer deinen Wunsch ist wichtig: Ich kann hier lokale Scripts und Doku im Repo anlegen, aber echte iOS-Simulator-Laeufe brauchen deinen Mac mit Xcode.

## Einmaliges Setup

Voraussetzungen:

- Node.js 20 oder neuer
- npm
- Docker Desktop fuer lokale Postgres-Datenbank
- Xcode fuer iOS Simulator

Dann im Repo:

```sh
npm ci
```

## Webapp, Backend und PWA lokal starten

```sh
npm run local:dev
```

Das startet:

- lokale Postgres-DB via `docker-compose.local.yml`
- Prisma Generate und `prisma db push`
- Backend auf `http://localhost:3000`
- Web/PWA Dev Server auf `http://localhost:8080`

Healthcheck:

```sh
curl http://localhost:3000/health
```

## iOS / Expo dazunehmen

Expo im gleichen Ablauf starten:

```sh
npm run local:dev -- --mobile
```

Im Expo-Terminal `i` druecken, um den iOS Simulator zu oeffnen.

Direkt nativen iOS Build starten:

```sh
npm run local:dev -- --ios
```

Nur Mobile separat:

```sh
npm run dev:mobile
npm run ios
```

## Lokale Checks

```sh
npm run local:test
```

Das prueft:

- Web/Core Unit Tests
- Web/PWA Production Build
- API TypeScript Build
- Mobile TypeScript Check

## Lokale URLs und Envs

Default lokal:

```sh
VITE_API_URL=http://localhost:3000
EXPO_PUBLIC_API_URL=http://localhost:3000
DATABASE_URL=postgresql://vinotheque:vinotheque@localhost:5433/vinotheque_dev?schema=public
```

Die lokalen Defaults sind in den Scripts gesetzt. Fuer Spezialfaelle kannst du sie im Terminal ueberschreiben.

## Branch-Regel

Fuer Weiterentwicklung lokal auf Feature-Branches arbeiten, nicht direkt auf `main`:

```sh
git switch -c codex/mein-feature
```

`main` bleibt damit der deploybare Stand fuer Hetzner. Spaeter sollten GitHub Branch Protection und PR-Checks verhindern, dass unfertige lokale Arbeit direkt in Produktion landet.
