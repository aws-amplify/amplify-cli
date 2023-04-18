#!/bin/bash

# set exit on error to true
set -e

export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

export AMPLIFY_DIR=$CODEBUILD_SRC_DIR\\out
export AMPLIFY_PATH=$CODEBUILD_SRC_DIR\\out\\amplify.exe

echo $CODEBUILD_SRC_DIR
echo $AMPLIFY_DIR

aws sts get-caller-identity

node -v
npm -v
yarn -v

source .\codebuild_specs\scripts-windows\shared-scripts-windows.sh

_setShell
_build



# _saveBuild
loadCache verdaccio-cache $CODEBUILD_SRC_DIR/../verdaccio-cache
loadCache all-binaries $CODEBUILD_SRC_DIR/out
loadCacheFile .amplify-pkg-version $CODEBUILD_SRC_DIR/.amplify-pkg-version
loadCacheFile UNIFIED_CHANGELOG.md $CODEBUILD_SRC_DIR/UNIFIED_CHANGELOG.md

echo Rename the Packaged CLI to amplify
cd $CODEBUILD_SRC_DIR/out
cp amplify-pkg-win-x64.exe amplify.exe

echo Move CLI Binary to alredy existing PATH

# This is a Hack to make sure the Amplify CLI is in the PATH
cp $CODEBUILD_SRC_DIR/out/amplify-pkg-win-x64.exe $env:homedrive\$env:homepath\AppData\Local\Microsoft\WindowsApps\amplify.exe
_install_packaged_cli_win
# verify installation
amplify version

source .circleci/local_publish_helpers.sh && startLocalRegistry "$CODEBUILD_SRC_DIR/.circleci/verdaccio.yaml"
source $BASH_ENV

setNpmRegistryUrlToLocal
changeNpmGlobalPath
amplify version

cd packages/amplify-e2e-tests

_loadTestAccountCredentials

retry runE2eTest
