#!/bin/sh -xv
echo $1
cd $1
amplify-dev init
echo "amplify init completed"