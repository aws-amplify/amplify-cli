#!/bin/bash

# this file is used to automate the process of triggering an e2e build for each environment type

# set exit on error to true
set -e
# load .env
set -o allexport
source ./scripts/.env set
export CURR_BRANCH=$(git branch --show-current)
function authenticate {
    echo Authenticating terminal...
    mwinit --aea
    echo Loading E2E account credentials...
    ada cred update --profile="${CLOUD_E2E_PROFILE}" --account="${CLOUD_E2E_ACCOUNT}" --role=CodeBuildE2E --provider=isengard --once
    aws configure set region us-east-1 --profile $CLOUD_E2E_PROFILE
}
function triggerBuild {
    echo Submitting CodeBuild Request to AWS Account: $CLOUD_E2E_ACCOUNT
    echo Current branch is: $CURR_BRANCH
    echo E2E Target branch is: $TARGET_BRANCH
    RESULT=$(aws codebuild start-build-batch --profile="${CLOUD_E2E_PROFILE}" --project-name AmplifyCLI-E2E-Testing --source-version=$TARGET_BRANCH --query 'buildBatch.id' --output text)
    echo "https://us-east-1.console.aws.amazon.com/codesuite/codebuild/$CLOUD_E2E_ACCOUNT/projects/AmplifyCLI-E2E-Testing/batch/$RESULT?region=us-east-1"
}
function cloudE2ELocal {
    echo Running Local E2E Test Suite
    export CLOUD_E2E_PROFILE=AmplifyCLIE2ELocal
    export CLOUD_E2E_ACCOUNT=$E2E_ACCOUNT_LOCAL
    export TARGET_BRANCH=$CURR_BRANCH
    authenticate
    triggerBuild
}
function cloudE2EBeta {
    echo Running Beta E2E Test Suite
    export CLOUD_E2E_PROFILE=AmplifyCLIE2EBeta
    export CLOUD_E2E_ACCOUNT=$E2E_ACCOUNT_BETA
    export TARGET_BRANCH=$CURR_BRANCH
    authenticate
    triggerBuild
}
function cloudE2E {
    echo Running Prod E2E Test Suite
    export CLOUD_E2E_PROFILE=AmplifyCLIE2E
    export CLOUD_E2E_ACCOUNT=$E2E_ACCOUNT_PROD
    export TARGET_BRANCH=run-cb-e2e/$USER/$CURR_BRANCH
    git push $(git remote -v | grep aws-amplify/amplify-cli | head -n1 | awk '{print $1;}') $CURR_BRANCH:$TARGET_BRANCH --no-verify --force-with-lease
    authenticate
    triggerBuild
}
