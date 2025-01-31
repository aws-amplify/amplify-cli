#!/bin/bash

# set exit on error to true
set -e

export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

export AMPLIFY_DIR=$CODEBUILD_SRC_DIR\\out
export AMPLIFY_PATH=$CODEBUILD_SRC_DIR\\out\\amplify.exe
export NODE_OPTIONS=--max-old-space-size=5120

source .circleci/local_publish_helpers_codebuild.sh
source ./codebuild_specs/scripts-windows/shared-scripts-windows.sh

export CLI_REGION=$(yarn ts-node ./scripts/select-region-for-e2e-test.ts)
echo "Test will run in $CLI_REGION"

# source $BASH_ENV

amplify version

cd packages/amplify-e2e-tests

_loadTestAccountCredentials

retry runE2eTestCb
