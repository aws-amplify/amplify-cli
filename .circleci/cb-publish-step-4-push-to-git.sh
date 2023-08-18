#!/bin/bash -e

git config --global user.name aws-amplify-bot
git config --global user.email aws@amazon.com

if [[ "$BRANCH_NAME" =~ ^tagged-release ]] || [[ "$BRANCH_NAME" =~ ^run-e2e-with-rc\/.* ]] || [[ "$BRANCH_NAME" =~ ^release_rc\/.* ]]; then
  # push release commit
  git push origin "$BRANCH_NAME" --no-verify

  # push release tags
  git tag --points-at HEAD | xargs git push origin

# @latest release
elif [[ "$BRANCH_NAME" == "release" ]]; then
  # push release commit
  git push origin "$BRANCH_NAME" --no-verify

  # push release tags
  git tag --points-at HEAD | xargs git push origin

  # fast forward main to release
  git fetch origin main
  git checkout main
  git merge release --ff-only
  git push origin main --no-verify

  # fast forward hotfix to release
  git fetch origin hotfix
  git checkout hotfix
  git merge release --ff-only
  git push origin hotfix --no-verify
else
  echo "branch name" "$BRANCH_NAME" "did not match any branch publish rules."
  exit 1
fi
