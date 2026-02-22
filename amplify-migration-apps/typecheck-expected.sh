#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for dir in "$SCRIPT_DIR"/*/; do
  expected="$dir/_snapshot.expected"
  if [[ -d "$expected" ]]; then
    (cd "$dir" && npm run typecheck:expected)
  fi
done
