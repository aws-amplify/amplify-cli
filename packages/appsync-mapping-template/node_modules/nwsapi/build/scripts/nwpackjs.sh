#!/bin/bash

echo -ne "NW: building distribution from sources"

# retrieve build infos
VERSION=`cat ${SOURCES}build/VERSION`
REVISION=1

# set used variables
BASEDIR=`pwd`
PKGNAME="nwsapi"
RELEASE=`date +%Y%m%d%H%M%S`

# set sources
SOURCES=${1}
if [ "${SOURCES}x" == 'x' ]; then
  pushd . &> /dev/null
  cd ..; SOURCES=`pwd`
  popd &> /dev/null
fi

# check working platform
PLATFORM=`uname -s`

# set platform specifick executables
if [ $PLATFORM == 'Darwin' ]; then
  JSMIN=bin/jsmin_macos
  JSVM=bin/js_macos
elif [ $PLATFORM == 'Linux' ]; then
  JSMIN=bin/jsmin_linux
  JSVM=bin/js_linux
elif [ $PLATFORM == 'Windows' ]; then
  JSMIN=bin/jsmin.exe
  JSVM=bin/js.exe
fi

pushd . &> /dev/null

cd $SOURCES

# ensure empty
> dist/$PKGNAME-src.js
> dist/$PKGNAME-min.js

cat build/HEADER >> dist/$PKGNAME-pac.js

# add selector engine to source file
cat src/nwsapi.js >> dist/$PKGNAME-src.js

# add selector engine to minified file
cat src/nwsapi.js | $JSMIN | tr -d "\n" >> dist/$PKGNAME-min.js

# minification of variables and privates
echo ""
echo -ne "NW: starting minification, takes time please wait, "
$JSVM build/scripts/nwpacker.js < dist/nwsapi-src.js >> dist/nwsapi-pac.js
echo -ne "complete..."
echo ""

# build a compressed version of the minified file 
gzip -c -n9 dist/$PKGNAME-pac.js > dist/$PKGNAME-zip.js

# build a versioned file name of the minified file
#cp dist/$PKGNAME-pac.js dist/$PKGNAME-$RELEASE.js

# now copy packed file to the real nwsapi.js
cp dist/nwsapi-pac.js dist/nwsapi.js

popd &> /dev/null

exit 0
