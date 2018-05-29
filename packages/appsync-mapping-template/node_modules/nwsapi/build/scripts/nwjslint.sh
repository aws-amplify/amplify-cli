#!/bin/bash

echo -ne "NW: running javascript lint on sources"

# set sources
SOURCES=${1}
if [ "${SOURCES}x" == 'x' ]; then
  pushd . &> /dev/null
  cd ..; SOURCES=`pwd`
  popd &> /dev/null
fi

# check platform
PLATFORM=`uname -s`

# set platform specifick executables
if [ $PLATFORM == 'Darwin' ]; then
  JSL=bin/jsl_macos
elif [ $PLATFORM == 'Linux' ]; then
  JSL=bin/jsl_linux
elif [ $PLATFORM == 'Windows' ]; then
  JSL=bin/jsl.exe
fi

# save current working path
pusdh . &> /dev/null

# enter root path
cd $SOURCES

> $SOURCES/dist/lint.log

for item in `find $SOURCES/src -type d`
do {
  sources=`ls $item/*.js 2>/dev/null`
  for file in $sources
  do {
    $JSL -conf build/conf/jsl.conf -nologo -nofilelisting -nosummary -process $file >> $SOURCES/dist/lint.log
    echo -ne "."
  } done
} done

echo ""

popd &> /dev/null

exit 0
