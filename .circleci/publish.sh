#!/bin/bash -e
if [ -z "$CIRCLE_PULL_REQUEST" ]; then
  git config --global user.email $GITHUB_EMAIL
  git config --global user.name $GITHUB_USER
  if [[ "$CIRCLE_BRANCH" =~ ^tagged-release ]]; then
    if [[ "$CIRCLE_BRANCH" =~ ^tagged-release-without-e2e-tests\/.* ]]; then
        # Remove tagged-release-without-e2e-tests/
      export NPM_TAG="${CIRCLE_BRANCH/tagged-release-without-e2e-tests\//}"
    elif [[ "$CIRCLE_BRANCH" =~ ^tagged-release\/.* ]]; then
      # Remove tagged-release/
      export NPM_TAG="${CIRCLE_BRANCH/tagged-release\//}"
    fi
    if [ -z "$NPM_TAG" ]; then
        echo "Tag name is missing. Name your branch with either tagged-release/<tag-name> or tagged-release-without-e2e-tests/<tag-name>"
        exit 1
      fi
      echo "Publishing to NPM with tag $NPM_TAG"
      yarn publish:tag
  else
    yarn publish:$CIRCLE_BRANCH
  fi
else
  echo "Skipping deploy."
fi