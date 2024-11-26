#!/bin/bash

# set exit on error to true
set -e

# The flags address the issue here: https://github.com/boto/botocore/issues/1716
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

# We have custom caching for our CodeBuild pipelines
# which allows us to share caches with jobs in the same batch

# storeCache <local path> <cache location>
function storeCache {
    localPath="$1"
    alias="$2"
    s3Path="s3://$CACHE_BUCKET_NAME/$CODEBUILD_SOURCE_VERSION/$alias"
    echo writing cache to $s3Path
    # zip contents and upload to s3
    # if ! (cd $localPath && tar -czf cache.tar . && ls && aws s3 cp cache.tar $s3Path); then
    #     echo Something went wrong storing the cache.
    # fi
    if ! (cd $localPath && tar -czf cache.tar . && ls && aws s3 cp cache.tar $s3Path); then
        echo Something went wrong storing the cache.
    fi
    echo done writing cache
    cd $CODEBUILD_SRC_DIR
}
function storeCacheFile {
    localFilePath="$1"
    alias="$2"
    s3Path="s3://$CACHE_BUCKET_NAME/$CODEBUILD_SOURCE_VERSION/$alias"
    echo writing cache to $s3Path
    # zip contents and upload to s3
    if ! (aws s3 cp $localFilePath $s3Path); then
        echo Something went wrong storing the cache.
    fi
    echo done writing cache
    cd $CODEBUILD_SRC_DIR
}
# loadCache <cache location> <local path>
function loadCache {
    alias="$1"
    localPath="$2"
    s3Path="s3://$CACHE_BUCKET_NAME/$CODEBUILD_SOURCE_VERSION/$alias"
    echo loading cache from $s3Path
    # create directory if it doesn't exist yet
    mkdir -p $localPath
    # check if cache exists in s3
    if ! aws s3 ls $s3Path > /dev/null; then
        echo "Cache not found."
        exit 0
    fi
    # tar --help
    # load cache and unzip it
    # if ! (cd $localPath && aws s3 cp $s3Path cache.tar && ls && tar -xzkf cache.tar); then
    #     echo "Something went wrong fetching the cache. Continuing anyway."
    # fi
    if ! (cd $localPath && aws s3 cp $s3Path - | tar xzkf -); then
        echo "Something went wrong fetching the cache. Continuing anyway."
    fi
    echo done loading cache
    cd $CODEBUILD_SRC_DIR
}
function loadCacheFile {
    alias="$1"
    localFilePath="$2"
    s3Path="s3://$CACHE_BUCKET_NAME/$CODEBUILD_SOURCE_VERSION/$alias"
    echo loading cache file from $s3Path
    # check if cache file exists in s3
    if ! aws s3 ls $s3Path > /dev/null; then
        echo "Cache file not found."
        exit 0
    fi
    # load cache file
    if ! (aws s3 cp $s3Path $localFilePath); then
        echo "Something went wrong fetching the cache file. Continuing anyway."
    fi
    echo done loading cache
    cd $CODEBUILD_SRC_DIR
}
function _loadTestAccountCredentials {
    echo ASSUMING PARENT TEST ACCOUNT credentials
    session_id=$((1 + $RANDOM % 10000))
    creds=$(aws sts assume-role --role-arn $TEST_ACCOUNT_ROLE --role-session-name testSession${session_id} --duration-seconds 3600)
    if [ -z $(echo $creds | jq -c -r '.AssumedRoleUser.Arn') ]; then
        echo "Unable to assume parent e2e account role."
        return
    fi
    echo "Using account credentials for $(echo $creds | jq -c -r '.AssumedRoleUser.Arn')"
    export AWS_ACCESS_KEY_ID=$(echo $creds | jq -c -r ".Credentials.AccessKeyId")
    export AWS_SECRET_ACCESS_KEY=$(echo $creds | jq -c -r ".Credentials.SecretAccessKey")
    export AWS_SESSION_TOKEN=$(echo $creds | jq -c -r ".Credentials.SessionToken")
}



function _lsOut {
    ls ..
    ls ~
}
function _build {
    echo Windows Build
    yarn run production-build
    yarn build-tests
}
function _saveBuild {
    _lsOut
    storeCache $CODEBUILD_SRC_DIR repo-windows
}
function _install_packaged_cli_win {
    echo Install Amplify Packaged CLI to PATH
    # rename the command to amplify
    cd $CODEBUILD_SRC_DIR/out
    cp amplify-pkg-win-x64.exe amplify.exe

    echo Move to CLI Binary to already existing PATH
    # This is a Hack to make sure the Amplify CLI is in the PATH

    cp $CODEBUILD_SRC_DIR/out/amplify.exe /AppData/Local/Microsoft/WindowsApps
    ls /AppData/Local/Microsoft/WindowsApps

    # reset working directory
    cd $CODEBUILD_SRC_DIR
}


function _scanArtifacts {
    if ! yarn ts-node .circleci/scan_artifacts_codebuild.ts; then
        echo "Cleaning the repository"
        git clean -fdx
        exit 1
    fi
}
