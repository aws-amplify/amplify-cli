#!/bin/bash

# set exit on error to true
set -e
set +x

echo "CODEBUILD_SOURCE_VERSION $CODEBUILD_SOURCE_VERSION"
echo "CODEBUILD_BATCH_BUILD_IDENTIFIER $CODEBUILD_BATCH_BUILD_IDENTIFIER"

source ./shared-scripts.sh

echo "uploading 12"
_uploadReportsToS3 $CODEBUILD_SOURCE_VERSION $CODEBUILD_BATCH_BUILD_IDENTIFIER amplify-e2e-tests
