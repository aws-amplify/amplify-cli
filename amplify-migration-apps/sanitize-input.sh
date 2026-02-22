#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for dir in "$SCRIPT_DIR"/*/; do
  input="$dir/_snapshot.input"
  if [[ -d "$input" ]]; then
    (cd "$dir" && npm run sanitize:input)
  fi
done
