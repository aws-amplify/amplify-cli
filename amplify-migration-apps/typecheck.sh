#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for dir in "$SCRIPT_DIR"/*/; do
  _snapshot="$dir/_snapshot.expected"
  if [[ -f "$_snapshot/package.json" ]]; then
    (cd "$_snapshot" && npm run typecheck:backend)
  fi
done
