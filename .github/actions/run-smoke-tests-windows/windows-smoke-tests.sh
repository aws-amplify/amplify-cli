#!/bin/bash -e

$AMPLIFY_PATH version

random_guid=$(powershell -Command "[guid]::NewGuid().ToString()")
random_guid=${random_guid//-/}
random_guid=${random_guid:0:6}
projDir="smoke-test-${random_guid}"
echo "AMPLIFY_PROJ_DIR=$projDir" >> $GITHUB_ENV

# Read headless requests content. This must be done before we change directory to $projDir.
THIS_SCRIPT_PATH=$(dirname "${BASH_SOURCE[0]}")
ADD_AUTH_REQUEST=$(cat $THIS_SCRIPT_PATH/add_auth_request.json)
ADD_AUTH_REQUEST=${ADD_AUTH_REQUEST//[$'\r\n']}
ADD_API_REQUEST=$(cat $THIS_SCRIPT_PATH/add_api_request.json)
ADD_API_REQUEST=${ADD_API_REQUEST//[$'\r\n']}

mkdir $projDir
cd $projDir

$AMPLIFY_PATH init --yes

$AMPLIFY_PATH status

echo $ADD_AUTH_REQUEST
$AMPLIFY_PATH add auth --headless <<< $ADD_AUTH_REQUEST

$AMPLIFY_PATH status

$AMPLIFY_PATH push --yes

$AMPLIFY_PATH status

echo $ADD_API_REQUEST
$AMPLIFY_PATH add api --headless <<< $ADD_API_REQUEST

$AMPLIFY_PATH status

$AMPLIFY_PATH push --yes

$AMPLIFY_PATH status
