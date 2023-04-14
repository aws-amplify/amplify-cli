#!/bin/bash

# set exit on error to true
set -e

export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

export AMPLIFY_DIR=$CODEBUILD_SRC_DIR/out
export AMPLIFY_PATH=$CODEBUILD_SRC_DIR/out/amplify.exe

echo $CODEBUILD_SRC_DIR
echo $AMPLIFY_DIR

node -v
npm -v
yarn -v
npm i -g yarn

source ./scripts-windows/shared-scripts-windows.sh

_setShell

yarn run production-build
yarn build-tests

storeCache $CODEBUILD_SRC_DIR repo-windows
storeCache $HOME/.cache .cache-windows
