#!/bin/sh

# set exit on error to true
set -e

# Unassume the current role
unset AWS_ACCESS_KEY_ID
unset AWS_SECRET_ACCESS_KEY
unset AWS_SESSION_TOKEN

# Reassume the e2e test account role
creds=$(aws sts assume-role --role-arn $TEST_ACCOUNT_ROLE --role-session-name testSession1248634 --duration-seconds 3600)
if [ -z $(echo $creds | jq -c -r '.AssumedRoleUser.Arn') ]; then
    return
fi

export AWS_ACCESS_KEY_ID=$(echo $creds | jq -c -r ".Credentials.AccessKeyId")
export AWS_SECRET_ACCESS_KEY=$(echo $creds | jq -c -r ".Credentials.SecretAccessKey")
export AWS_SESSION_TOKEN=$(echo $creds | jq -c -r ".Credentials.SessionToken")

echo "{ \"accessKeyId\": \"$AWS_ACCESS_KEY_ID\", \"secretAccessKey\": \"$AWS_SECRET_ACCESS_KEY\", \"sessionToken\": \"$AWS_SESSION_TOKEN\" }"
