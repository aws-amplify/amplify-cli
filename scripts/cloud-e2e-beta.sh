#!/bin/bash

# set exit on error to true
set -e

set -o allexport
source ./scripts/.env set
PROFILE=AmplifyCLIE2EBeta

ACCOUNT=$E2E_ACCOUNT_BETA
echo Submitting CodeBuild Request to AWS Account: $ACCOUNT
CURR_BRANCH=$(git branch --show-current)
echo Current branch is: $CURR_BRANCH
mwinit
ada cred update --profile="${PROFILE}" --account="${ACCOUNT}" --role=CodeBuildE2E --provider=isengard --once
aws configure set region us-east-1 --profile $PROFILE
echo credentials loaded
RESULT=$(aws codebuild start-build-batch --profile="${PROFILE}" --project-name AmplifyCLI-E2E-Testing --source-version=$CURR_BRANCH --query 'buildBatch.id' --output text)
echo "https://us-east-1.console.aws.amazon.com/codesuite/codebuild/$ACCOUNT/projects/AmplifyCLI-E2E-Testing/batch/$RESULT?region=us-east-1"
