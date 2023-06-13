#!/bin/bash

# set exit on error to true
set -e

source ./shared-scripts.sh && _uploadReportsToS3 $CODEBUILD_SOURCE_VERSION $CODEBUILD_BATCH_BUILD_IDENTIFIER amplify-e2e-tests
