#!/bin/bash
set -e
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"
source ./shared-scripts.sh
_uploadReportsToS3 $CODEBUILD_SOURCE_VERSION $CODEBUILD_BATCH_BUILD_IDENTIFIER amplify-e2e-tests
