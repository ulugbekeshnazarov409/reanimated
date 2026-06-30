#!/usr/bin/env bash
# Reanimated Claude Code skill — one-line installer.
#   curl -fsSL https://raw.githubusercontent.com/ulugbekeshnazarov409/reanimated/main/install.sh | bash
#
# Env overrides:
#   REANIMATED_SKILL_REF   git ref to install (default: main)
#   CLAUDE_SKILLS_DIR      skills dir (default: ~/.claude/skills)
set -euo pipefail

REPO="https://github.com/ulugbekeshnazarov409/reanimated.git"
REF="${REANIMATED_SKILL_REF:-main}"
SKILLS_DIR="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
DEST="$SKILLS_DIR/reanimated"

printf '🌀 Installing the reanimated skill → %s\n' "$DEST"

if ! command -v git >/dev/null 2>&1; then
  printf '✗ git is required but not found. Install git, or download the repo manually into %s\n' "$DEST" >&2
  exit 1
fi

mkdir -p "$SKILLS_DIR"

if [ -d "$DEST/.git" ]; then
  printf '↻ Existing install found — updating…\n'
  git -C "$DEST" fetch --depth 1 origin "$REF"
  git -C "$DEST" checkout -q FETCH_HEAD
else
  rm -rf "$DEST"
  git clone --depth 1 --branch "$REF" "$REPO" "$DEST"
fi

printf '✓ Done. Restart Claude Code — the skill auto-activates on Reanimated tasks.\n'
