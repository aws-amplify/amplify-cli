#!/bin/bash

# set exit on error to true
set -e
# load .env
set -o allexport
source ./scripts/.env set
PROFILE=AmplifyCLIE2E

ACCOUNT=$E2E_ACCOUNT_PROD
echo Submitting CodeBuild Request to AWS Account: $ACCOUNT
CURR_BRANCH=$(git branch --show-current)
UPSTREAM_BRANCH=run-e2e/$USER/$CURR_BRANCH
git push $(git remote -v | grep aws-amplify/amplify-cli | head -n1 | awk '{print $1;}') $CURR_BRANCH:$UPSTREAM_BRANCH --no-verify --force-with-lease
aws configure set region us-east-1 --profile $PROFILE
echo Current branch is: $CURR_BRANCH
echo Upstream branch is: $UPSTREAM_BRANCH
echo Authenticating terminal...
mwinit
echo Loading E2E account credentials...
ada cred update --profile="${PROFILE}" --account="${ACCOUNT}" --role=CodeBuildE2E --provider=isengard --once
echo Submitting Build Request
RESULT=$(aws codebuild start-build-batch --profile="${PROFILE}" --project-name AmplifyCLI-E2E-Testing --source-version=$CURR_BRANCH --query 'buildBatch.id' --output text)
echo "https://us-east-1.console.aws.amazon.com/codesuite/codebuild/$ACCOUNT/projects/AmplifyCLI-E2E-Testing/batch/$RESULT?region=us-east-1"
