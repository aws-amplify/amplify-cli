#!/usr/bin/env sh

# Usage: Can be invoked either independently, or with an npm tag suffix, in order to update to that tagged version of all packagers in the filter.
# e.g. `npx scripts/update-data-dependencies.sh update-data-packages`
#      `npx scripts/update-data-dependencies.sh update-data-packages @rds-support`

FILTER="amplify-codegen"

if [ $# -eq 0 ]
  then
    echo "Updating to latest tag"
    npx ncu \
        --deep \
        --upgrade \
        --dep "prod,dev,peer,bundle,optional" \
        --filter "$FILTER"
  else 
    echo "Updating to $1 tag"
    npx ncu \
        --deep \
        --upgrade \
        --dep "prod,dev,peer,bundle,optional" \
        --filter "$FILTER" \
        --target $1
fi
