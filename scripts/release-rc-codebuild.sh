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
