#!/bin/bash
set -e

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
