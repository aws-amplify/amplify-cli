#!/bin/bash -e
export BRANCH_NAME="$(git symbolic-ref HEAD --short 2>/dev/null)"
if [ "$BRANCH_NAME" = "" ] ; then
  BRANCH_NAME="$(git rev-parse HEAD | xargs git name-rev | cut -d' ' -f2 | sed 's/remotes\/origin\///g')";
fi
git checkout $BRANCH_NAME
echo "fetching tags"
git fetch --tags https://github.com/aws-amplify/amplify-cli

# lerna has a bug (https://github.com/lerna/lerna/issues/1066) where failed publishes do not set the exit code properly
# this causes the script to keep running even after failed publishes
# this function forces failed publishes to exit on failure
function lernaPublishExitOnFailure {
  # exit on failure
  set -e
  if [[ "$LOCAL_PUBLISH_TO_LATEST" == "true" ]]; then
    # registy URL update changes .yarnrc.yml file
    git update-index --assume-unchanged .yarnrc.yml
  fi
  
  # run lerna publish with the args that were passed to this function
  # duplicate stdout to a temp file
  # grep the temp file for the lerna err token and return exit 1 if found (-v option inverts grep exit code)
  npx lerna publish "$@" | tee /tmp/publish-results && grep -qvz "lerna ERR!" < /tmp/publish-results
}

if [ -z "$GITHUB_EMAIL" ]; then
  if [[ "$LOCAL_PUBLISH_TO_LATEST" == "true" ]]; then
    git config --global user.email not@used.com
  else
    echo "GITHUB_EMAIL email is missing"
    exit 1
  fi
else
  git config --global user.email $GITHUB_EMAIL
fi

if [ -z "$GITHUB_USER" ]; then
  if [[ "$LOCAL_PUBLISH_TO_LATEST" == "true" ]]; then
    git config --global user.name "Doesnt Matter"
  else
    echo "GITHUB_USER email is missing"
    exit 1
  fi
else
  git config --global user.name $GITHUB_USER
fi

if [[ "$BRANCH_NAME" =~ ^tagged-release ]]; then
  if [[ "$BRANCH_NAME" =~ ^tagged-release-without-e2e-tests\/.* ]]; then
    # Remove tagged-release-without-e2e-tests/
    export NPM_TAG="${BRANCH_NAME/tagged-release-without-e2e-tests\//}"
  elif [[ "$BRANCH_NAME" =~ ^tagged-release\/.* ]]; then
    # Remove tagged-release/
    export NPM_TAG="${BRANCH_NAME/tagged-release\//}"
  fi
  if [ -z "$NPM_TAG" ]; then
    echo "Tag name is missing. Name your branch with either tagged-release/<tag-name> or tagged-release-without-e2e-tests/<tag-name>"
    exit 1
  fi

  if [[ "$LOCAL_PUBLISH_TO_LATEST" == "true" ]]; then
    echo "Publishing to local registry under latest tag"
    lernaPublishExitOnFailure --exact --preid=$NPM_TAG --conventional-commits --conventional-prerelease --no-push --yes --include-merged-tags
  else
    echo "Publishing to NPM under $NPM_TAG tag"
    lernaPublishExitOnFailure --exact --dist-tag=$NPM_TAG --preid=$NPM_TAG --conventional-commits --conventional-prerelease --message "chore(release): Publish tagged release $NPM_TAG [ci skip]" --yes --include-merged-tags
  fi

# @latest release
elif [[ "$BRANCH_NAME" == "release" ]]; then
  # create release commit and release tags
  npx lerna version --exact --conventional-commits --conventional-graduate --yes --no-push --include-merged-tags --message "chore(release): Publish latest [ci skip]"

  # publish versions that were just computed
  lernaPublishExitOnFailure from-git --yes --no-push

  if [[ "$LOCAL_PUBLISH_TO_LATEST" == "true" ]]; then
    echo "Published packages to verdaccio"
    echo "Exiting without pushing release commit or release tags"
    exit 0
  fi

  # push release commit
  git push origin "$BRANCH_NAME"

  # push release tags
  git tag --points-at HEAD | xargs git push origin

  # fast forward main to release
  git fetch origin main
  git checkout main
  git merge release --ff-only
  git push origin main

  # fast forward hotfix to release
  git fetch origin hotfix
  git checkout hotfix
  git merge release --ff-only
  git push origin hotfix

# release candidate or local publish for testing / building binary
elif [[ "$BRANCH_NAME" =~ ^run-e2e-with-rc\/.* ]] || [[ "$BRANCH_NAME" =~ ^release_rc\/.* ]] || [[ "$LOCAL_PUBLISH_TO_LATEST" == "true" ]]; then

  # force @aws-amplify/cli-internal to be versioned in case this pipeline run does not have any commits that modify the CLI packages
  if [[ "$LOCAL_PUBLISH_TO_LATEST" == "true" ]]; then
    force_publish_local_args="--force-publish '@aws-amplify/cli-internal'"
  fi
  # create release commit and release tags
  npx lerna version --preid=rc.$(git rev-parse --short HEAD) --exact --conventional-prerelease --conventional-commits --yes --no-push --include-merged-tags --message "chore(release): Publish rc [ci skip]" $(echo $force_publish_local_args) --no-commit-hooks


  # if publishing locally to verdaccio
  if [[ "$LOCAL_PUBLISH_TO_LATEST" == "true" ]]; then
    # publish to verdaccio with no dist tag (default to latest)
    lernaPublishExitOnFailure from-git --yes --no-push
    echo "Published packages to verdaccio"
    echo "Exiting without pushing release commit or release tags"
    exit 0
  fi

  # publish versions that were just computed
  lernaPublishExitOnFailure from-git --yes --no-push --dist-tag rc

  # push release commit
  git push origin "$BRANCH_NAME"

  # push release tags
  git tag --points-at HEAD | xargs git push origin
else
  echo "branch name" "$BRANCH_NAME" "did not match any branch publish rules. Skipping publish"
fi
