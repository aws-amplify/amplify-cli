#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for dir in "$SCRIPT_DIR"/*/; do
  [ "$(basename "$dir")" = "_test-common" ] && continue
  (cd "$dir" && npm run typecheck)
done
