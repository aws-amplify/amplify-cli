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

source ./codebuild_specs/scripts-windows/shared-scripts-windows.sh
_setShell
_build

ls ..
ls ~
ls $HOME
ls $HOME\..
ls $HOME\..\..

_saveBuild
