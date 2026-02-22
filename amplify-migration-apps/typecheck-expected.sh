#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for dir in "$SCRIPT_DIR"/*/; do
  expected="$dir/_snapshot.expected/amplify"
  if [[ -d "$expected" ]]; then
    (cd "$expected" && npx tsc --noEmit)
  fi
done
