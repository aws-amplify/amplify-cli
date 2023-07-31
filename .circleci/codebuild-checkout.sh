#!/bin/bash -e

# This script checks out a branch & loads git tags.

git status

echo "CODEBUILD_SOURCE_VERSION=$CODEBUILD_SOURCE_VERSION"
echo "BRANCH_NAME=$BRANCH_NAME"
echo "CODEBUILD_WEBHOOK_TRIGGER=$CODEBUILD_WEBHOOK_TRIGGER"

if [[ "$CODEBUILD_SOURCE_VERSION" != "" ]]; then
  CODEBUILD_SOURCE_VERSION_REF=$(git show-ref | grep $CODEBUILD_SOURCE_VERSION)
  echo "CODEBUILD_SOURCE_VERSION_REF=$CODEBUILD_SOURCE_VERSION_REF"
fi

# Codebuild doesn't checkout the branch by default
if [[ "$CODEBUILD_WEBHOOK_TRIGGER" =~ ^pr/ || "$CODEBUILD_SOURCE_VERSION_REF" =~ refs/pull/[0-9]+/head$ ]]; then
  # if we're in PR workflow create temporary local branch.
  # we detect if we're in PR by looking at CODEBUILD_WEBHOOK_TRIGGER or by checking if commit is matching refs/pull/<number>/head
  echo "Creating temporary local branch for PR build"
  TEMP_BRANCH_NAME=$(cat /proc/sys/kernel/random/uuid)
  git checkout -b $TEMP_BRANCH_NAME
elif [[ "$BRANCH_NAME" == "" ]]; then
  echo "BRANCH_NAME must be defined for non-PR builds"
  exit 1
else
  echo "Checking out $BRANCH_NAME"
  git checkout $BRANCH_NAME
fi

echo "Fetching tags"
git fetch --tags https://github.com/aws-amplify/amplify-cli

