#!/bin/bash

# set exit on error to true
set -e

export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

export NODE_OPTIONS=--max-old-space-size=4096

source shared-scripts.sh
_waitForJobs $CODEBUILD_SRC_DIR/codebuild_specs/wait_windows.json requirePrevJobsToSucceed
