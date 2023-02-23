#!/bin/bash
if [ ! -z "git diff --diff-filter=MRA --name-only | grep package.json" ]; then
  yarn sort-packages
  echo "changes made to package.json files, please stage these changes before pushing"
fi
