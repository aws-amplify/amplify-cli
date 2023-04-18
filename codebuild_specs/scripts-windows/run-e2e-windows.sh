#!/bin/bash

# set exit on error to true
set -e

export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

export AMPLIFY_DIR=$CODEBUILD_SRC_DIR\\out
export AMPLIFY_PATH=$CODEBUILD_SRC_DIR\\out\\amplify.exe

source .circleci/local_publish_helpers.sh
source ./codebuild_specs/scripts-windows/shared-scripts-windows.sh

# source $BASH_ENV

amplify version

cd packages/amplify-e2e-tests

_loadTestAccountCredentials

retry runE2eTest
