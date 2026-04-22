#!/usr/bin/env bash
set -euo pipefail

APPLY=0
DEEP=0
AI_STATE=0
declare -a EXTRA_PATHS=()
declare -a CANDIDATES=()

usage() {
  cat <<'EOF'
Usage:
  scripts/cleanup-local-dev-host.sh [options]

Options:
  --apply          Wirklich loeschen. Ohne diesen Schalter ist es nur ein Dry-Run.
  --deep           Zusaetzlich globale Dev-Caches entfernen.
  --ai-state       Zusaetzlich lokale Claude/Codex/OpenAI-Konfiguration entfernen.
                   Erfordert bei --apply: DELETE_AI_STATE_CONFIRM=YES
  --path PATH      Weiteren konkreten Projektpfad aufnehmen. Mehrfach erlaubt.
  -h, --help       Hilfe anzeigen.

Beispiele:
  scripts/cleanup-local-dev-host.sh
  scripts/cleanup-local-dev-host.sh --path "$HOME/Developer/vinotheque-aid"
  scripts/cleanup-local-dev-host.sh --apply
  DELETE_AI_STATE_CONFIRM=YES scripts/cleanup-local-dev-host.sh --apply --ai-state
EOF
}

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

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply)
      APPLY=1
      shift
      ;;
    --deep)
      DEEP=1
      shift
      ;;
    --ai-state)
      AI_STATE=1
      shift
      ;;
    --path)
      [[ $# -ge 2 ]] || die "--path braucht einen Pfad."
      EXTRA_PATHS+=("$2")
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      die "Unbekannte Option: $1"
      ;;
  esac
done

add_if_exists() {
  local path="$1"
  if [[ -e "$path" ]]; then
    CANDIDATES+=("$path")
  fi
}

add_find_results() {
  local root="$1"
  local name="$2"

  [[ -d "$root" ]] || return 0
  while IFS= read -r path; do
    CANDIDATES+=("$path")
  done < <(find "$root" -maxdepth 4 -type d -name "$name" 2>/dev/null)
}

canonical_path() {
  local path="$1"
  if [[ -d "$path" ]]; then
    (cd "$path" && pwd -P)
  elif [[ -e "$path" ]]; then
    local dir
    dir="$(dirname "$path")"
    local base
    base="$(basename "$path")"
    (cd "$dir" && printf "%s/%s\n" "$(pwd -P)" "$base")
  else
    printf "%s\n" "$path"
  fi
}

is_dangerous_path() {
  local path="$1"
  case "$path" in
    "/" | "$HOME" | "$HOME/" | "/Users" | "$HOME/Library" | "$HOME/.ssh" | "$HOME/.gitconfig")
      return 0
      ;;
  esac

  if [[ "$AI_STATE" != "1" ]]; then
    case "$path" in
      "$HOME/.codex" | "$HOME/.claude" | "$HOME/.anthropic" | "$HOME/.openai")
        return 0
        ;;
    esac
  fi

  return 1
}

add_if_exists "$HOME/.codex/worktrees/a986/vinotheque-aid"
add_if_exists "$HOME/Developer/vinotheque-aid"
add_if_exists "$HOME/Projects/vinotheque-aid"
add_if_exists "$HOME/code/vinotheque-aid"
add_if_exists "$HOME/vinotheque-aid"
add_find_results "$HOME/.codex/worktrees" "vinotheque-aid"

if [[ ${#EXTRA_PATHS[@]} -gt 0 ]]; then
  for path in "${EXTRA_PATHS[@]}"; do
    add_if_exists "$path"
  done
fi

if [[ "$DEEP" == "1" ]]; then
  add_if_exists "$HOME/.expo"
  add_if_exists "$HOME/.eas"
  add_if_exists "$HOME/.npm/_npx"
  add_if_exists "$HOME/Library/Developer/Xcode/DerivedData"
  add_if_exists "$HOME/Library/Developer/CoreSimulator/Caches"
fi

if [[ "$AI_STATE" == "1" ]]; then
  add_if_exists "$HOME/.codex"
  add_if_exists "$HOME/.claude"
  add_if_exists "$HOME/.anthropic"
  add_if_exists "$HOME/.openai"
fi

if [[ "$AI_STATE" == "1" && "$APPLY" == "1" && "${DELETE_AI_STATE_CONFIRM:-}" != "YES" ]]; then
  die "--ai-state mit --apply erfordert DELETE_AI_STATE_CONFIRM=YES"
fi

contains_path() {
  local needle="$1"
  local existing

  if [[ ${#UNIQUE[@]} -eq 0 ]]; then
    return 1
  fi

  for existing in "${UNIQUE[@]}"; do
    [[ "$existing" == "$needle" ]] && return 0
  done

  return 1
}

declare -a UNIQUE=()

if [[ ${#CANDIDATES[@]} -gt 0 ]]; then
  for path in "${CANDIDATES[@]}"; do
    canon="$(canonical_path "$path")"
    if contains_path "$canon"; then
      continue
    fi

    if is_dangerous_path "$canon"; then
      warn "Ueberspringe gefaehrlichen Pfad: $canon"
      continue
    fi

    UNIQUE+=("$canon")
  done
fi

if [[ "${#UNIQUE[@]}" -eq 0 ]]; then
  info "Keine passenden lokalen Dev-Artefakte gefunden."
  exit 0
fi

if [[ "$APPLY" == "0" ]]; then
  info "Dry-Run. Folgende Pfade wuerden geloescht:"
else
  info "Loesche folgende Pfade:"
fi

for path in "${UNIQUE[@]}"; do
  size="$(du -sh "$path" 2>/dev/null | awk '{print $1}')"
  printf "  %8s  %s\n" "${size:-?}" "$path"
done

if [[ "$APPLY" == "0" ]]; then
  cat <<'EOF'

Noch wurde nichts geloescht.
Wenn die Liste stimmt:
  scripts/cleanup-local-dev-host.sh --apply

Fuer globale Expo/Xcode-Caches:
  scripts/cleanup-local-dev-host.sh --deep --apply

Fuer lokale Claude/Codex/OpenAI-Konfiguration:
  DELETE_AI_STATE_CONFIRM=YES scripts/cleanup-local-dev-host.sh --ai-state --apply
EOF
  exit 0
fi

for path in "${UNIQUE[@]}"; do
  rm -rf -- "$path"
done

info "Cleanup abgeschlossen."
