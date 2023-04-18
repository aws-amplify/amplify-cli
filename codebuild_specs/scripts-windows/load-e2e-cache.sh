#!/bin/bash

source ./codebuild_specs/scripts-windows/shared-scripts-windows.sh

export CODEBUILD_SOURCE_VERSION=f421b4b1d41cd1d38fbb53bd34da7f6e67c302f6
loadCache repo-windows $CODEBUILD_SRC_DIR
loadCache .cache-windows $HOME/AppData/Local/Yarn/Cache/v6
loadCache verdaccio-cache $CODEBUILD_SRC_DIR/../verdaccio-cache

loadCache all-binaries $CODEBUILD_SRC_DIR/out
loadCacheFile .amplify-pkg-version $CODEBUILD_SRC_DIR/.amplify-pkg-version
loadCacheFile UNIFIED_CHANGELOG.md $CODEBUILD_SRC_DIR/UNIFIED_CHANGELOG.md

ls $CODEBUILD_SRC_DIR
