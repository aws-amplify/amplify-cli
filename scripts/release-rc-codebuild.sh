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

echo "Creating $branch_name branch"
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

# If merge resulted in extra commit rename branch to reflect that. Pipeline will use HEAD commit to name RC version.
rc_sha_head=$(git rev-parse --short=15 HEAD)
if [[ "$rc_sha_head" != "$rc_sha" ]]; then
  branch_name="release_rc/$rc_sha_head"
  echo "New commit was added to RC branch during merge, renaming branch to $branch_name"
  # Create new branch from current branch, i.e. rename branch
  git checkout -b "$branch_name"
fi

echo "Pushing $branch_name to $remote_name"
git push "$remote_name" "$branch_name"
