#!/bin/bash -e

git config --global user.name aws-amplify-bot
git config --global user.email aws@amazon.com

if [[ "$BRANCH_NAME" == "" ]]; then
  echo "BRANCH_NAME must be defined for push to git step."
  exit 1
fi

if [[ "$PROJECT_NAME" == "TaggedReleaseWithoutE2E" ]] || [[ "$PROJECT_NAME" == "RC" ]]; then
  # push release commit
  git push origin "$BRANCH_NAME" --no-verify

  # push release tags
  git tag --points-at HEAD | xargs git push origin --no-verify

# @latest release
elif [[ "$PROJECT_NAME" == "Release" ]]; then
  # push release commit
  git push origin "$BRANCH_NAME" --no-verify

  # push release tags
  git tag --points-at HEAD | xargs git push origin --no-verify

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
  echo "Project name" "$PROJECT_NAME" "did not match any publish rules."
  exit 1
fi
