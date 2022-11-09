#!/bin/bash

# fill in AWS Access keys
S3_ACCESS_KEY=""
S3_SECRET_ACCESS_KEY=""

aws configure --profile=s3-uploader set aws_access_key_id $S3_ACCESS_KEY
aws configure --profile=s3-uploader set aws_secret_access_key $S3_SECRET_ACCESS_KEY

BUCKET_NAME="list-test-bucket"
FILE_NAME="test"
BAD_FILE_NAME="test2"

touch $FILE_NAME
touch $BAD_FILE_NAME


#####

echo "Testing with correct permissions and correct files"
aws --profile=s3-uploader s3 rm s3://$BUCKET_NAME/$FILE_NAME
aws --profile=s3-uploader s3 rm s3://$BUCKET_NAME/$BAD_FILE_NAME
aws --profile=s3-uploader s3 cp $FILE_NAME s3://list-test-bucket

INCORRECT_FILES="$(set -o pipefail && aws --profile=s3-uploader s3 ls s3://$BUCKET_NAME/$FILE_NAME | ( egrep -v "test.txt" || true ) | wc -l | xargs)"
INCORRECT_PERMISSIONS=$?

echo "INCORRECT_FILES $INCORRECT_FILES"
echo "INCORRECT_PERMISSIONS $INCORRECT_PERMISSIONS"
if [[ $INCORRECT_PERMISSIONS == "0" && $INCORRECT_FILES == "0" ]] ; then
echo "TEST PASSED"
else
echo "TEST FAILED"
fi

if [[ $INCORRECT_PERMISSIONS -ne "0" || $INCORRECT_FILES -ne "0" ]] ; then
echo "WOULD HAVE ENTERED IF STATEMENT"
else
echo "WOULD NOT HAVE ENTERED IF STATEMENT"
fi


#####

echo "Testing with incorrect permissions and correct files"
touch $FILE_NAME
aws --profile=s3-uploader s3 rm s3://$BUCKET_NAME/$FILE_NAME
aws --profile=s3-uploader s3 rm s3://$BUCKET_NAME/$BAD_FILE_NAME
aws --profile=s3-uploader s3 cp $FILE_NAME s3://list-test-bucket

INCORRECT_FILES="$(set -o pipefail && aws s3 ls s3://$BUCKET_NAME | ( egrep -v "test.txt" || true ) | wc -l | xargs)"
INCORRECT_PERMISSIONS=$?

echo "INCORRECT_FILES $INCORRECT_FILES"
echo "INCORRECT_PERMISSIONS $INCORRECT_PERMISSIONS"
if [[ $INCORRECT_PERMISSIONS -ne "0" && $INCORRECT_FILES == "0" ]] ; then
echo "TEST PASSED"
else
echo "TEST FAILED"
fi

if [[ $INCORRECT_PERMISSIONS -ne "0" || $INCORRECT_FILES -ne "0" ]] ; then
echo "WOULD HAVE ENTERED IF STATEMENT"
else
echo "WOULD NOT HAVE ENTERED IF STATEMENT"
fi


#####

echo "Testing with correct permissions and incorrect files"
touch $FILE_NAME
touch $BAD_FILE_NAME
aws --profile=s3-uploader s3 rm s3://$BUCKET_NAME/$FILE_NAME
aws --profile=s3-uploader s3 rm s3://$BUCKET_NAME/$BAD_FILE_NAME
aws --profile=s3-uploader s3 cp $FILE_NAME s3://list-test-bucket
aws --profile=s3-uploader s3 cp $BAD_FILE_NAME s3://list-test-bucket

INCORRECT_FILES="$(set -o pipefail && aws --profile=s3-uploader s3 ls s3://$BUCKET_NAME | ( egrep -v "test.txt" || true ) | wc -l | xargs)"
INCORRECT_PERMISSIONS=$?

echo "INCORRECT_FILES $INCORRECT_FILES"
echo "INCORRECT_PERMISSIONS $INCORRECT_PERMISSIONS"
if [[ $INCORRECT_PERMISSIONS == "0" && $INCORRECT_FILES -ne "0" ]] ; then
echo "TEST PASSED"
else
echo "TEST FAILED"
fi

if [[ $INCORRECT_PERMISSIONS -ne "0" || $INCORRECT_FILES -ne "0" ]] ; then
echo "WOULD HAVE ENTERED IF STATEMENT"
else
echo "WOULD NOT HAVE ENTERED IF STATEMENT"
fi


#####

echo "Testing with incorrect permissions and incorrect files"
# $INCORRECT_FILES will always be 0 if bad permissions
touch $FILE_NAME
touch $BAD_FILE_NAME
aws --profile=s3-uploader s3 rm s3://$BUCKET_NAME/$FILE_NAME
aws --profile=s3-uploader s3 rm s3://$BUCKET_NAME/$BAD_FILE_NAME
aws --profile=s3-uploader s3 cp $FILE_NAME s3://list-test-bucket
aws --profile=s3-uploader s3 cp $BAD_FILE_NAME s3://list-test-bucket

INCORRECT_FILES="$(set -o pipefail && aws s3 ls s3://$BUCKET_NAME | ( egrep -v "test.txt" || true ) | wc -l | xargs)"
INCORRECT_PERMISSIONS=$?

echo "INCORRECT_FILES $INCORRECT_FILES"
echo "INCORRECT_PERMISSIONS $INCORRECT_PERMISSIONS"
if [[ $INCORRECT_PERMISSIONS -ne "0" && $INCORRECT_FILES == "0" ]] ; then
echo "TEST PASSED"
else
echo "TEST FAILED"
fi

if [[ $INCORRECT_PERMISSIONS -ne "0" || $INCORRECT_FILES -ne "0" ]] ; then
echo "WOULD HAVE ENTERED IF STATEMENT"
else
echo "WOULD NOT HAVE ENTERED IF STATEMENT"
fi


#####

# clean up
aws --profile=s3-uploader s3 rm s3://$BUCKET_NAME/$FILE_NAME
aws --profile=s3-uploader s3 rm s3://$BUCKET_NAME/$BAD_FILE_NAME
rm $FILE_NAME
rm $BAD_FILE_NAME