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
if [[ "$AMPLIFY_CI_MANUAL_PR_BUILD" == "true" || "$CODEBUILD_WEBHOOK_TRIGGER" =~ ^pr/ || "$CODEBUILD_SOURCE_VERSION" =~ ^pr/ || "$CODEBUILD_SOURCE_VERSION_REF" =~ refs/pull/[0-9]+/head$ ]]; then
  # If we're in PR workflow create temporary local branch.
  # We detect if we're in PR by looking for pr/<number> pattern in code build env variables
  # or by checking if commit is matching refs/pull/<number>/head.
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
