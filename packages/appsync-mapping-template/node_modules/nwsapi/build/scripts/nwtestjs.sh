#!/bin/bash

echo -ne "NW: VM loading test, building test units..."

# retrieve build infos
VERSION=`cat ${SOURCES}build/VERSION`
REVISION=1

# set used variables
BASEDIR=`pwd`
PKGNAME="nwsapi"
RELEASE=`date +%Y%m%d%H%M%S`

# set source
SOURCES=${1}
if [ "${SOURCES}x" == 'x' ]; then
  pushd . &> /dev/null
  cd ..; SOURCES=`pwd`
  popd &> /dev/null
fi

# check platform
PLATFORM=`uname -s`

if [ $PLATFORM == 'Darwin' ]; then
  JS=bin/js_macos
elif [ $PLATFORM == 'Linux' ]; then
  JS=bin/js_linux
elif [ $PLATFORM == 'Windows' ]; then
  JS=bin/js.exe
fi

pusdh . &> /dev/null

$JS test/jsvm/load_test.js < test/jsvm/load_test.html

if [ $? == '0' ]; then
  echo 'PASSED'
elif [ $? != '0' ]; then
  echo 'FAILED'
fi

popd &> /dev/null

exit 0
