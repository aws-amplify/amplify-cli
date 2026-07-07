#!/bin/sh -xv
cd ../aws-amplify-cypress-api
amplify-dev add api
amplify-dev push --yes
echo "executed all Amplify commands"
