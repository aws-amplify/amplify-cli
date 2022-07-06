#!/bin/bash

if [[ "$CIRCLE_BRANCH" != "dev" ]]; then
  echo "Skipping because this branch is not deploying a release candidate"
  exit 0
fi

rc_tag="v$(jq -r .version packages/amplify-cli/package.json)"
commit="$(git rev-parse HEAD~1)"
git tag $rc_tag $commit
git push $rc_tag
