#!/bin/bash -e
if ! [[ -z "$CIRCLE_PULL_REQUEST" ]]; then
  echo "Skipping deploy on pull request"
  exit 0
fi
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
  npx lerna publish --exact --dist-tag=$NPM_TAG --preid=$NPM_TAG --conventional-commits --conventional-prerelease --message "chore(release): Publish tagged release $NPM_TAG [ci skip]" --yes --include-merged-tags

# release candidate
elif [[ "$CIRCLE_BRANCH" =~ ^run-e2e-with-rc\/.* ]] || [[ "$CIRCLE_BRANCH" =~ ^release_rc\/.* ]]; then
  # create release commit and release tags
  npx lerna version --preid=rc.$(git rev-parse --short HEAD) --exact --conventional-prerelease --conventional-commits --yes --no-push --include-merged-tags --message "chore(release): Publish rc [ci skip]"

  # if publishing locally to verdaccio
  if [[ "$LOCAL_PUBLISH_TO_LATEST" == "true" ]]; then
    # publish to verdaccio with no dist tag (default to latest)
    npx lerna publish from-git --yes --no-push
    echo "Published packages to verdaccio"
    echo "Exiting without pushing release commit or release tags"
    exit 1
  fi

  # publish versions that were just computed
  npx lerna publish from-git --yes --no-push --dist-tag rc

  # push release commit
  git push origin "$CIRCLE_BRANCH"

  # push release tags
  git tag --points-at HEAD | xargs git push origin

# @latest release
elif [[ "$CIRCLE_BRANCH" == "release" ]]; then
  # create release commit and release tags
  npx lerna version --exact --conventional-commits --yes --no-push --include-merged-tags --message "chore(release): Publish latest [ci skip]"

  # publish versions that were just computed
  npx lerna publish from-git --yes --no-push

  # push release commit
  git push origin "$CIRCLE_BRANCH"

  # push release tags
  git tag --points-at HEAD | xargs git push origin

  # fast forward main to release
  git fetch origin main
  git switch main
  git merge release --ff-only
  git push origin main

  # fast forward hotfix to release
  git fetch origin hotfix
  git switch hotfix
  git merge release --ff-only
  git push origin hotfix
else
  echo "branch name" "$CIRCLE_BRANCH" "did not match any branch publish rules. Skipping publish"
fi
