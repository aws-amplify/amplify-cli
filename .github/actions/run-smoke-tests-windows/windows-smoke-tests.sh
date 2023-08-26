#!/bin/bash

$AMPLIFY_PATH version

random_guid=$(powershell -Command "[guid]::NewGuid().ToString()")
random_guid=${random_guid//-/}
random_guid=${random_guid:0:6}
projDir="smoke-test-${random_guid}"
echo "AMPLIFY_PROJ_DIR=$projDir" >> $GITHUB_ENV

mkdir $projDir
cd $projDir

$AMPLIFY_PATH init --yes
