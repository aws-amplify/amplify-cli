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
    # Optional: path to a batchspec to override the project's default buildspec. Used by the split
    # Linux/Windows e2e mode (cloudE2ESplit) to fire one batch per platform against the same project.
    buildspec_override=$7
    # Optional: per-build timeout (minutes) override for the builds in this batch. The split mode
    # raises this above the project default to give the chained shards extra margin.
    build_timeout=$8
    authenticate $account_number $role_name $profile_name
    echo AWS Account: $account_number
    echo Project: $project_name
    echo Target Branch: $target_branch
    
    IMAGE_OVERRIDE_FLAG=""
    if [ -n "$CODEBUILD_IMAGE_OVERRIDE" ]; then
      IMAGE_OVERRIDE_FLAG="--image-override $CODEBUILD_IMAGE_OVERRIDE"
      echo "Using image override: $CODEBUILD_IMAGE_OVERRIDE"
    fi

    BUILDSPEC_OVERRIDE_FLAG=""
    if [ -n "$buildspec_override" ]; then
      BUILDSPEC_OVERRIDE_FLAG="--buildspec-override $buildspec_override"
      echo "Using buildspec override: $buildspec_override"
    fi

    BUILD_TIMEOUT_FLAG=""
    if [ -n "$build_timeout" ]; then
      BUILD_TIMEOUT_FLAG="--build-timeout-in-minutes-override $build_timeout"
      echo "Using build timeout override: ${build_timeout} minutes"
    fi
    
    if [[ "$npm_tag" != "" ]]; then
      echo NPM tag: $npm_tag
      npm_variable_override="name=NPM_TAG,value=$npm_tag,type=PLAINTEXT"
    fi
    RESULT=$(aws codebuild start-build-batch --profile="${profile_name}" --project-name $project_name --source-version=$target_branch \
     $IMAGE_OVERRIDE_FLAG \
     $BUILDSPEC_OVERRIDE_FLAG \
     $BUILD_TIMEOUT_FLAG \
     --environment-variables-override name=BRANCH_NAME,value=$target_branch,type=PLAINTEXT $npm_variable_override \
     --query 'buildBatch.id' --output text)
    echo "Batch ID: $RESULT"
    echo "https://us-east-1.console.aws.amazon.com/codesuite/codebuild/$account_number/projects/$project_name/batch/$RESULT?region=us-east-1"
}
