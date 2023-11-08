#!/bin/bash -e

# This script checks out a branch & loads git tags.

# Get the hash that CodeBuild used to start workflow and use it later to validate that we didn't change it after transformations below.
INITIAL_HEAD_HASH=$(git rev-parse HEAD)

git status

echo "PROJECT_NAME=$PROJECT_NAME"
echo "CODEBUILD_SOURCE_VERSION=$CODEBUILD_SOURCE_VERSION"
echo "BRANCH_NAME=$BRANCH_NAME"
echo "CODEBUILD_WEBHOOK_TRIGGER=$CODEBUILD_WEBHOOK_TRIGGER"

# Codebuild doesn't checkout the branch by default
if [[ "$PROJECT_NAME" == "AmplifyCLI-PR-Testing" ]]; then
  # If we're in PR workflow create temporary local branch.
  echo "Creating temporary local branch for PR build"
  TEMP_BRANCH_NAME=$(cat /proc/sys/kernel/random/uuid)
  git checkout -b $TEMP_BRANCH_NAME
elif [[  "$CODEBUILD_WEBHOOK_TRIGGER" == "branch/dev" ]]; then
  # We're in E2E workflow triggered after pushing to dev.
  echo "Checking out dev"
  git checkout dev
elif [[ "$BRANCH_NAME" == "" ]]; then
  echo "BRANCH_NAME must be defined for non-PR builds"
  exit 1
else
  echo "Checking out $BRANCH_NAME"
  git checkout $BRANCH_NAME
fi

git show --summary

echo "Fetching tags"
git fetch --all --tags

# A sanity check that we haven't altered commit we're building from. This must be last section in this script
HEAD_HASH=$(git rev-parse HEAD)
if [[ "$INITIAL_HEAD_HASH" != "$HEAD_HASH" ]]; then
  echo "Fail! Detected a drift of commit we attempt to build!"
  echo "INITIAL_HEAD_HASH=$INITIAL_HEAD_HASH"
  echo "HEAD_HASH=$HEAD_HASH"
  exit 1
fi
