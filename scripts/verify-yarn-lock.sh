#!/bin/bash

yarn install

yarn_lock_changed=$(git status | grep -F yarn.lock | wc -l)

if [[ yarn_lock_changed -gt 0 ]]; then
  echo "Fail! Detected change in yarn.lock file. Please run 'yarn install' and add yarn.lock file changes to the change set."
  exit 1;
else
  echo "Success! No drift detected in yarn.lock file."
fi
