#!/bin/bash -e

$AMPLIFY_PATH version

random_guid=$(powershell -Command "[guid]::NewGuid().ToString()")
random_guid=${random_guid//-/}
random_guid=${random_guid:0:6}
projDir="smoke-test-${random_guid}"
echo "AMPLIFY_PROJ_DIR=$projDir" >> $GITHUB_ENV

mkdir $projDir
cd $projDir

$AMPLIFY_PATH init --yes

$AMPLIFY_PATH status

ADD_AUTH_REQUEST=$(cat ../.github/actions/run-smoke-tests-windows/add_auth_request.json)
ADD_AUTH_REQUEST=${ADD_AUTH_REQUEST//[$'\r\n']}
echo $ADD_AUTH_REQUEST
$AMPLIFY_PATH add auth --headless <<< $ADD_AUTH_REQUEST

$AMPLIFY_PATH status

$AMPLIFY_PATH push --yes

$AMPLIFY_PATH status

ADD_API_REQUEST=$(cat ../.github/actions/run-smoke-tests-windows/add_api_request.json)
ADD_API_REQUEST=${ADD_API_REQUEST//[$'\r\n']}
echo $ADD_API_REQUEST
$AMPLIFY_PATH add api --headless <<< $ADD_API_REQUEST

$AMPLIFY_PATH status

$AMPLIFY_PATH push --yes

$AMPLIFY_PATH status
