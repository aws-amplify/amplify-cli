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

# verifies that binaries are uploaded and available before publishing to NPM
function verifyPkgIsAvailable {
  # exit on failure
  set -e

  # read version of @aws-amplify/cli
  desiredPkgVersion=$(npx lerna list --scope @aws-amplify/cli --json | jq -r '.[0].version')

  # check binaries
  # send HEAD requests to check for binary presence
  # curl --fail exits with non-zero code and makes this script fail
  curl -I --fail  https://$PKG_CLI_CLOUDFRONT_URL/$desiredPkgVersion/amplify-pkg-linux-x64.tgz
  curl -I --fail  https://$PKG_CLI_CLOUDFRONT_URL/$desiredPkgVersion/amplify-pkg-linux-arm64.tgz
  curl -I --fail  https://$PKG_CLI_CLOUDFRONT_URL/$desiredPkgVersion/amplify-pkg-macos-x64.tgz
  curl -I --fail  https://$PKG_CLI_CLOUDFRONT_URL/$desiredPkgVersion/amplify-pkg-win-x64.tgz
}

if [[ "$PROJECT_NAME" == "TaggedReleaseWithoutE2E" ]]; then
  if [ -z "$NPM_TAG" ]; then
    echo "Tag name is missing. Make sure CodeBuild workflow was started with NPM_TAG environment variable"
    exit 1
  fi

  if [[ "$BRANCH_NAME" == "main" ]] || [[ "$BRANCH_NAME" == "dev" ]] || [[ "$BRANCH_NAME" == "hotfix" ]] || [[ "$BRANCH_NAME" == "release" ]]; then
    echo "You can't use $BRANCH_NAME for tagged release"
    exit 1
  fi

  # verify that binary has been uploaded
  verifyPkgIsAvailable

  echo "Publishing to NPM under $NPM_TAG tag"
  lernaPublishExitOnFailure from-git --yes --no-push --dist-tag=$NPM_TAG

# @latest release
elif [[ "$PROJECT_NAME" == "Release" ]]; then

  if [[ "$BRANCH_NAME" != "release" ]]; then
    echo "Release must run from release branch. Branch provided was $BRANCH_NAME."
    exit 1
  fi

  # verify that binary has been uploaded
  verifyPkgIsAvailable

  # publish versions that were just computed
  lernaPublishExitOnFailure from-git --yes --no-push

# release candidate or local publish for testing / building binary
elif [[ "$PROJECT_NAME" == "RC" ]]; then

  # verify that binary has been uploaded
  verifyPkgIsAvailable

  # publish versions that were just computed
  lernaPublishExitOnFailure from-git --yes --no-push --dist-tag rc
else
  echo "Project name" "$PROJECT_NAME" "did not match any publish rules."
  exit 1
fi
