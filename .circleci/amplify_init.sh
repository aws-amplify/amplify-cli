#!/bin/sh -xv
echo $1
cd $1
amplify init
echo "amplify init completed"