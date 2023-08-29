#!/bin/bash

# exit if branch name is not an rc branch
if ! { [[ "$CIRCLE_BRANCH" =~ ^run-e2e-with-rc\/.* ]] || [[ "$CIRCLE_BRANCH" =~ ^release_rc\/.* ]]; }; then
  echo "Skipping because this branch is not deploying a release candidate"
  exit 0
fi

rc_tag="v$(jq -r .version packages/amplify-cli/package.json)"
commit="$(git rev-parse HEAD~1)"
short_commit="$(git rev-parse --short=15 HEAD~1)"
git tag $rc_tag $commit
# push the main release tag
git push origin $rc_tag
# push the release tags for all other packages
git tag | grep $short_commit | xargs git push origin
