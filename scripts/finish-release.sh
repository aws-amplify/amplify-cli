#!/bin/bash
set -e

# This script is used to conclude a CLI release

# It will:
# 1. Checkout a branch called dev-main-merge that points to the same commit as the HEAD of dev
# 2. Merge main into this branch (you may need to resolve conflicts)
# 3. Push the dev-main-merge branch to GitHub (at this point, create a PR and have it approved, but DO NOT MERGE IT)
# 4. Once the PR is approved, it will fast forward dev to dev-merge-main

repo_name="aws-amplify/amplify-cli"

git remote update

remote_name=$(git remote -v | grep "$repo_name" | head -n1 | awk '{print $1;}')

if [[ -z ${remote_name+x} ]]; then
  echo "Could not determine remote name of" "$repo_name" "repository"
  exit 1
fi

git checkout dev
git pull "$remote_name" dev
git checkout -B dev-main-merge
git fetch "$remote_name" main
set +e
git merge "$remote_name"/main -m "chore: merge release commit from main to dev"
merge_exit_code=$?
set -e
if [[ $merge_exit_code != 0 ]]; then
  # could not automatically merge
  echo "Resolve merge conflicts and commit merge, then resume script by running 'kill -CONT $$'"
  kill -TSTP $$
  git push "$remote_name" dev-main-merge --force --no-verify
  compare_link=https://github.com/aws-amplify/amplify-cli/compare/dev...dev-main-merge
  open "$compare_link"
  echo "Double check the release merge at the compare link that just opened"
  echo "(If it did not open, navigate to $compare_link)"
  echo "If something looks wrong, fix up the merge and run 'git push "$remote_name" dev-main-merge --force --no-verify'"
  echo "Once the changes look good, run 'kill -CONT $$' to resume this script."
  kill -TSTP $$
fi
git checkout dev
git merge dev-main-merge --ff-only
git push "$remote_name" dev
git branch -D dev-main-merge
echo "Dev branch successfully fast-forwarded to the release merge commit!"
