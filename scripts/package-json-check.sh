#!/bin/bash
if [ ! -z "git diff --diff-filter=MRA --name-only | grep package.json" ]; then
  yarn lint-fix-package-json
  echo "Changes made to package.json files. Please stage these changes before pushing."
fi
