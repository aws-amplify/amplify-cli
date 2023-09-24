#!/bin/bash -e

git config --global user.name aws-amplify-bot
git config --global user.email aws@amazon.com

if [[ "$PROJECT_NAME" == "TaggedReleaseWithoutE2E" ]]; then
  if [ -z "$NPM_TAG" ]; then
    echo "Tag name is missing. Make sure CodeBuild workflow was started with NPM_TAG environment variable"
    exit 1
  fi

  if [[ "$BRANCH_NAME" == "main" ]] || [[ "$BRANCH_NAME" == "dev" ]] || [[ "$BRANCH_NAME" == "hotfix" ]] || [[ "$BRANCH_NAME" == "release" ]]; then
    echo "You can't use $BRANCH_NAME for tagged release"
    exit 1
  fi

  npx lerna version --exact --preid=$NPM_TAG --conventional-commits --conventional-prerelease --yes --no-push --include-merged-tags --message "chore(release): Publish tagged release $NPM_TAG" --no-commit-hooks --force-publish '@aws-amplify/cli-internal'

# @latest release
elif [[ "$PROJECT_NAME" == "Release" ]]; then

  if [[ "$BRANCH_NAME" != "release" ]]; then
    echo "Release must run from release branch. Branch provided was $BRANCH_NAME."
    exit 1
  fi

  # create release commit and release tags
  npx lerna version --exact --conventional-commits --conventional-graduate --yes --no-push --include-merged-tags --message "chore(release): Publish latest" --no-commit-hooks --force-publish '@aws-amplify/cli-internal'

# release candidate
elif [[ "$PROJECT_NAME" == "RC" ]]; then
  # create release commit and release tags
  npx lerna version --preid=rc.$(git rev-parse --short=15 HEAD) --exact --conventional-prerelease --conventional-commits --yes --no-push --include-merged-tags --message "chore(release): Publish rc" --no-commit-hooks --force-publish '@aws-amplify/cli-internal'
# local publish for testing / building binary, dev branch build, e2e tests
else
  # create release commit and release tags
  npx lerna version --preid=dev.$(git rev-parse HEAD) --exact --conventional-prerelease --conventional-commits --yes --no-push --include-merged-tags --message "chore(release): Publish dev" --no-commit-hooks --force-publish '@aws-amplify/cli-internal'
fi
