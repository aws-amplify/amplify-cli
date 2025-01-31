#!/bin/bash -e

# lerna has a bug (https://github.com/lerna/lerna/issues/1066) where failed publishes do not set the exit code properly
# this causes the script to keep running even after failed publishes
# this function forces failed publishes to exit on failure
function lernaPublishExitOnFailure {
  # exit on failure
  set -e
  # run lerna publish with the args that were passed to this function
  # duplicate stdout to a temp file
  npx lerna publish "$@" 2>&1 | tee /tmp/publish-results
  # grep the temp file for the lerna err token and return exit 1
  number_of_lerna_errors=$(grep "lerna ERR" /tmp/publish-results | wc -l)
  if [[ number_of_lerna_errors -gt 0 ]]; then
    echo "Fail! Lerna error."
    exit 1;
  else
    echo "Success! Lerna publish succeeded."
  fi
}

npmRegistryUrl=$(npm get registry)
if [[ "$npmRegistryUrl" =~ ^http://localhost ]]; then
  # registy URL update changes .yarnrc.yml file
  git update-index --assume-unchanged .yarnrc.yml

  echo "Publishing to local registry under latest tag"
  lernaPublishExitOnFailure from-git --yes --no-push
else
  echo "NPM registry url is not pointing to localhost, $npmRegistryUrl"
  exit 1
fi
