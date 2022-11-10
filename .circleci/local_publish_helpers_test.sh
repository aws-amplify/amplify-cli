#!/bin/bash

# fill in AWS Access keys
S3_ACCESS_KEY=""
S3_SECRET_ACCESS_KEY=""

aws configure --profile=s3-uploader set aws_access_key_id $S3_ACCESS_KEY
aws configure --profile=s3-uploader set aws_secret_access_key $S3_SECRET_ACCESS_KEY

BUCKET_NAME="list-test-bucket"
FILE_NAME="testfile"
CONFLICTING_FILE_NAME="otherfile"

touch $FILE_NAME
touch $CONFLICTING_FILE_NAME


#####

echo "Testing with correct permissions and correct files"
aws --profile=s3-uploader s3 rm s3://$BUCKET_NAME/$FILE_NAME
aws --profile=s3-uploader s3 rm s3://$BUCKET_NAME/$CONFLICTING_FILE_NAME
aws --profile=s3-uploader s3 cp $FILE_NAME s3://list-test-bucket

ALREADY_EXISTING_FILES="$(set -o pipefail && aws --profile=s3-uploader s3 ls s3://$BUCKET_NAME/$FILE_NAME | ( egrep -v "$FILE_NAME*" || true ) | wc -l | xargs)"
INCORRECT_PERMISSIONS=$?

echo "ALREADY_EXISTING_FILES $ALREADY_EXISTING_FILES"
echo "INCORRECT_PERMISSIONS $INCORRECT_PERMISSIONS"
if [[ $INCORRECT_PERMISSIONS == "0" && $ALREADY_EXISTING_FILES == "0" ]] ; then
echo "TEST PASSED"
else
echo "TEST FAILED"
fi

if [[ $INCORRECT_PERMISSIONS -ne "0" || $ALREADY_EXISTING_FILES -ne "0" ]] ; then
echo "WOULD HAVE ENTERED IF STATEMENT"
else
echo "WOULD NOT HAVE ENTERED IF STATEMENT"
fi


#####

echo "Testing with incorrect permissions and correct files"
touch $FILE_NAME
aws --profile=s3-uploader s3 rm s3://$BUCKET_NAME/$FILE_NAME
aws --profile=s3-uploader s3 rm s3://$BUCKET_NAME/$CONFLICTING_FILE_NAME
aws --profile=s3-uploader s3 cp $FILE_NAME s3://list-test-bucket

ALREADY_EXISTING_FILES="$(set -o pipefail && aws s3 ls s3://$BUCKET_NAME | ( egrep -v "$FILE_NAME*" || true ) | wc -l | xargs)"
INCORRECT_PERMISSIONS=$?

echo "ALREADY_EXISTING_FILES $ALREADY_EXISTING_FILES"
echo "INCORRECT_PERMISSIONS $INCORRECT_PERMISSIONS"
if [[ $INCORRECT_PERMISSIONS -ne "0" && $ALREADY_EXISTING_FILES == "0" ]] ; then
echo "TEST PASSED"
else
echo "TEST FAILED"
fi

if [[ $INCORRECT_PERMISSIONS -ne "0" || $ALREADY_EXISTING_FILES -ne "0" ]] ; then
echo "WOULD HAVE ENTERED IF STATEMENT"
else
echo "WOULD NOT HAVE ENTERED IF STATEMENT"
fi


#####

echo "Testing with correct permissions and incorrect files"
touch $FILE_NAME
touch $CONFLICTING_FILE_NAME
aws --profile=s3-uploader s3 rm s3://$BUCKET_NAME/$FILE_NAME
aws --profile=s3-uploader s3 rm s3://$BUCKET_NAME/$CONFLICTING_FILE_NAME
aws --profile=s3-uploader s3 cp $FILE_NAME s3://list-test-bucket
aws --profile=s3-uploader s3 cp $CONFLICTING_FILE_NAME s3://list-test-bucket

# exit 1

ALREADY_EXISTING_FILES="$(set -o pipefail && aws --profile=s3-uploader s3 ls s3://$BUCKET_NAME | ( egrep -v "$FILE_NAME*" || true ) | wc -l | xargs)"
INCORRECT_PERMISSIONS=$?

echo "ALREADY_EXISTING_FILES $ALREADY_EXISTING_FILES"
echo "INCORRECT_PERMISSIONS $INCORRECT_PERMISSIONS"
if [[ $INCORRECT_PERMISSIONS == "0" && $ALREADY_EXISTING_FILES -ne "0" ]] ; then
echo "TEST PASSED"
else
echo "TEST FAILED"
fi

if [[ $INCORRECT_PERMISSIONS -ne "0" || $ALREADY_EXISTING_FILES -ne "0" ]] ; then
echo "WOULD HAVE ENTERED IF STATEMENT"
else
echo "WOULD NOT HAVE ENTERED IF STATEMENT"
fi


#####

echo "Testing with incorrect permissions and incorrect files"
# $ALREADY_EXISTING_FILES will always be 0 if bad permissions
touch $FILE_NAME
touch $CONFLICTING_FILE_NAME
aws --profile=s3-uploader s3 rm s3://$BUCKET_NAME/$FILE_NAME
aws --profile=s3-uploader s3 rm s3://$BUCKET_NAME/$CONFLICTING_FILE_NAME
aws --profile=s3-uploader s3 cp $FILE_NAME s3://list-test-bucket
aws --profile=s3-uploader s3 cp $CONFLICTING_FILE_NAME s3://list-test-bucket

ALREADY_EXISTING_FILES="$(set -o pipefail && aws s3 ls s3://$BUCKET_NAME | ( egrep -v "$FILE_NAME*" || true ) | wc -l | xargs)"
INCORRECT_PERMISSIONS=$?

echo "ALREADY_EXISTING_FILES $ALREADY_EXISTING_FILES"
echo "INCORRECT_PERMISSIONS $INCORRECT_PERMISSIONS"
if [[ $INCORRECT_PERMISSIONS -ne "0" && $ALREADY_EXISTING_FILES == "0" ]] ; then
echo "TEST PASSED"
else
echo "TEST FAILED"
fi

if [[ $INCORRECT_PERMISSIONS -ne "0" || $ALREADY_EXISTING_FILES -ne "0" ]] ; then
echo "WOULD HAVE ENTERED IF STATEMENT"
else
echo "WOULD NOT HAVE ENTERED IF STATEMENT"
fi


#####

# clean up
aws --profile=s3-uploader s3 rm s3://$BUCKET_NAME/$FILE_NAME
aws --profile=s3-uploader s3 rm s3://$BUCKET_NAME/$CONFLICTING_FILE_NAME
rm $FILE_NAME
rm $CONFLICTING_FILE_NAME