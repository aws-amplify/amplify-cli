#!/bin/bash
if [ ! -z "git diff --diff-filter=MRA --name-only | grep package.json" ]; then
  echo "changes made to package.json files"
  yarn sort-packages
fi
