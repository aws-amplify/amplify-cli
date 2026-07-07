#!/bin/sh -xv
cd ../aws-amplify-cypress-auth
amplify-dev add auth
amplify-dev push --yes
echo "executed all Amplify commands"
