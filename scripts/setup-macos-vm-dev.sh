#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="${PROJECT_NAME:-vinotheque-aid}"
DEV_ROOT="${DEV_ROOT:-$HOME/Developer}"
REPO_URL="${REPO_URL:-}"
NODE_VERSION="${NODE_VERSION:-20}"
RUN_IOS_BUILD="${RUN_IOS_BUILD:-0}"
INSTALL_AI_TOOLS="${INSTALL_AI_TOOLS:-1}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
SCRIPT_PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd -P)"

info() {
  printf "\033[1;34m==>\033[0m %s\n" "$*"
}

warn() {
  printf "\033[1;33mWARN:\033[0m %s\n" "$*" >&2
}

die() {
  printf "\033[1;31mERROR:\033[0m %s\n" "$*" >&2
  exit 1
}

have() {
  command -v "$1" >/dev/null 2>&1
}

append_line_once() {
  local file="$1"
  local line="$2"

  touch "$file"
  if ! grep -Fqx "$line" "$file"; then
    printf "\n%s\n" "$line" >>"$file"
  fi
}

run_if_have_project() {
  local project_dir="$1"
  shift

  if [[ -d "$project_dir" ]]; then
    (cd "$project_dir" && "$@")
  fi
}

[[ "$(uname -s)" == "Darwin" ]] || die "Dieses Skript ist fuer macOS gedacht."

if [[ "$(uname -m)" != "arm64" ]]; then
  warn "Dieses Setup ist fuer Apple-Silicon-UTM-VMs optimiert. Auf Intel-Macs koennen Details abweichen."
fi

info "Pruefe Xcode Command Line Tools"
if ! xcode-select -p >/dev/null 2>&1; then
  xcode-select --install || true
  die "Bitte die Xcode Command Line Tools Installation abschliessen und dieses Skript erneut starten."
fi

if ! xcodebuild -version >/dev/null 2>&1; then
  warn "Vollstaendiges Xcode ist noch nicht verfuegbar. Fuer iOS-Simulator-Builds Xcode aus dem App Store installieren und einmal oeffnen."
else
  xcodebuild -version
fi

info "Installiere oder aktiviere Homebrew"
if ! have brew; then
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

if [[ -x /opt/homebrew/bin/brew ]]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
  append_line_once "$HOME/.zprofile" 'eval "$(/opt/homebrew/bin/brew shellenv)"'
elif [[ -x /usr/local/bin/brew ]]; then
  eval "$(/usr/local/bin/brew shellenv)"
  append_line_once "$HOME/.zprofile" 'eval "$(/usr/local/bin/brew shellenv)"'
else
  die "Homebrew wurde nicht gefunden."
fi

info "Installiere Basis-Tools"
brew update
brew install git git-lfs gh fnm watchman cocoapods ripgrep jq direnv
git lfs install

info "Installiere Node.js ${NODE_VERSION} via fnm"
append_line_once "$HOME/.zshrc" 'eval "$(fnm env --use-on-cd)"'
eval "$(fnm env --use-on-cd)"
fnm install "$NODE_VERSION"
fnm default "$NODE_VERSION"
fnm use "$NODE_VERSION"
corepack enable || warn "corepack konnte nicht aktiviert werden; npm funktioniert trotzdem."

info "Node/npm Versionen"
node --version
npm --version

if [[ "$INSTALL_AI_TOOLS" == "1" ]]; then
  info "Installiere Claude Code und Codex CLI"
  npm install -g @anthropic-ai/claude-code @openai/codex
  warn "Nach dem Skript bitte interaktiv anmelden: gh auth login, claude, codex --login."
else
  warn "INSTALL_AI_TOOLS=0 gesetzt; Claude Code und Codex CLI werden uebersprungen."
fi

mkdir -p "$DEV_ROOT"
PROJECT_DIR="$DEV_ROOT/$PROJECT_NAME"

if [[ ! -d "$PROJECT_DIR/.git" && -d "$SCRIPT_PROJECT_DIR/.git" && -z "$REPO_URL" ]]; then
  PROJECT_DIR="$SCRIPT_PROJECT_DIR"
fi

if [[ -n "$REPO_URL" && ! -d "$PROJECT_DIR/.git" ]]; then
  info "Clone Repository nach $PROJECT_DIR"
  git clone "$REPO_URL" "$PROJECT_DIR"
elif [[ -d "$PROJECT_DIR/.git" ]]; then
  info "Repository existiert bereits: $PROJECT_DIR"
else
  warn "REPO_URL ist leer. Repository-Clone wird uebersprungen."
  warn "Beispiel: REPO_URL=git@github.com:ORG/REPO.git $0"
fi

if [[ -d "$PROJECT_DIR/.git" ]]; then
  info "Installiere Projekt-Dependencies"
  run_if_have_project "$PROJECT_DIR" npm ci

  info "Fuehre Web/Core Checks aus"
  run_if_have_project "$PROJECT_DIR" npm test
  run_if_have_project "$PROJECT_DIR" npm run build
  run_if_have_project "$PROJECT_DIR" npm run lint

  if [[ -d "$PROJECT_DIR/apps/mobile" ]]; then
    info "Pruefe Expo Mobile Workspace"
    (cd "$PROJECT_DIR/apps/mobile" && npx expo --version)
    (cd "$PROJECT_DIR/apps/mobile" && npx expo-doctor) || warn "expo-doctor meldet Punkte zur Nacharbeit."

    if [[ "$RUN_IOS_BUILD" == "1" ]]; then
      info "Starte iOS Simulator Build"
      (cd "$PROJECT_DIR/apps/mobile" && npx expo run:ios)
    else
      warn "iOS Native Build uebersprungen. Fuer einen Testlauf: RUN_IOS_BUILD=1 $0"
    fi
  fi
fi

cat <<EOF

Fertig.

Naechste manuelle Schritte in der VM:
  1. gh auth login
  2. claude
  3. codex --login
  4. cd "$PROJECT_DIR"
  5. npm run dev -- --host 0.0.0.0

Mobile:
  cd "$PROJECT_DIR/apps/mobile"
  npx expo start
  # Taste i oeffnet den iOS Simulator

EOF
