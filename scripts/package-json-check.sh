#!/bin/bash
if [ ! -z "git diff --diff-filter=MRA --name-only | grep package.json" ]; then
  yarn lint-fix-package-json
  git diff --diff-filter=MRA --name-only | grep package.json | xargs git add
fi
