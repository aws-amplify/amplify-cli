#!/bin/bash
set -e

# This script is for promoting a CLI release candidate to @latest
# Usage: ./scripts/promote-rc.sh <hash> where <hash> is the same hash previously used to run `release-rc`.
# It is the hash in the release candidate version 1.2.3-rc.<hash>.0

# It will:
# pull the latest changes from the release candidate branch
# push HEAD~1 of the release candidate branch to the release branch.
#   HEAD~1 is used instead of HEAD so that the prerelease version commit is dropped from the latest release

# This will kick off a CCI workflow that will publish the @latest release

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

rc_branch="release_rc/$rc_sha"

git fetch "$remote_name" "$rc_branch"
git checkout "$rc_branch"
git reset --hard "$remote_name"/"$rc_branch"
git push "$remote_name" "$rc_branch"~1:refs/heads/release
