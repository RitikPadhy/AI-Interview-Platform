#!/usr/bin/env bash
# Starts Interview Copilot on http://localhost:3000
set -euo pipefail

cd "$(dirname "$0")/platform"

if ! command -v claude >/dev/null 2>&1; then
  echo "The 'claude' CLI is not on your PATH."
  echo "Install it with:  npm i -g @anthropic-ai/claude-code   then run 'claude' once to sign in."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies (first run only)…"
  npm install --no-audit --no-fund
fi

echo ""
echo "  Interview Copilot  →  http://localhost:3000"
echo "  Ctrl+C to stop."
echo ""

exec npm run dev
