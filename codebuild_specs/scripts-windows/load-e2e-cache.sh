#!/bin/bash

source ./codebuild_specs/scripts-windows/shared-scripts-windows.sh

loadCache verdaccio-cache $CODEBUILD_SRC_DIR/../verdaccio-cache
loadCache all-binaries $CODEBUILD_SRC_DIR/out
loadCacheFile .amplify-pkg-version $CODEBUILD_SRC_DIR/.amplify-pkg-version
loadCacheFile UNIFIED_CHANGELOG.md $CODEBUILD_SRC_DIR/UNIFIED_CHANGELOG.md

ls $CODEBUILD_SRC_DIR
