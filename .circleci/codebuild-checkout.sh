#!/bin/bash -e

# This script checks out a branch & loads git tags.

git status

echo "CODEBUILD_SOURCE_VERSION=$CODEBUILD_SOURCE_VERSION"
echo "BRANCH_NAME=$BRANCH_NAME"
echo "CODEBUILD_WEBHOOK_TRIGGER=$CODEBUILD_WEBHOOK_TRIGGER"

printenv

# Codebuild doesn't checkout the branch by default
if [[ "$BRANCH_NAME" =~ ^pr/ || "$CODEBUILD_SOURCE_VERSION" =~ ^pr/ || "$CODEBUILD_WEBHOOK_TRIGGER" =~ ^pr/ ]]; then
  echo "Creating temporary local branch for PR build"
  git checkout -b "abcd"
elif [ "$BRANCH_NAME" == "" ]; then
  echo "BRANCH_NAME must be defined for non-PR builds"
  # exit 1
else
  echo "Checking out $BRANCH_NAME"
  git checkout $BRANCH_NAME
fi

# check if branch name was submitted with the job, otherwise extract it manually
#if [ "$BRANCH_NAME" == "" ] ; then
#  export BRANCH_NAME="$(git symbolic-ref HEAD --short 2>/dev/null)"
#  # if we can't get branch name from there, try to extract it another way
#  if [ "$BRANCH_NAME" == ""] ; then
#    BRANCH_NAME="$(git rev-parse HEAD | xargs git name-rev | cut -d' ' -f2 | sed 's/remotes\/origin\///g')";
#  fi
#fi
# Codebuild doesn't checkout the branch by default
#git checkout $BRANCH_NAME

# Codebuild doens't load tags by default
echo "Fetching tags"
git fetch --tags https://github.com/aws-amplify/amplify-cli

