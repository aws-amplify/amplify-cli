#!/bin/bash
set -e

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
