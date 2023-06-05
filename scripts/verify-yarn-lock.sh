#!/bin/bash

yarn install

yarn_lock_changed=$(git status | grep -F yarn.lock | wc -l)

if [[ yarn_lock_changed -gt 0 ]]; then
  echo "Fail! Detected change in yarn.lock file. Please run 'yarn install' and add yarn.lock file changes to the change set."
  exit 1;
else
  echo "Success! No drift detected in yarn.lock file."
fi

yarn_is_using_yarnpkg_registry=$(grep -F https://registry.yarnpkg.com yarn.lock | wc -l)

if [[ yarn_is_using_yarnpkg_registry -gt 0 ]]; then
  echo "Fail! Detected https://registry.yarnpkg.com in yarn.lock file. Please see use NPM - yarn config set npmRegistryServer https://registry.npmjs.org."
  exit 1;
else
  echo "Success! No https://registry.yarnpkg.com detected in yarn.lock file."
fi
