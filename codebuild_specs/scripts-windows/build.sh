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

ls ..
ls ~
ls $HOME
ls ..\\$HOME

source ./codebuild_specs/scripts-windows/shared-scripts-windows.sh

_setShell

yarn run production-build
yarn build-tests

ls ..
ls ~
ls ~/.cache/

source ./codebuild_specs/scripts-windows/shared-scripts-windows.sh
storeCache $CODEBUILD_SRC_DIR repo-windows
storeCache $HOME/.cache .cache-windows
