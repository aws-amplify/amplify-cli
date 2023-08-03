#!/bin/bash

scriptDir=$(dirname -- "$(readlink -f -- "$BASH_SOURCE")")
source $scriptDir/.env set

printf 'What is your PR number ? '
read PR_NUMBER

printf 'Did you submit PR from fork (y/n)? '
read FROM_FORK

if [ "$FROM_FORK" == "${FROM_FORK#[Yy]}" ] ;then
  # if not
  printf 'What is your branch name in main repo ? '
  read BRANCH_NAME
  BRANCH_OVERRIDE="--environment-variables-override name=BRANCH_NAME,value=$BRANCH_NAME,type=PLAINTEXT"
fi

mwinit --aea
ada cred update --profile=cb-ci-account --account=$E2E_ACCOUNT_PROD --role=Admin --provider=isengard --once
RESULT=$(aws codebuild start-build-batch \
--profile=cb-ci-account \
--region us-east-1 \
--project-name AmplifyCLI-PR-Testing \
--build-timeout-in-minutes-override 180 \
--source-version "pr/$PR_NUMBER" \
--debug-session-enabled \
--git-clone-depth-override=1000 $BRANCH_OVERRIDE \
--query 'buildBatch.id' --output text)

echo "https://us-east-1.console.aws.amazon.com/codesuite/codebuild/$E2E_ACCOUNT_PROD/projects/AmplifyCLI-PR-Testing/batch/$RESULT?region=us-east-1"
