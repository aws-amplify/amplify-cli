#!/bin/bash

# set exit on error to true
set -e
# load .env
set -o allexport
source ./scripts/.env set

REGION=us-east-1

function authenticate {
    account_number=$1
    role_name=$2
    profile_name=$3
    echo Authenticating terminal...
    mwinit --aea
    echo Loading account credentials for Account $account_number with Role: $role_name...
    ada cred update --profile="${profile_name}" --account="${account_number}" --role=${role_name} --provider=isengard --once
    aws configure set region $REGION --profile $profile_name
}
function triggerProjectBatch {
    account_number=$1
    role_name=$2
    profile_name=$3
    project_name=$4
    target_branch=$5
    authenticate $account_number $role_name $profile_name
    echo AWS Account: $account_number
    echo Project: $project_name 
    echo Target Branch: $target_branch
    RESULT=$(aws codebuild start-build-batch --region=$REGION --profile="${profile_name}" --project-name $project_name --source-version=$target_branch \
     --environment-variables-override name=BRANCH_NAME,value=$target_branch,type=PLAINTEXT \
     --query 'buildBatch.id' --output text)
    echo "https://$REGION.console.aws.amazon.com/codesuite/codebuild/$account_number/projects/$project_name/batch/$RESULT?region=$REGION"
}
