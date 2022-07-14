#!/bin/bash

if [[ "$CIRCLE_BRANCH" != "dev" ]]; then
  echo "Skipping because this branch is not deploying a release candidate"
  exit 0
fi

rc_tag="v$(jq -r .version packages/amplify-cli/package.json)"
commit="$(git rev-parse HEAD~1)"
short_commit="$(git rev-parse --short HEAD~1)"
git tag $rc_tag $commit
# push the main release tag
git push origin $rc_tag
# push the release tags for all other packages
git tag | grep $short_commit | xargs git push origin
