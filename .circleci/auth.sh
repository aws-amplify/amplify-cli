#!/bin/sh -xv
cd ../aws-amplify-cypress-auth
amplify add auth
amplify push
echo "executed all Amplify commands"