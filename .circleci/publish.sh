#!/bin/bash -e

# lerna has a bug (https://github.com/lerna/lerna/issues/1066) where failed publishes do not set the exit code properly
# this causes the script to keep running even after failed publishes
# this function forces failed publishes to exit on failure
function lernaPublishExitOnFailure {
  # exit on failure
  set -e
  # run lerna publish with the args that were passed to this function
  # duplicate stdout to a temp file
  # grep the temp file for the lerna err token and return exit 1 if found (-v option inverts grep exit code)

  if [[ "$LOCAL_PUBLISH_TO_LATEST" == "true" ]]; then
    # registy URL update changes .yarnrc.yml file
    git update-index --assume-unchanged .yarnrc.yml
  fi

  npx lerna publish "$@" | tee /tmp/publish-results && grep -qvz "lerna ERR!" < /tmp/publish-results
}

# verifies that binaries are uploaded and available before publishing to NPM
function verifyPkgIsAvailable {
  # exit on failure
  set -e

  # read version of @aws-amplify/cli
  desiredPkgVersion=$(npx lerna list --scope @aws-amplify/cli --json | jq -r '.[0].version')

  # check binaries
  # send HEAD requests to check for binary presence
  # curl --fail exits with non-zero code and makes this script fail
  curl -I --fail  https://package.cli.amplify.aws/$desiredPkgVersion/amplify-pkg-linux-x64.tgz
  curl -I --fail  https://package.cli.amplify.aws/$desiredPkgVersion/amplify-pkg-linux-arm64.tgz
  curl -I --fail  https://package.cli.amplify.aws/$desiredPkgVersion/amplify-pkg-macos-x64.tgz
  curl -I --fail  https://package.cli.amplify.aws/$desiredPkgVersion/amplify-pkg-win-x64.tgz
}

if [ -z "$GITHUB_EMAIL" ]; then
  if [[ "$LOCAL_PUBLISH_TO_LATEST" == "true" ]]; then
    git config --global user.email not@used.com
  else
    echo "GITHUB_EMAIL email is missing"
    exit 1
  fi
else
  git config --global user.email $GITHUB_EMAIL
fi

if [ -z "$GITHUB_USER" ]; then
  if [[ "$LOCAL_PUBLISH_TO_LATEST" == "true" ]]; then
    git config --global user.name "Doesnt Matter"
  else
    echo "GITHUB_USER email is missing"
    exit 1
  fi
else
  git config --global user.name $GITHUB_USER
fi

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

  if [[ "$LOCAL_PUBLISH_TO_LATEST" == "true" ]]; then
    echo "Publishing to local registry under latest tag"
    lernaPublishExitOnFailure from-git --yes --no-push
  else
    echo "Publishing to NPM under $NPM_TAG tag"
    lernaPublishExitOnFailure from-git --yes --no-push -dist-tag=$NPM_TAG
    # push release commit
    git push origin "$CIRCLE_BRANCH"

    # push release tags
    git tag --points-at HEAD | xargs git push origin
  fi

# @latest release
elif [[ "$CIRCLE_BRANCH" == "release" ]]; then
  if [[ "$LOCAL_PUBLISH_TO_LATEST" != "true" ]]; then
    # verify that binary has been uploaded
    verifyPkgIsAvailable
  fi

  # publish versions that were just computed
  lernaPublishExitOnFailure from-git --yes --no-push

  if [[ "$LOCAL_PUBLISH_TO_LATEST" == "true" ]]; then
    echo "Published packages to verdaccio"
    echo "Exiting without pushing release commit or release tags"
    exit 0
  fi

  # push release commit
  git push origin "$CIRCLE_BRANCH"

  # push release tags
  git tag --points-at HEAD | xargs git push origin

  # fast forward main to release
  git fetch origin main
  git checkout main
  git merge release --ff-only
  git push origin main

  # fast forward hotfix to release
  git fetch origin hotfix
  git checkout hotfix
  git merge release --ff-only
  git push origin hotfix

# release candidate or local publish for testing / building binary
elif [[ "$CIRCLE_BRANCH" =~ ^run-e2e-with-rc\/.* ]] || [[ "$CIRCLE_BRANCH" =~ ^release_rc\/.* ]] || [[ "$LOCAL_PUBLISH_TO_LATEST" == "true" ]]; then

  # if publishing locally to verdaccio
  if [[ "$LOCAL_PUBLISH_TO_LATEST" == "true" ]]; then
    # publish to verdaccio with no dist tag (default to latest)
    lernaPublishExitOnFailure from-git --yes --no-push
    echo "Published packages to verdaccio"
    echo "Exiting without pushing release commit or release tags"
    exit 0
  fi

  # verify that binary has been uploaded
  verifyPkgIsAvailable

  # publish versions that were just computed
  lernaPublishExitOnFailure from-git --yes --no-push --dist-tag rc

  # push release commit
  git push origin "$CIRCLE_BRANCH"

  # push release tags
  git tag --points-at HEAD | xargs git push origin
else
  echo "branch name" "$CIRCLE_BRANCH" "did not match any branch publish rules. Skipping publish"
fi
