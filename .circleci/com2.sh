#!/bin/sh -xv
cd aws-amplify-cypress-auth
amplify init
amplify add api
amplify push
echo "executed all Amplify commands"