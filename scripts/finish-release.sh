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

git checkout -B dev-main-merge
git fetch "$remote_name" dev
git reset --hard "$remote_name"/dev
git fetch "$remote_name" main
git merge "$remote_name"/main
read -p 'Resolve any merge conflicts, then press any key to continue'
git push "$remote_name" dev-main-merge
read -p 'Open a PR for the dev-main-merge branch against dev and get it approved. DO NOT MERGE THE PR. Press any key once the PR is approved'
git switch dev
git pull "$remote_name" dev
git merge dev-main-merge --ff-only
git push "$remote_name" dev
echo "Release commit successfully merged onto main!"
