#!/bin/bash
set -e

# this script should be run locally when starting the CLI release process
# Usage: ./scripts/release-rc.sh <hash> where <hash> is the commit sha of the commit on dev to be released
#
# It will
# 1. Checkout a new branch release_rc/<hash> pointing to the specified commit
# 2. Merge main into the rc branch (you may have to resolve merge conflicts)
# 3. Push the rc branch to the CLI repo
# This will then kick off a CCI workflow to publish the release candidate

repo_name="aws-amplify/amplify-cli"

git remote update


if [[ -z ${1+x} ]]; then
  echo "Include the release candidate commit ref you wish to release as the first argument"
  exit 1
fi

rc_sha=$(git rev-parse --short=15 "$1")
remote_name=$(git remote -v | grep "$repo_name" | head -n1 | awk '{print $1;}')

if [[ -z ${remote_name+x} ]]; then
  echo "Could not determine remote name of" "$repo_name" "repository"
  exit 1
fi

branch_name="release_rc/$rc_sha"

git checkout -B "$branch_name" "$rc_sha"
git fetch "$remote_name" main
set +e
git merge "$remote_name"/main
merge_exit_code=$?
set -e
if [[ $merge_exit_code -gt 0 ]]; then
  # could not automatically merge
  echo "Resolve merge conflicts and resume release candidate publish by running 'kill -CONT $$'"
  kill -TSTP $$
fi
git push "$remote_name" "$branch_name"
echo "CircleCI is publishing the release candidate. Check progress at"
echo "https://app.circleci.com/pipelines/github/$repo_name?branch=$branch_name"
