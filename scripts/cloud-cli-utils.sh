#!/bin/bash

# set exit on error to true
set -e
# load .env
set -o allexport
source ./scripts/.env set

function authenticate {
    account_number=$1
    role_name=$2
    profile_name=$3
    echo Loading account credentials for Account $account_number with Role: $role_name...
    if ! ada cred update --profile="${profile_name}" --account="${account_number}" --role=${role_name} --provider=isengard --once; then
        echo ""
        echo "❌ Failed to authenticate with ada."
        echo "Please run 'mwinit' (or 'mwinit -s -f' if using FIDO key) and try again."
        exit 1
    fi
    aws configure set region us-east-1 --profile $profile_name
}
function triggerProjectBatch {
    account_number=$1
    role_name=$2
    profile_name=$3
    project_name=$4
    target_branch=$5
    npm_tag=$6
    authenticate $account_number $role_name $profile_name
    echo AWS Account: $account_number
    echo Project: $project_name
    echo Target Branch: $target_branch
    
    IMAGE_OVERRIDE_FLAG=""
    if [ -n "$CODEBUILD_IMAGE_OVERRIDE" ]; then
      IMAGE_OVERRIDE_FLAG="--image-override $CODEBUILD_IMAGE_OVERRIDE"
      echo "Using image override: $CODEBUILD_IMAGE_OVERRIDE"
    fi
    
    if [[ "$npm_tag" != "" ]]; then
      echo NPM tag: $npm_tag
      npm_variable_override="name=NPM_TAG,value=$npm_tag,type=PLAINTEXT"
    fi
    RESULT=$(aws codebuild start-build-batch --profile="${profile_name}" --project-name $project_name --source-version=$target_branch \
     $IMAGE_OVERRIDE_FLAG \
     --environment-variables-override name=BRANCH_NAME,value=$target_branch,type=PLAINTEXT $npm_variable_override \
     --query 'buildBatch.id' --output text)
    echo "https://us-east-1.console.aws.amazon.com/codesuite/codebuild/$account_number/projects/$project_name/batch/$RESULT?region=us-east-1"
}
