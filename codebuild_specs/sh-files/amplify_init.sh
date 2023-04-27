#!/bin/sh -xv
echo $1
cd $1

# touch ~/.aws/credentials ~/.aws/config
# echo "[default]" > ~/.aws/credentials
# echo "aws_access_key_id=$AWS_ACCESS_KEY_ID" >> ~/.aws/credentials
# echo "aws_secret_access_key=$AWS_SECRET_ACCESS_KEY" >> ~/.aws/credentials
# echo "aws_session_token=$AWS_SESSION_TOKEN" >> ~/.aws/credentials
# echo "[default]" > ~/.aws/config
# echo "region=us-west-2" >> ~/.aws/config

amplify-dev init
echo "amplify init completed"
