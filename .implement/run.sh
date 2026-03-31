#!/bin/bash
# Method B: Single-shot — one claude -p call with full context

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PROMPT_FILE="$SCRIPT_DIR/PROMPT.md"

cd "$PROJECT_DIR"

echo "=== Method B: Single-Shot ==="
echo "Project: $PROJECT_DIR"
echo "Start: $(date)"
echo ""

claude -p "$(cat "$PROMPT_FILE")" \
    --allowedTools "Read,Write,Edit,Glob,Grep,Bash" \
    --dangerously-skip-permissions \
    2>&1 | tee "$SCRIPT_DIR/output.log"

echo ""
echo "=== Method B finished ==="
echo "End: $(date)"
echo ""
echo "--- Git diff summary ---"
git diff --stat HEAD
echo ""
echo "--- Git log ---"
git log --oneline -10
