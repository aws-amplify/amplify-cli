#!/bin/bash

# set exit on error to true
set -e

export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

node -v
npm -v
yarn -v

source ./codebuild_specs/scripts-windows/shared-scripts-windows.sh
_setShell
_build
_saveBuild
