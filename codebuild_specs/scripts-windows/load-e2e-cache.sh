#!/bin/bash

source ./codebuild_specs/scripts-windows/shared-scripts-windows.sh

# export CODEBUILD_SOURCE_VERSION=b0e2753b3e8c8f520c3a57d74d75cf293ee7b978
loadCache repo-windows $CODEBUILD_SRC_DIR
loadCache .cache-windows $HOME/AppData/Local/Yarn/Cache/v6

loadCache verdaccio-cache $CODEBUILD_SRC_DIR/../verdaccio-cache
loadCache all-binaries $CODEBUILD_SRC_DIR/out
loadCacheFile .amplify-pkg-version $CODEBUILD_SRC_DIR/.amplify-pkg-version
loadCacheFile UNIFIED_CHANGELOG.md $CODEBUILD_SRC_DIR/UNIFIED_CHANGELOG.md

ls $CODEBUILD_SRC_DIR
