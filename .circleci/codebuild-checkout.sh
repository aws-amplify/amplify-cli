#!/bin/bash -e

# This script checks out the current branch & loads git tags.

# check if branch name was submitted with the job, otherwise extract it manually
if [ "$BRANCH_NAME" = "" ] ; then
  export BRANCH_NAME="$(git symbolic-ref HEAD --short 2>/dev/null)"
  # if we can't get branch name from there, try to extract it another way
  if [ "$BRANCH_NAME" = ""] ; then
    BRANCH_NAME="$(git rev-parse HEAD | xargs git name-rev | cut -d' ' -f2 | sed 's/remotes\/origin\///g')";
  fi
fi
# Codebuild doesn't checkout the branch by default
git checkout $BRANCH_NAME

# Codebuild doens't load tags by default
echo "fetching tags"
git fetch --tags https://github.com/aws-amplify/amplify-cli

